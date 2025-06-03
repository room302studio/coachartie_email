export type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
export type Database = {
    public: {
        Tables: {
            config: {
                Row: {
                    config_key: string;
                    config_value: string;
                    created_at: string;
                    history: Json;
                    id: number;
                    notes: string | null;
                };
                Insert: {
                    config_key: string;
                    config_value: string;
                    created_at?: string;
                    history?: Json;
                    id?: number;
                    notes?: string | null;
                };
                Update: {
                    config_key?: string;
                    config_value?: string;
                    created_at?: string;
                    history?: Json;
                    id?: number;
                    notes?: string | null;
                };
                Relationships: [];
            };
            logs: {
                Row: {
                    id: number;
                    level: string | null;
                    message: string | null;
                    service: string | null;
                    timestamp: string;
                };
                Insert: {
                    id?: number;
                    level?: string | null;
                    message?: string | null;
                    service?: string | null;
                    timestamp?: string;
                };
                Update: {
                    id?: number;
                    level?: string | null;
                    message?: string | null;
                    service?: string | null;
                    timestamp?: string;
                };
                Relationships: [];
            };
            memories: {
                Row: {
                    conversation_id: string | null;
                    created_at: string | null;
                    embedding: string | null;
                    embedding2: string | null;
                    embedding3: string | null;
                    id: number;
                    key: string | null;
                    memory_type: string | null;
                    metadata: Json | null;
                    related_message_id: number | null;
                    resource_id: string | null;
                    user_id: string | null;
                    value: string | null;
                };
                Insert: {
                    conversation_id?: string | null;
                    created_at?: string | null;
                    embedding?: string | null;
                    embedding2?: string | null;
                    embedding3?: string | null;
                    id?: never;
                    key?: string | null;
                    memory_type?: string | null;
                    metadata?: Json | null;
                    related_message_id?: number | null;
                    resource_id?: string | null;
                    user_id?: string | null;
                    value?: string | null;
                };
                Update: {
                    conversation_id?: string | null;
                    created_at?: string | null;
                    embedding?: string | null;
                    embedding2?: string | null;
                    embedding3?: string | null;
                    id?: never;
                    key?: string | null;
                    memory_type?: string | null;
                    metadata?: Json | null;
                    related_message_id?: number | null;
                    resource_id?: string | null;
                    user_id?: string | null;
                    value?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "memories_related_message_id_fkey";
                        columns: ["related_message_id"];
                        isOneToOne: false;
                        referencedRelation: "messages";
                        referencedColumns: ["id"];
                    }
                ];
            };
            messages: {
                Row: {
                    channel_id: string | null;
                    created_at: string | null;
                    email_metadata: Json | null;
                    embedding: string | null;
                    guild_id: string | null;
                    id: number;
                    message_type: string | null;
                    response_id: number | null;
                    user_id: string | null;
                    value: string | null;
                };
                Insert: {
                    channel_id?: string | null;
                    created_at?: string | null;
                    email_metadata?: Json | null;
                    embedding?: string | null;
                    guild_id?: string | null;
                    id?: number;
                    message_type?: string | null;
                    response_id?: number | null;
                    user_id?: string | null;
                    value?: string | null;
                };
                Update: {
                    channel_id?: string | null;
                    created_at?: string | null;
                    email_metadata?: Json | null;
                    embedding?: string | null;
                    guild_id?: string | null;
                    id?: number;
                    message_type?: string | null;
                    response_id?: number | null;
                    user_id?: string | null;
                    value?: string | null;
                };
                Relationships: [];
            };
            prompts: {
                Row: {
                    active: boolean | null;
                    archived: boolean | null;
                    created_at: string;
                    history: Json | null;
                    id: number;
                    notes: string | null;
                    prompt_name: string | null;
                    prompt_text: string | null;
                    type: string | null;
                    updated_at: string;
                };
                Insert: {
                    active?: boolean | null;
                    archived?: boolean | null;
                    created_at?: string;
                    history?: Json | null;
                    id?: number;
                    notes?: string | null;
                    prompt_name?: string | null;
                    prompt_text?: string | null;
                    type?: string | null;
                    updated_at?: string;
                };
                Update: {
                    active?: boolean | null;
                    archived?: boolean | null;
                    created_at?: string;
                    history?: Json | null;
                    id?: number;
                    notes?: string | null;
                    prompt_name?: string | null;
                    prompt_text?: string | null;
                    type?: string | null;
                    updated_at?: string;
                };
                Relationships: [];
            };
            queue: {
                Row: {
                    assigned_to: string | null;
                    completed_at: string | null;
                    created_at: string;
                    created_by: string | null;
                    error_message: string | null;
                    id: number;
                    max_retries: number;
                    memorized: boolean | null;
                    metadata: Json | null;
                    payload: Json;
                    priority: number;
                    respond_to: Json | null;
                    responded: boolean | null;
                    retries: number;
                    scheduled_for: string | null;
                    started_at: string | null;
                    status: Database["public"]["Enums"]["task_status"];
                    task_type: string;
                    updated_at: string;
                };
                Insert: {
                    assigned_to?: string | null;
                    completed_at?: string | null;
                    created_at?: string;
                    created_by?: string | null;
                    error_message?: string | null;
                    id?: number;
                    max_retries?: number;
                    memorized?: boolean | null;
                    metadata?: Json | null;
                    payload: Json;
                    priority?: number;
                    respond_to?: Json | null;
                    responded?: boolean | null;
                    retries?: number;
                    scheduled_for?: string | null;
                    started_at?: string | null;
                    status?: Database["public"]["Enums"]["task_status"];
                    task_type: string;
                    updated_at?: string;
                };
                Update: {
                    assigned_to?: string | null;
                    completed_at?: string | null;
                    created_at?: string;
                    created_by?: string | null;
                    error_message?: string | null;
                    id?: number;
                    max_retries?: number;
                    memorized?: boolean | null;
                    metadata?: Json | null;
                    payload?: Json;
                    priority?: number;
                    respond_to?: Json | null;
                    responded?: boolean | null;
                    retries?: number;
                    scheduled_for?: string | null;
                    started_at?: string | null;
                    status?: Database["public"]["Enums"]["task_status"];
                    task_type?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            todos: {
                Row: {
                    created_at: string;
                    data: Json | null;
                    description: string | null;
                    id: number;
                    name: string | null;
                };
                Insert: {
                    created_at?: string;
                    data?: Json | null;
                    description?: string | null;
                    id?: number;
                    name?: string | null;
                };
                Update: {
                    created_at?: string;
                    data?: Json | null;
                    description?: string | null;
                    id?: number;
                    name?: string | null;
                };
                Relationships: [];
            };
            user_identities: {
                Row: {
                    created_at: string | null;
                    discord_id: string | null;
                    display_name: string;
                    email: string | null;
                    id: string;
                    metadata: Json | null;
                    phone_number: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    discord_id?: string | null;
                    display_name: string;
                    email?: string | null;
                    id?: string;
                    metadata?: Json | null;
                    phone_number?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    discord_id?: string | null;
                    display_name?: string;
                    email?: string | null;
                    id?: string;
                    metadata?: Json | null;
                    phone_number?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            create_cron_job: {
                Args: {
                    _schedule: string;
                    _command: string;
                    _description: string;
                };
                Returns: undefined;
            };
            get_next_task: {
                Args: {
                    worker_id: string;
                } | {
                    worker_id: string;
                };
                Returns: {
                    id: number;
                    task_type: string;
                    payload: Json;
                    priority: number;
                    scheduled_for: string;
                }[];
            };
            hnswhandler: {
                Args: {
                    "": unknown;
                };
                Returns: unknown;
            };
            ivfflathandler: {
                Args: {
                    "": unknown;
                };
                Returns: unknown;
            };
            list_scheduled_jobs: {
                Args: Record<PropertyKey, never>;
                Returns: {
                    job_id: number;
                    schedule: string;
                    command: string;
                    next_run: string;
                    last_run: string;
                    last_successful_run: string;
                    comment: string;
                }[];
            };
            match_memories: {
                Args: {
                    query_embedding: string;
                    match_threshold: number;
                    match_count: number;
                } | {
                    query_embedding: string;
                    match_threshold: number;
                    match_count: number;
                    p_user_id: string;
                };
                Returns: {
                    id: number;
                    value: string;
                    similarity: number;
                    created_at: string;
                    memory_type: string;
                    metadata: Json;
                }[];
            };
            schedule_custom_job: {
                Args: {
                    job_name: string;
                    schedule_pattern: string;
                    job_command: string;
                };
                Returns: undefined;
            };
            schedule_task: {
                Args: {
                    _schedule: string;
                    _command: string;
                };
                Returns: undefined;
            };
            vector_avg: {
                Args: {
                    "": number[];
                };
                Returns: string;
            };
            vector_dims: {
                Args: {
                    "": string;
                };
                Returns: number;
            };
            vector_norm: {
                Args: {
                    "": string;
                };
                Returns: number;
            };
            vector_out: {
                Args: {
                    "": string;
                };
                Returns: unknown;
            };
            vector_send: {
                Args: {
                    "": string;
                };
                Returns: string;
            };
            vector_typmod_in: {
                Args: {
                    "": unknown[];
                };
                Returns: number;
            };
        };
        Enums: {
            task_status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
type DefaultSchema = Database[Extract<keyof Database, "public">];
export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | {
    schema: keyof Database;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
} ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
} ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
    Row: infer R;
} ? R : never : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
    Row: infer R;
} ? R : never : never;
export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof Database;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
} ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
} ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
} ? I : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I;
} ? I : never : never;
export type TablesUpdate<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof Database;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
} ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
} ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
} ? U : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U;
} ? U : never : never;
export type Enums<DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | {
    schema: keyof Database;
}, EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
} ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never = never> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
} ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName] : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] : never;
export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | {
    schema: keyof Database;
}, CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
} ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never = never> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
} ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName] : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] : never;
export declare const Constants: {
    readonly public: {
        readonly Enums: {
            readonly task_status: readonly ["pending", "in_progress", "completed", "failed", "cancelled"];
        };
    };
};
export {};
