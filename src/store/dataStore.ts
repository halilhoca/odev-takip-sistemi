import { create } from 'zustand';
import { 
  Student, 
  Book, 
  Program, 
  Stats
} from '../types';
import { 
  getStudents, 
  getBooks, 
  getPrograms,
  createStudent,
  createBook,
  assignBookToStudent,
  createProgram,
  createAssignment,
  getStats as fetchStats,
  getRecentPrograms,
  deleteStudent as removeStudent,
  deleteBook as removeBook,
  deleteProgram as removeProgram,
  getStudentBooks,
  getStudentAssignments,
  updateAssignmentStatus,
  getAssignmentsByProgram,
  updateReadingStatus
} from '../lib/supabase';

interface DataState {
  students: Student[];
  books: Book[];
  programs: Program[];
  recentPrograms: Program[];
  currentStudent: Student | null;
  currentProgram: Program | null;
  studentBooks: any[];
  studentAssignments: any[];
  programAssignments: any[];
  stats: Stats;
  loading: boolean;
  error: string | null;
  
  fetchStudents: (userId: string) => Promise<void>;
  fetchBooks: (userId: string) => Promise<void>;
  fetchPrograms: (userId: string) => Promise<void>;
  fetchStats: (userId: string) => Promise<void>;
  fetchRecentPrograms: (userId: string) => Promise<void>;
  
  addStudent: (
    userId: string, 
    name: string, 
    email?: string,
    school?: string,
    grade?: string,
    phone?: string,
    parent_name?: string,
    parent_phone?: string,
    field?: string
  ) => Promise<Student | null>;
  addBook: (userId: string, title: string, author?: string, isStoryBook?: boolean, subject?: string) => Promise<Book | null>;
  assignBook: (studentId: string, bookId: string) => Promise<void>;
  addProgram: (userId: string, title: string, isScheduled: boolean) => Promise<Program | null>;
  addAssignment: (programId: string, studentId: string, bookId: string, 
                 pageStart: number, pageEnd: number, day: string, time?: string, note?: string) => Promise<void>;
  
  fetchStudentBooks: (studentId: string) => Promise<void>;
  fetchStudentAssignments: (studentId: string) => Promise<void>;
  fetchProgramAssignments: (programId: string) => Promise<void>;
  
  setCurrentStudent: (student: Student | null) => void;
  setCurrentProgram: (program: Program | null) => void;
  
  updateAssignment: (assignmentId: string, isCompleted: boolean) => Promise<void>;
  markBookAsRead: (studentId: string, bookId: string, readingDate?: string, notes?: string) => Promise<void>;
  
