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
  Sparkles,
  X,
  Clock,
  Share2,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import html2canvas from 'html2canvas';
import { useRef } from 'react';
import { toast } from 'sonner';

const Dashboard = () => {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [entries, setEntries] = useState<DeedEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [selectedWriterDetails, setSelectedWriterDetails] = useState<{ writerName: string, entries: DeedEntry[] } | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

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
    
    // Filter for today if toggled
    const displayEntries = showTodayOnly 
      ? writerEntries.filter(e => e.date === todayStr)
      : writerEntries;
    
    const displayPayments = showTodayOnly
      ? writerPayments.filter(p => p.date === todayStr)
      : writerPayments;

    const totalDeeds = displayEntries.reduce((sum, e) => sum + e.deedCount, 0);
    const totalEarned = displayEntries.reduce((sum, e) => sum + e.totalAmount, 0);
    const totalPaid = displayPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Balance is always total unless we specifically want "Today's Balance"
    // But usually balance means cumulative. Let's keep cumulative balance 
    // but show today's earned/paid if toggled.
    const cumulativeEarned = writerEntries.reduce((sum, e) => sum + e.totalAmount, 0);
    const cumulativePaid = writerPayments.reduce((sum, p) => sum + p.amount, 0);
    const currentBalance = (writer.previousBalance || 0) + cumulativeEarned - cumulativePaid;

    return {
      writer,
      totalDeeds,
      totalEarned,
      totalPaid,
      currentBalance
    };
  });

  const handleWriterClick = (writerId: string, writerName: string) => {
    const todayEntries = entries.filter(e => e.writerId === writerId && e.date === todayStr);
    setSelectedWriterDetails({ writerName, entries: todayEntries });
  };

  const handleShareWhatsApp = async () => {
    if (!reportRef.current || !selectedWriterDetails) return;
    
    setIsSharing(true);
    toast.loading("ইমেজ তৈরি হচ্ছে...");

    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });

      const dataUrl = canvas.toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `report_${selectedWriterDetails.writerName}_${todayStr}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Daily Report',
          text: `${selectedWriterDetails.writerName} - আজকের কাজের রিপোর্ট (${todayStr})`
        });
        toast.dismiss();
        toast.success("শেয়ার অপশন ওপেন হয়েছে");
      } else {
        // Fallback: Download and open WhatsApp
        const link = document.createElement('a');
        link.download = `report_${selectedWriterDetails.writerName}_${todayStr}.png`;
        link.href = dataUrl;
        link.click();
        
        const text = `*${selectedWriterDetails.writerName} - আজকের কাজের রিপোর্ট*\nতারিখ: ${todayStr}\n\nইমেজটি ডাউনলোড হয়েছে, দয়া করে হোয়াটসঅ্যাপে অ্যাটাচ করে পাঠিয়ে দিন।`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        
        toast.dismiss();
        toast.info("ইমেজটি ডাউনলোড হয়েছে, এখন হোয়াটসঅ্যাপে সেন্ড করুন");
      }
    } catch (error) {
      console.error("Sharing error:", error);
      toast.dismiss();
      toast.error("শেয়ার করতে সমস্যা হয়েছে");
    } finally {
      setIsSharing(false);
    }
  };

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-2xl font-black text-slate-800">লেখক অনুযায়ী হিসাব</CardTitle>
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <Button 
                  variant={!showTodayOnly ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setShowTodayOnly(false)}
                  className={cn("rounded-lg font-bold text-[10px] uppercase tracking-wider h-8 px-4", !showTodayOnly && "bg-white shadow-sm")}
                >
                  সকল সময়
                </Button>
                <Button 
                  variant={showTodayOnly ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setShowTodayOnly(true)}
                  className={cn("rounded-lg font-bold text-[10px] uppercase tracking-wider h-8 px-4", showTodayOnly && "bg-white shadow-sm")}
                >
                  আজকের
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                    <TableHead className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">লেখকের নাম</TableHead>
                    <TableHead className="text-center font-bold text-slate-400 uppercase tracking-widest text-[10px]">{showTodayOnly ? "আজকের কাজ" : "মোট কাজ"}</TableHead>
                    <TableHead className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">{showTodayOnly ? "আজকের পাওনা" : "মোট পাওনা"}</TableHead>
                    <TableHead className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">{showTodayOnly ? "আজকের পেমেন্ট" : "মোট পেমেন্ট"}</TableHead>
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
                      <TableRow 
                        key={s.writer.id} 
                        className="hover:bg-indigo-50/30 transition-colors border-slate-50 cursor-pointer group"
                        onClick={() => handleWriterClick(s.writer.id, s.writer.name)}
                      >
                        <TableCell className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              {s.writer.name[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{s.writer.name}</span>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">ক্লিক করে আজকের কাজ দেখুন</span>
                            </div>
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

      {/* Writer Today's Details Modal */}
      <Dialog open={!!selectedWriterDetails} onOpenChange={(open) => !open && setSelectedWriterDetails(null)}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight">{selectedWriterDetails?.writerName}</DialogTitle>
                  <p className="text-indigo-100 text-xs font-bold">আজকের কাজের বিবরণ ({todayStr})</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedWriterDetails(null)}
                className="rounded-xl hover:bg-white/10 text-white"
              >
                <X size={20} />
              </Button>
            </div>
          </DialogHeader>
          <div className="p-8" ref={reportRef}>
            {selectedWriterDetails?.entries.length === 0 ? (
              <div className="py-12 text-center bg-white">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-400 font-bold">আজ কোনো কাজ এন্ট্রি করা হয়নি</p>
              </div>
            ) : (
              <div className="space-y-4 bg-white">
                {selectedWriterDetails?.entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-700">{entry.serviceType}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.deedCount} টি × {entry.rate} ৳</span>
                      {entry.description && <span className="text-[10px] text-slate-400 italic mt-1">{entry.description}</span>}
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-indigo-600">{entry.totalAmount} ৳</span>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center bg-white">
                  <span className="text-sm font-black text-slate-400 uppercase tracking-widest">আজকের মোট:</span>
                  <span className="text-2xl font-black text-slate-800">
                    {selectedWriterDetails?.entries.reduce((sum, e) => sum + e.totalAmount, 0)} ৳
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
            <Button 
              onClick={handleShareWhatsApp} 
              disabled={isSharing || selectedWriterDetails?.entries.length === 0}
              className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg shadow-emerald-200 transition-all"
            >
              <MessageCircle size={20} />
              WhatsApp এ পাঠান (Image)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
