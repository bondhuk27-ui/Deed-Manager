import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Lazy load components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Writers = React.lazy(() => import('./pages/Writers'));
const AssistantWriters = React.lazy(() => import('./pages/AssistantWriters'));
const Entries = React.lazy(() => import('./pages/Entries'));
const Payments = React.lazy(() => import('./pages/Payments'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Login = React.lazy(() => import('./pages/Login'));
const Income = React.lazy(() => import('./pages/Income'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 text-center space-y-6 border border-slate-100">
          <div className="mx-auto w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
            <LogIn size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-800">অ্যাক্সেস ডিনাইড!</h1>
            <p className="text-slate-500 text-sm font-medium">আপনার ইমেইলটি এডমিন হিসেবে অনুমোদিত নয়।</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">লগইন করা ইমেইল:</p>
            <p className="text-sm font-bold text-slate-700">{user.email}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => logout()}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold"
            >
              অন্য অ্যাকাউন্টে লগইন করুন
            </Button>
            <p className="text-[10px] text-slate-400 font-medium">সঠিক ইমেইল দিয়ে লগইন করতে এডমিনের সাথে যোগাযোগ করুন।</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
              <Route path="/writers" element={<ProtectedRoute><Writers /></ProtectedRoute>} />
              <Route path="/assistant-writers" element={<ProtectedRoute><AssistantWriters /></ProtectedRoute>} />
              <Route path="/entries" element={<ProtectedRoute><Entries /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </React.Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
