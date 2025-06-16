import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/students/StudentList';
import StudentDetail from './pages/students/StudentDetail';
import PublicReport from './pages/student/PublicReport';
import BookList from './pages/books/BookList';
import ProgramList from './pages/programs/ProgramList';
import CreateProgram from './pages/programs/CreateProgram';
import ProgramDetail from './pages/programs/ProgramDetail';
import StudentView from './pages/student/StudentView';
import ProgramView from './pages/student/ProgramView';

function App() {
  const { user, initialized, initialize } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/student/:studentId" element={<StudentView />} />
        <Route path="/program/:programId" element={<ProgramView />} />
        <Route path="/public-report/:studentId/:reportId" element={<PublicReport />} />
        
        {/* Protected routes */}
        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<StudentList />} />
          <Route path="/students/:studentId" element={<StudentDetail />} />
          <Route path="/books" element={<BookList />} />
          <Route path="/programs" element={<ProgramList />} />
          <Route path="/programs/new" element={<CreateProgram />} />
          <Route path="/programs/:programId" element={<ProgramDetail />} />
        </Route>
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;