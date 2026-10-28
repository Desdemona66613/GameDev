/**
 * ⚠️ PLACEHOLDER — replace with generated types before writing real queries.
 *
 * Generate from your actual Supabase schema:
 *   npm run db:types
 * (requires `npx supabase login` + `npx supabase link --project-ref <ref>`,
 *  or use `--local` against a local dev stack)
 *
 * Never edit the generated file by hand. Regenerate after every migration.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        // Stub matching the Supabase table defaults — regenerate to get real columns.
        Row: { id: number; created_at: string };
        Insert: { id?: number; created_at?: string };
        Update: { id?: number; created_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
