import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string) => {
    if (typeof process !== 'undefined' && process.env?.[name]) {
        return process.env[name];
    }
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.[name]) {
        // @ts-ignore
        return import.meta.env[name];
    }
    return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

