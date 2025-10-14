import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get config from expo constants with fallbacks
const getExtraConfig = (key: string, fallback: string) => {
    const extra = Constants.expoConfig?.extra || (Constants as any).manifest?.extra || {};
    return extra[key] || fallback;
};

const supabaseUrl = getExtraConfig('SUPABASE_URL', '');
const supabaseAnonKey = getExtraConfig('SUPABASE_ANON_KEY', '');

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.');
}

// Initialize Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

export default supabase;

