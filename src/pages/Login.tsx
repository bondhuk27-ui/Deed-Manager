import React from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const Login = () => {
  const { user, login, loading, isAdmin } = useAuth();

  if (loading) return null;
  if (user && isAdmin) return <Navigate to="/" />;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <LogIn className="text-primary" size={24} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Login</CardTitle>
          <CardDescription>
            Deed Account Manager এ লগইন করতে নিচের বাটনে ক্লিক করুন।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && !isAdmin && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg text-center font-medium">
              আপনার ইমেইল ({user.email}) অনুমোদিত নয়।
            </div>
          )}
          <Button 
            onClick={login} 
            className="w-full h-12 text-lg font-semibold gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google দিয়ে লগইন করুন
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            শুধুমাত্র অনুমোদিত এডমিন লগইন করতে পারবেন।
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
