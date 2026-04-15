import React, { useEffect, useState } from 'react';
import { db, collection, onSnapshot } from '@/src/firebase';
import { Writer, DeedEntry, Payment, WriterSummary } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  FileText, 
  Wallet, 
  TrendingUp, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [entries, setEntries] = useState<DeedEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubWriters = onSnapshot(collection(db, 'writers'), 
      (s) => setWriters(s.docs.map(d => ({id: d.id, ...d.data()})) as Writer[]),
      (err) => console.error("Writers Snapshot Error:", err)
    );
    const unsubEntries = onSnapshot(collection(db, 'entries'), 
      (s) => setEntries(s.docs.map(d => ({id: d.id, ...d.data()})) as DeedEntry[]),
      (err) => console.error("Entries Snapshot Error:", err)
    );
    const unsubPayments = onSnapshot(collection(db, 'payments'), 
      (s) => setPayments(s.docs.map(d => ({id: d.id, ...d.data()})) as Payment[]),
      (err) => console.error("Payments Snapshot Error:", err)
    );
    
    setLoading(false);
    return () => { unsubWriters(); unsubEntries(); unsubPayments(); };
  }, []);

  const summaries: WriterSummary[] = writers.map(writer => {
    const writerEntries = entries.filter(e => e.writerId === writer.id);
    const writerPayments = payments.filter(p => p.writerId === writer.id);
    
    const totalDeeds = writerEntries.reduce((sum, e) => sum + e.deedCount, 0);
    const totalEarned = writerEntries.reduce((sum, e) => sum + e.totalAmount, 0);
    const totalPaid = writerPayments.reduce((sum, p) => sum + p.amount, 0);
    const currentBalance = (writer.previousBalance || 0) + totalEarned - totalPaid;

    return {
      writer,
      totalDeeds,
      totalEarned,
      totalPaid,
      currentBalance
    };
  });

  const totalEarnedAll = summaries.reduce((sum, s) => sum + s.totalEarned, 0);
  const totalPaidAll = summaries.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalBalanceAll = summaries.reduce((sum, s) => sum + s.currentBalance, 0);

  const [lockedStats, setLockedStats] = useState<Record<number, boolean>>({});

  const toggleLock = (index: number) => {
    setLockedStats(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const stats = [
    { label: 'মোট লেখক', value: writers.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', shadow: 'shadow-indigo-500/10' },
    { label: 'মোট কাজের টাকা', value: `${totalEarnedAll} ৳`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', shadow: 'shadow-emerald-500/10' },
    { label: 'মোট পরিশোধ', value: `${totalPaidAll} ৳`, icon: Wallet, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', shadow: 'shadow-violet-500/10' },
    { label: 'মোট বকেয়া', value: `${totalBalanceAll} ৳`, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', shadow: 'shadow-amber-500/10' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-10 pb-10">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-4xl font-black tracking-tight animated-gradient-text">ড্যাশবোর্ড</h2>
          <p className="text-slate-500 font-medium mt-1">আপনার ব্যবসার বর্তমান অবস্থা একনজরে দেখুন।</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Sparkles size={16} />
          </div>
          <span className="text-xs font-bold text-slate-600 pr-2">আজকের আপডেট</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            variants={item}
            onClick={() => toggleLock(i)}
            className="group cursor-pointer"
          >
            <Card className={cn(
              "border-none shadow-xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 relative overflow-hidden", 
              stat.shadow,
              lockedStats[i] && "ring-2 ring-indigo-500/20"
            )}>
              <CardContent className="p-6 flex items-center gap-5">
                <div className={cn("p-4 rounded-2xl shadow-inner transition-transform duration-500 group-hover:scale-110", stat.bg)}>
                  <stat.icon className={stat.color} size={28} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <div className="relative h-8 flex items-center">
                    <motion.h3 
                      initial={false}
                      animate={{ 
                        opacity: lockedStats[i] ? 1 : 0,
                        filter: lockedStats[i] ? "blur(0px)" : "blur(8px)",
                        y: lockedStats[i] ? 0 : 5
                      }}
                      whileHover={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                      className="text-2xl font-black text-slate-800"
                    >
                      {stat.value}
                    </motion.h3>
                    <AnimatePresence>
                      {!lockedStats[i] && (
                        <motion.div 
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center group-hover:opacity-0 transition-opacity duration-300 pointer-events-none"
                        >
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(dot => (
                              <div key={dot} className="w-2 h-2 rounded-full bg-slate-200 animate-pulse" style={{ animationDelay: `${dot * 0.1}s` }} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className={cn(
                  "absolute top-3 right-3 transition-opacity duration-300",
                  lockedStats[i] ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    lockedStats[i] ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" : "bg-slate-300"
                  )} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Summary Table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-black text-slate-800">লেখক অনুযায়ী হিসাব</CardTitle>
              <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs border-slate-200">বিস্তারিত রিপোর্ট</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                    <TableHead className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">লেখকের নাম</TableHead>
                    <TableHead className="text-center font-bold text-slate-400 uppercase tracking-widest text-[10px]">মোট কাজ</TableHead>
                    <TableHead className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">মোট পাওনা</TableHead>
                    <TableHead className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">মোট পেমেন্ট</TableHead>
                    <TableHead className="text-right px-8 font-bold text-slate-400 uppercase tracking-widest text-[10px]">বর্তমান বকেয়া</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-slate-400 font-bold">লোড হচ্ছে...</span>
                      </div>
                    </TableCell></TableRow>
                  ) : summaries.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400 font-bold">কোনো তথ্য পাওয়া যায়নি</TableCell></TableRow>
                  ) : (
                    summaries.map((s, idx) => (
                      <TableRow key={s.writer.id} className="hover:bg-indigo-50/30 transition-colors border-slate-50">
                        <TableCell className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm">
                              {s.writer.name[0]}
                            </div>
                            <span className="font-bold text-slate-700">{s.writer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black bg-indigo-50 text-indigo-600">
                            {s.totalDeeds} টি
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-600">{s.totalEarned} ৳</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">{s.totalPaid} ৳</TableCell>
                        <TableCell className="text-right px-8">
                          <div className="flex flex-col items-end">
                            <span className={cn(
                              "font-black text-xl",
                              s.currentBalance > 0 ? "text-orange-500" : "text-emerald-500"
                            )}>
                              {s.currentBalance} ৳
                            </span>
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mt-1",
                              s.currentBalance > 0 ? "bg-orange-50 text-orange-500" : "bg-emerald-50 text-emerald-500"
                            )}>
                              {s.currentBalance > 0 ? "বকেয়া" : "পরিশোধিত"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
