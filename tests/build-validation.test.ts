/**
 * Email Service Build Validation Tests
 * 
 * Stop the TypeScript interface bullshit we keep hitting
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

describe('Email Service - Build Validation', () => {
  
  it('should compile TypeScript without errors', () => {
    expect(() => {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
    }).not.toThrow();
  });

  it('should have proper Dockerfile for TypeScript build', () => {
    const dockerfile = readFileSync('Dockerfile', 'utf-8');
    
    // Should install ALL dependencies first
    expect(dockerfile).toContain('npm install');
    expect(dockerfile).not.toContain('npm install --omit=dev');
    
    // Should build BEFORE pruning
    expect(dockerfile).toContain('npm run build');
    expect(dockerfile).toContain('npm prune --omit=dev');
  });

  it('should have all TypeScript interfaces properly defined', () => {
    const clientFile = readFileSync('src/services/coach-artie-client.ts', 'utf-8');
    
    // Check CoachArtieRequest interface has all needed fields
    expect(clientFile).toContain('interface CoachArtieRequest');
    expect(clientFile).toContain('metadata?:');
    expect(clientFile).toContain('originalEmail?:');
    
    // Check the interface allows all fields used in webhook
    const webhookFile = readFileSync('src/handlers/email-webhook.ts', 'utf-8');
    
    // If webhook uses originalEmail, interface must define it
    if (webhookFile.includes('originalEmail:')) {
      expect(clientFile).toContain('originalEmail?:');
    }
  });

  it('should build without interface mismatches', () => {
    expect(() => {
      execSync('npm run build', { stdio: 'pipe' });
    }).not.toThrow();
    
    // Check critical files were built
    expect(existsSync('dist/index.js')).toBe(true);
    expect(existsSync('dist/handlers/email-webhook.js')).toBe(true);
    expect(existsSync('dist/services/coach-artie-client.js')).toBe(true);
  });

  it('should start without import/interface errors', (done) => {
    const { spawn } = require('child_process');
    
    // Build first
    execSync('npm run build', { stdio: 'pipe' });
    
    const env = {
      ...process.env,
      CAPABILITIES_URL: 'http://test',
      WEBHOOK_SECRET: 'test',
      NODE_ENV: 'test'
    };
    
    const server = spawn('node', ['dist/index.js'], { 
      env,
      stdio: 'pipe'
    });
    
    let output = '';
    
    server.stdout.on('data', (data: Buffer) => {
      output += data.toString();
      if (output.includes('Email service listening') || output.includes('Server started')) {
        server.kill();
        done();
      }
    });
    
    server.stderr.on('data', (data: Buffer) => {
      const error = data.toString();
      
      // Ignore connection errors 
      if (error.includes('ECONNREFUSED')) return;
      
      // Fail on module/interface errors
      if (error.includes('Cannot find module') || 
          error.includes('SyntaxError') ||
          error.includes('does not exist in type')) {
        server.kill();
        done(new Error(`Email startup failed: ${error}`));
      }
    });
    
    setTimeout(() => {
      server.kill();
      done(new Error('Email startup timeout'));
    }, 10000);
  }, 15000);

  it('should have all webhook interface fields defined', () => {
    // Read the webhook handler
    const webhookContent = readFileSync('src/handlers/email-webhook.ts', 'utf-8');
    
    // Find all metadata fields being used
    const metadataMatches = webhookContent.match(/metadata:\s*{[^}]+}/s);
    if (!metadataMatches) return;
    
    const metadataBlock = metadataMatches[0];
    const fields = metadataBlock.match(/(\w+):/g) || [];
    
    // Check interface defines all used fields
    const interfaceContent = readFileSync('src/services/coach-artie-client.ts', 'utf-8');
    
    fields.forEach(field => {
      const fieldName = field.replace(':', '');
      expect(interfaceContent, `Missing interface field: ${fieldName}`).toContain(`${fieldName}?:`);
    });
  });

  it('should have typescript as dev dependency', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    
    expect(packageJson.devDependencies).toHaveProperty('typescript');
    expect(packageJson.scripts).toHaveProperty('build');
    expect(packageJson.scripts.build).toContain('tsc');
  });
});