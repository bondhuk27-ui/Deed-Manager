import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  FileEdit, 
  CreditCard, 
  BarChart3, 
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Income', path: '/income', icon: BarChart3 },
    { label: 'Writers', path: '/writers', icon: Users },
    { label: 'Daily Entry', path: '/entries', icon: FileEdit },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user || !isAdmin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-indigo-50 sticky top-0 h-screen shadow-2xl shadow-indigo-500/5">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <FileEdit className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                Deed Manager
              </h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-400/80">Admin Console</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-4">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden",
                  isActive
                    ? "text-white shadow-lg shadow-indigo-200"
                    : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="nav-glow"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon size={18} className={cn("relative z-10 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600")} />
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <motion.div 
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white/40 z-10"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-12 rounded-2xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-300"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span className="font-semibold">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <FileEdit className="text-white" size={16} />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800">Deed Manager</h1>
        </div>
        <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-20 p-6 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl text-lg font-medium",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground bg-gray-50"
              )}
            >
              <item.icon size={24} />
              {item.label}
            </Link>
          ))}
          <Button 
            variant="outline" 
            className="w-full h-14 rounded-xl gap-3 text-destructive border-destructive/20"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            Logout
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
      <Toaster position="top-right" />
    </div>
  );
};

export default Layout;
