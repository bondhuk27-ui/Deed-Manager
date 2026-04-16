import React, { useEffect, useState } from 'react';
import { db, collection, onSnapshot, query, orderBy } from '@/src/firebase';
import { DeedEntry } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  BarChart3, 
  DollarSign,
  PieChart,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  startOfDay,
  endOfDay,
  startOfWeek, 
  endOfWeek,
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  subYears,
  isWithinInterval,
  format
} from 'date-fns';
import { cn } from '@/lib/utils';

const Income = () => {
  const [entries, setEntries] = useState<DeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'entries'), orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, 
      (s) => {
        setEntries(s.docs.map(d => ({ id: d.id, ...d.data() })) as DeedEntry[]);
        setLoading(false);
      },
      (error) => {
        console.error("Income Snapshot Error:", error);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const calculateIncome = (start: Date, end: Date) => {
    return entries
      .filter(e => {
        const date = new Date(e.date);
        return isWithinInterval(date, { start, end });
      })
      .reduce((sum, e) => sum + (e.totalAmount - (e.serviceCost || 0)), 0);
  };

  const now = new Date();
  
  const stats = [
    { 
      label: 'আজকের আয়', 
      amount: calculateIncome(startOfDay(now), endOfDay(now)),
      icon: DollarSign,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100'
    },
    { 
      label: 'এই সপ্তাহ', 
      amount: calculateIncome(startOfWeek(now), endOfWeek(now)),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    { 
      label: 'এই মাস', 
      amount: calculateIncome(startOfMonth(now), endOfMonth(now)),
      icon: Calendar,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100'
    },
    { 
      label: 'এই বছর', 
      amount: calculateIncome(startOfYear(now), endOfYear(now)),
      icon: BarChart3,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100'
    },
    { 
      label: 'বিগত বছর', 
      amount: calculateIncome(startOfYear(subYears(now, 1)), endOfYear(subYears(now, 1))),
      icon: PieChart,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100'
    },
  ];

  return (
    <div className="space-y-10 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-4xl font-black tracking-tight animated-gradient-text">আয়ের বিস্তারিত হিসাব</h2>
        <p className="text-slate-500 font-medium mt-1">নিজস্ব খরচ বাদ দিয়ে আজকের, সাপ্তাহিক, মাসিক এবং বাৎসরিক নিট আয়ের বিবরনী এখানে দেখুন।</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={cn("border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden", stat.bg, "border", stat.border)}>
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm bg-white")}>
                    <stat.icon size={24} className={stat.color} />
                  </div>
                  <div className="p-2 bg-white/50 rounded-xl">
                    <ArrowUpRight size={16} className={stat.color} />
                  </div>
                </div>
                <p className={cn("text-xs font-black uppercase tracking-widest mb-1 opacity-70", stat.color)}>{stat.label}</p>
                <h3 className={cn("text-3xl font-black tracking-tight", stat.color)}>{stat.amount} ৳</h3>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="xl:col-span-2"
        >
          <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <DollarSign size={20} />
                </div>
                সাম্প্রতিক আয়ের তালিকা
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-white shadow-sm">
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">তারিখ</th>
                      <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">বিবরণ</th>
                      <th className="px-4 py-5 text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">মোট</th>
                      <th className="px-4 py-5 text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">খরচ</th>
                      <th className="px-8 py-5 text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">নিট আয়</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {entries.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-black font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{e.date}</span>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">{e.serviceType}</span>
                            {e.description && <span className="text-[10px] text-slate-400 italic">{e.description}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-5 text-right text-slate-500 text-xs">{e.totalAmount} ৳</td>
                        <td className="px-4 py-5 text-right text-rose-500 text-xs">{e.serviceCost || 0} ৳</td>
                        <td className="px-8 py-5 text-right font-black text-emerald-600">{e.totalAmount - (e.serviceCost || 0)} ৳</td>
                      </tr>
                    ))}
                    {entries.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold">কোনো এন্ট্রি পাওয়া যায়নি</td>
                      </tr>
                    )}
                    {loading && (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                          <div className="flex justify-center">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 text-white h-full">
            <CardContent className="p-10 flex flex-col h-full">
              <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-8">
                <TrendingUp size={32} />
              </div>
              <h3 className="text-3xl font-black mb-4 leading-tight">আয়ের লক্ষ্যমাত্রা ও বিশ্লেষণ</h3>
              <p className="text-indigo-100 font-medium mb-8">আপনার ব্যবসার আয়ের গতিধারা পর্যবেক্ষণ করুন এবং ভবিষ্যৎ পরিকল্পনা করুন।</p>
              
              <div className="space-y-6 mt-auto">
                <div className="p-6 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">মোট এন্ট্রি সংখ্যা</p>
                  <p className="text-3xl font-black">{entries.length} টি</p>
                </div>
                <div className="p-6 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">গড় আয় (প্রতি এন্ট্রি)</p>
                  <p className="text-3xl font-black">
                    {entries.length > 0 ? Math.round(entries.reduce((s, e) => s + (e.totalAmount - (e.serviceCost || 0)), 0) / entries.length) : 0} ৳
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Income;
