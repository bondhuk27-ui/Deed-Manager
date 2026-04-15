import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Sparkles, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

const Login = () => {
  const { user, login, loginWithEmail, logout, loading, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailLogin, setIsEmailLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return null;
  if (user && isAdmin) return <Navigate to="/" />;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("ইমেইল এবং পাসওয়ার্ড প্রদান করুন");
      return;
    }
    setIsSubmitting(true);
    try {
      const trimmedEmail = email.trim();
      await loginWithEmail(trimmedEmail, password);
      toast.success("লগইন সফল হয়েছে");
    } catch (error: any) {
      console.error("Login Error Details:", error);
      let message = "লগইন ব্যর্থ হয়েছে। ইমেইল বা পাসওয়ার্ড চেক করুন।";
      if (error.code === 'auth/user-not-found') message = "এই ইমেইল দিয়ে কোনো ইউজার পাওয়া যায়নি।";
      if (error.code === 'auth/wrong-password') message = "ভুল পাসওয়ার্ড দিয়েছেন।";
      if (error.code === 'auth/invalid-email') message = "ইমেইল এড্রেসটি সঠিক নয়।";
      if (error.code === 'auth/operation-not-allowed') message = "ইমেইল/পাসওয়ার্ড লগইন অপশনটি Firebase কনসোলে এনাবল করা নেই।";
      if (error.code === 'auth/too-many-requests') message = "অতিরিক্ত চেষ্টার কারণে অ্যাকাউন্টটি সাময়িকভাবে লক করা হয়েছে। পরে চেষ্টা করুন।";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await login();
      toast.success("Google লগইন সফল হয়েছে");
    } catch (error: any) {
      console.error("Google Login Error:", error);
      toast.error("Google লগইন ব্যর্থ হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="border-none shadow-2xl shadow-indigo-500/10 rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl border border-white/20">
          <CardHeader className="text-center p-8 pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-200">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-slate-800">এডমিন লগইন</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Deed Account Manager এ প্রবেশ করতে আপনার তথ্য দিন।
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            {user && !isAdmin && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-2xl text-center font-bold"
              >
                আপনার ইমেইল ({user.email}) অনুমোদিত নয়।
              </motion.div>
            )}

            {isEmailLogin ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ইমেইল এড্রেস</Label>
                  <div className="relative">
                    <Input 
                      type="email" 
                      placeholder="example@gmail.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500 pl-10"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">পাসওয়ার্ড</Label>
                  <div className="relative">
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500 pl-10"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 text-lg font-black rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-xl hover:shadow-indigo-200 transition-all duration-300"
                >
                  {isSubmitting ? "লগইন হচ্ছে..." : "লগইন করুন"}
                </Button>
              </form>
            ) : (
              <Button 
                onClick={handleGoogleLogin} 
                disabled={isSubmitting}
                variant="outline"
                className="w-full h-14 text-lg font-black rounded-2xl border-slate-100 bg-white hover:bg-slate-50 gap-3 transition-all duration-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google দিয়ে লগইন করুন
              </Button>
            )}

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">অথবা</span>
              </div>
            </div>

            <Button 
              variant="ghost" 
              onClick={() => setIsEmailLogin(!isEmailLogin)}
              className="w-full h-12 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50"
            >
              {isEmailLogin ? "Google দিয়ে লগইন করতে চান?" : "ইমেইল দিয়ে লগইন করতে চান?"}
            </Button>

            {user && (
              <Button 
                variant="ghost" 
                onClick={async () => {
                  await logout();
                  toast.success("লগআউট সফল হয়েছে");
                }}
                className="w-full h-10 rounded-xl text-[10px] font-bold text-rose-500 hover:bg-rose-50 mt-2"
              >
                লগআউট করে অন্য অ্যাকাউন্টে চেষ্টা করুন
              </Button>
            )}

            <div className="flex items-center justify-center gap-2 pt-4">
              <Sparkles size={14} className="text-amber-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Secure Admin Access Only
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
