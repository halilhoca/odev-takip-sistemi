export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Student {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  created_at: string;
  school?: string;
  grade?: string;
  phone?: string;
  parent_name?: string;
  parent_phone?: string;
  field?: string; // isteğe bağlı alan (sayısal, sözel vb.)
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface StudentBook {
  id: string;
  student_id: string;
  book_id: string;
  created_at: string;
}

export interface Program {
  id: string;
  user_id: string;
  title: string;
  is_scheduled: boolean;
  studentName?: string;
  date?: any;
  schedule?: {
    day: string;
    assignments?: {
      id: string;
      completed: boolean;
      title: string;
      time?: string;
    }[];
  }[];
  created_at: string;
  // Eklendi:
  assignments?: {
    id: string;
    is_completed: boolean;
    student_id: string;
    students?: { name: string };
  }[];
}

export interface Assignment {
  id: string;
  program_id: string;
  student_id: string;
  book_id: string;
  page_start: number;
  page_end: number;
  day: string;
  time?: string;
  is_completed: boolean;
  created_at: string;
}

export interface Stats {
  studentCount: number;
  bookCount: number;
  programCount: number;
}