import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          due_date: string;
          due_time: string;
          status: 'pending' | 'completed' | 'failed';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      submissions: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          submission_type: 'photo' | 'text' | 'audio';
          content_url: string | null;
          text_content: string | null;
          ai_verdict: 'approved' | 'rejected' | null;
          ai_reasoning: string | null;
          submitted_at: string;
        };
        Insert: Omit<Database['public']['Tables']['submissions']['Row'], 'id' | 'submitted_at'>;
        Update: Partial<Database['public']['Tables']['submissions']['Insert']>;
      };
    };
  };
};
