import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !publicAnonKey) {
  console.error('Missing Supabase credentials');
}

/**
 * This is a special Supabase client for public access to certain operations.
 * 
 * It includes a custom header 'x-public-client' that can be used in Row Level Security
 * policies to allow anonymous users to update assignment completion status.
 * 
 * For this to work, you need to add a RLS policy in Supabase as described in SUPABASE_CONFIG.md
 */
export const publicSupabase = createClient(supabaseUrl, publicAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-public-client': 'true'
    }
  }
});

// Function to update assignment status for public users
export async function updatePublicAssignmentStatus(assignmentId: string, isCompleted: boolean) {
  const { data, error } = await publicSupabase
    .from('assignments')
    .update({ is_completed: isCompleted })
    .eq('id', assignmentId)
    .select()
    .single();
  
  return { data, error };
}
