import { supabase } from './supabaseClient';

// Demo account IDs (these should match the ones in the RLS policies)
const DEMO_TEACHER_ID = 'a02fead5-0acd-4eec-a0dc-45306d5043c5';
const DEMO_STUDENT_ID = 'd69a7de3-10f9-4718-9785-73114433fae9';

export async function createDemoAccounts() {
  try {
    // Create demo teacher account if it doesn't exist
    const { error: teacherError } = await supabase
      .from('users')
      .upsert({
        id: DEMO_TEACHER_ID,
        email: 'demo.teacher@aicademy.edu',
        full_name: 'Demo Teacher',
        role: 'teacher',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (teacherError) throw teacherError;

    // Create demo student account if it doesn't exist
    const { error: studentError } = await supabase
      .from('users')
      .upsert({
        id: DEMO_STUDENT_ID,
        email: 'demo.student@aicademy.edu',
        full_name: 'Demo Student',
        role: 'student',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (studentError) throw studentError;

    return { success: true };
  } catch (error) {
    console.error('Error creating demo accounts:', error);
    return { success: false, error };
  }
} 