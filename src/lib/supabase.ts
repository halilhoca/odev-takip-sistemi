import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  return { data, error };
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}

export async function getStudents(userId: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function getBooks(userId: string) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function getPrograms(userId: string) {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      assignments (
        student_id,
        students (name)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (data) {
    // Process the data to add studentName
    return {
      data: data.map(program => ({
        ...program,
        studentName: program.assignments?.[0]?.students?.name
      })),
      error
    };
  }
  
  return { data, error };
}

export async function createStudent(
  userId: string, 
  name: string, 
  email?: string,
  school?: string,
  grade?: string,
  phone?: string,
  parent_name?: string,
  parent_phone?: string,
  field?: string
) {
  const { data, error } = await supabase
    .from('students')
    .insert([{ 
      user_id: userId, 
      name, 
      email,
      school,
      grade,
      phone,
      parent_name,
      parent_phone,
      field
    }])
    .select()
    .single();
  
  return { data, error };
}

export async function createBook(userId: string, title: string) {
  const { data, error } = await supabase
    .from('books')
    .insert([{ user_id: userId, title }])
    .select()
    .single();
  
  return { data, error };
}

export async function assignBookToStudent(studentId: string, bookId: string) {
  const { data, error } = await supabase
    .from('student_books')
    .insert([{ student_id: studentId, book_id: bookId }])
    .select()
    .single();
  
  return { data, error };
}

export async function getStudentBooks(studentId: string) {
  const { data, error } = await supabase
    .from('student_books')
    .select(`
      id,
      book_id,
      books (
        id,
        title
      )
    `)
    .eq('student_id', studentId);
  
  return { data, error };
}

export async function createProgram(userId: string, title: string, isScheduled: boolean) {
  const { data, error } = await supabase
    .from('programs')
    .insert([{ user_id: userId, title, is_scheduled: isScheduled }])
    .select()
    .single();
  
  return { data, error };
}

export async function createAssignment(
  programId: string,
  studentId: string,
  bookId: string,
  pageStart: number,
  pageEnd: number,
  day: string,
  time?: string,
  note?: string
) {
  const { data, error } = await supabase
    .from('assignments')
    .insert([{
      program_id: programId,
      student_id: studentId,
      book_id: bookId,
      page_start: pageStart,
      page_end: pageEnd,
      day,
      time,
      note,
      is_completed: false
    }])
    .select()
    .single();
  
  return { data, error };
}

export async function getAssignmentsByProgram(programId: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      students (name),
      books (title)
    `)
    .eq('program_id', programId)
    .order('day');
  
  return { data, error };
}

export async function getStudentAssignments(studentId: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      programs (title, is_scheduled),
      books (title)
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function updateAssignmentStatus(assignmentId: string, isCompleted: boolean) {
  const { data, error } = await supabase
    .from('assignments')
    .update({ is_completed: isCompleted })
    .eq('id', assignmentId)
    .select()
    .single();
  
  return { data, error };
}

export async function deleteStudent(studentId: string) {
  // Önce öğrencinin kitaplarını silelim
  await supabase
    .from('student_books')
    .delete()
    .eq('student_id', studentId);

  // Öğrencinin görevlerini silelim
  await supabase
    .from('assignments')
    .delete()
    .eq('student_id', studentId);

  // Son olarak öğrenciyi silelim
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);
  
  return { error };
}

export async function deleteBook(bookId: string) {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId);
  
  return { error };
}

export async function deleteProgram(programId: string) {
  const { error } = await supabase
    .from('programs')
    .delete()
    .eq('id', programId);
  
  return { error };
}

export async function getStats(userId: string) {
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);
  
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);
  
  const { data: programs, error: programsError } = await supabase
    .from('programs')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);
  
  return {
    studentCount: students?.length || 0,
    bookCount: books?.length || 0,
    programCount: programs?.length || 0,
    error: studentsError || booksError || programsError
  };
}

export async function getRecentPrograms(userId: string, limit = 5) {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      assignments (
        id,
        is_completed,
        students (name)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return { data, error };
}