  removeStudent: (studentId: string) => Promise<void>;
  removeBook: (bookId: string) => Promise<void>;
  removeProgram: (programId: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  students: [],
  books: [],
  programs: [],
  recentPrograms: [],
  currentStudent: null,
  currentProgram: null,
  studentBooks: [],
  studentAssignments: [],
  programAssignments: [],
  stats: { studentCount: 0, bookCount: 0, programCount: 0 },
  loading: false,
  error: null,
  
  fetchStudents: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await getStudents(userId);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ students: data || [], loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  fetchBooks: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await getBooks(userId);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ books: data || [], loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  fetchPrograms: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await getPrograms(userId);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ programs: data || [], loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  fetchStats: async (userId) => {
    set({ loading: true });
    try {
      const { studentCount, bookCount, programCount, error } = await fetchStats(userId);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ 
        stats: { studentCount, bookCount, programCount }, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  fetchRecentPrograms: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await getRecentPrograms(userId);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ recentPrograms: data || [], loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  addStudent: async (
    userId, 
    name, 
    email,
    school,
    grade,
    phone,
    parent_name,
    parent_phone,
    field
  ) => {
    set({ loading: true });
    try {
      const { data, error } = await createStudent(
        userId, 
        name, 
        email,
        school,
        grade,
        phone,
        parent_name,
        parent_phone,
        field
      );
      
      if (error) {
        set({ error: error.message, loading: false });
        return null;
      }
      
      const updatedStudents = [...get().students, data];
      set({ students: updatedStudents, loading: false });
      return data;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
      return null;
    }
  },  addBook: async (userId: string, title: string, author?: string, isStoryBook?: boolean, subject?: string) => {
    set({ loading: true });
    try {
      console.log('🏪 DataStore: Kitap oluşturuluyor:', { userId, title, author, isStoryBook, subject });
      const { data, error } = await createBook(userId, title, author, isStoryBook, subject);
      
      if (error) {
        console.error('❌ DataStore: Kitap oluşturma hatası:', error);
        set({ error: error.message, loading: false });
        return null;
      }
      
      console.log('✅ DataStore: Kitap başarıyla oluşturuldu:', data);
      const updatedBooks = [...get().books, data];
      set({ books: updatedBooks, loading: false });
      return data;
    } catch (error) {
      console.error('❌ DataStore: Beklenmeyen hata:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false
      });
      return null;
    }
  },
  
  assignBook: async (studentId, bookId) => {
    set({ loading: true });
    try {
      const { error } = await assignBookToStudent(studentId, bookId);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  addProgram: async (userId, title, isScheduled) => {
    set({ loading: true });
    try {
      const { data, error } = await createProgram(userId, title, isScheduled);
      
      if (error) {
        set({ error: error.message, loading: false });
        return null;
      }
      
      const updatedPrograms = [...get().programs, data];
      set({ programs: updatedPrograms, loading: false });
      return data;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
      return null;
    }
  },
  
  addAssignment: async (programId, studentId, bookId, pageStart, pageEnd, day, time, note) => {
    set({ loading: true });
    try {
      const { error } = await createAssignment(
        programId, studentId, bookId, pageStart, pageEnd, day, time, note
      );
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  fetchStudentBooks: async (studentId) => {
    set({ loading: true });
    try {
      const { data, error } = await getStudentBooks(studentId);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ studentBooks: data || [], loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  fetchStudentAssignments: async (studentId) => {
    set({ loading: true });
    try {
      const { data, error } = await getStudentAssignments(studentId);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ studentAssignments: data || [], loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  fetchProgramAssignments: async (programId) => {
    set({ loading: true });
    try {
      const { data, error } = await getAssignmentsByProgram(programId);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ programAssignments: data || [], loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  setCurrentStudent: (student) => {
    set({ currentStudent: student });
  },
  
  setCurrentProgram: (program) => {
    set({ currentProgram: program });
  },
  
  updateAssignment: async (assignmentId, isCompleted) => {
    set({ loading: true });
    try {
      const { error } = await updateAssignmentStatus(assignmentId, isCompleted);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      // Update the local state
      const updatedAssignments = get().studentAssignments.map(assignment => 
        assignment.id === assignmentId 
          ? { ...assignment, is_completed: isCompleted } 
          : assignment
      );
      
      set({ studentAssignments: updatedAssignments, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
    markBookAsRead: async (studentId, bookId, readingDate, notes) => {
    set({ loading: true });
    try {
      const { error } = await updateReadingStatus(studentId, bookId, true, readingDate, notes);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  removeStudent: async (studentId) => {
    set({ loading: true });
    try {
      const { error } = await removeStudent(studentId);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      const updatedStudents = get().students.filter(student => student.id !== studentId);
      set({ students: updatedStudents, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  removeBook: async (bookId) => {
    set({ loading: true });
    try {
      const { error } = await removeBook(bookId);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      const updatedBooks = get().books.filter(book => book.id !== bookId);
      set({ books: updatedBooks, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  removeProgram: async (programId) => {
    set({ loading: true });
    try {
      const { error } = await removeProgram(programId);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      const updatedPrograms = get().programs.filter(program => program.id !== programId);
      set({ programs: updatedPrograms, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  }
}));