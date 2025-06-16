import { create } from 'zustand';
import { User } from '../types';
import { getCurrentUser, signIn, signOut, signUp } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,
  
  initialize: async () => {
    set({ loading: true });
    try {
      const { user, error } = await getCurrentUser();
      
      if (error) {
        set({ error: error.message, loading: false, initialized: true });
        return;
      }
      
      if (user) {
        set({ 
          user: { 
            id: user.id, 
            email: user.email || '',
            name: user.user_metadata?.name
          }, 
          loading: false,
          initialized: true 
        });
      } else {
        set({ user: null, loading: false, initialized: true });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false,
        initialized: true 
      });
    }
  },
  
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      if (data?.user) {
        set({ 
          user: { 
            id: data.user.id, 
            email: data.user.email || '',
            name: data.user.user_metadata?.name
          }, 
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  register: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await signUp(email, password);
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      if (data?.user) {
        set({ 
          user: { 
            id: data.user.id, 
            email: data.user.email || '',
            name: data.user.user_metadata?.name
          }, 
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  logout: async () => {
    set({ loading: true });
    try {
      await signOut();
      set({ user: null, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  }
}));