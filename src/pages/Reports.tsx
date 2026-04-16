import React, { useEffect, useState } from 'react';
import { db, collection, onSnapshot, query, where, orderBy } from '@/src/firebase';
import { Writer, DeedEntry, Payment } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { motion } from 'motion/react';
import { FileText, Download, Printer, Filter, TrendingUp, Sparkles, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Reports = () => {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [entries, setEntries] = useState<DeedEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedWriter, setSelectedWriter] = useState<string>('all');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

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

  const filteredEntries = entries.filter(e => {
    const writerMatch = selectedWriter === 'all' || e.writerId === selectedWriter;
    const dateMatch = e.date >= startDate && e.date <= endDate;
    return writerMatch && dateMatch;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const filteredPayments = payments.filter(p => {
    const writerMatch = selectedWriter === 'all' || p.writerId === selectedWriter;
    const dateMatch = p.date >= startDate && p.date <= endDate;
    return writerMatch && dateMatch;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalEarned = +(filteredEntries.reduce((sum, e) => sum + e.totalAmount, 0)).toFixed(2);
  const totalPaid = +(filteredPayments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2);
  const totalServiceCosts = +(filteredEntries.reduce((sum, e) => sum + (e.serviceCost || 0), 0)).toFixed(2);
  const netIncome = +(totalEarned - totalServiceCosts).toFixed(2);
  
  // Calculate service-wise counts
  const serviceCounts = filteredEntries.reduce((acc, e) => {
    const type = e.serviceType || 'দলিল';
    acc[type] = (acc[type] || 0) + e.deedCount;
    return acc;
  }, {} as Record<string, number>);

  const getWriterName = (id: string) => writers.find(w => w.id === id)?.name || 'Unknown';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-10 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h2 className="text-4xl font-black tracking-tight animated-gradient-text">রিপোর্ট ও বিশ্লেষণ</h2>
          <p className="text-slate-500 font-medium mt-1">বিস্তারিত লেনদেন এবং কাজের রিপোর্ট দেখুন।</p>
        </div>
        <Button variant="outline" onClick={handlePrint} className="h-12 px-6 rounded-2xl gap-2 font-bold border-slate-200 hover:bg-slate-50 transition-all duration-300 print:hidden">
          <Printer size={18} />
          প্রিন্ট করুন
        </Button>
      </motion.div>

      {/* Print Only Header */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-center mb-2">দলিল লেখক হিসাব রিপোর্ট</h1>
        <div className="flex justify-between text-sm font-bold">
          <p>লেখক: {selectedWriter === 'all' ? "সব লেখক" : writers.find(w => w.id === selectedWriter)?.name}</p>
          <p>সময়কাল: {startDate} থেকে {endDate}</p>
        </div>
        <p className="text-[10px] text-right mt-2">রিপোর্ট তৈরির সময়: {format(new Date(), 'dd/MM/yyyy hh:mm a')}</p>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2rem] bg-white print:hidden">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2.5">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                  <Filter size={12} /> লেখক ফিল্টার
                </Label>
                <Select onValueChange={setSelectedWriter} value={selectedWriter}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500">
                    <SelectValue>
                      {selectedWriter === 'all' ? "সব লেখক" : writers.find(w => w.id === selectedWriter)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl max-h-[300px]">
                    <SelectItem value="all" className="rounded-xl my-1 focus:bg-indigo-50 focus:text-indigo-600 transition-colors">সব লেখক</SelectItem>
                    {writers.map(w => (
                      <SelectItem key={w.id} value={w.id} className="rounded-xl my-1 focus:bg-indigo-50 focus:text-indigo-600 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                            {w.name[0]}
                          </div>
                          <span>{w.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">শুরুর তারিখ</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500" />
              </div>
              <div className="space-y-2.5">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">শেষ তারিখ</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-none shadow-xl shadow-indigo-500/5 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-indigo-100 pb-3">
                <PieChart size={16} className="text-indigo-600" />
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">কাজের পরিসংখ্যান</p>
              </div>
              <div className="space-y-2">
                {Object.keys(serviceCounts).length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold">কোনো কাজ নেই</p>
                ) : (
                  Object.entries(serviceCounts).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-900/70">{type}:</span>
                      <span className="text-sm font-black text-indigo-600">{count} টি</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-none shadow-xl shadow-emerald-500/5 rounded-[2rem] bg-emerald-50/50 border border-emerald-100 h-full">
            <CardContent className="p-6 text-center flex flex-col justify-center items-center h-full">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">মোট পাওনা</p>
              <h4 className="text-3xl font-black text-emerald-900">{totalEarned} ৳</h4>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-none shadow-xl shadow-rose-500/5 rounded-[2rem] bg-rose-50/50 border border-rose-100 h-full">
            <CardContent className="p-6 text-center flex flex-col justify-center items-center h-full">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-2">সার্ভিস খরচ</p>
              <h4 className="text-3xl font-black text-rose-900">{totalServiceCosts} ৳</h4>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-none shadow-xl shadow-violet-500/5 rounded-[2rem] bg-violet-50/50 border border-violet-100 h-full">
            <CardContent className="p-6 text-center flex flex-col justify-center items-center h-full">
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-2">মোট পেমেন্ট</p>
              <h4 className="text-3xl font-black text-violet-900">{totalPaid} ৳</h4>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Net Income Highlight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none shadow-2xl shadow-emerald-500/20 rounded-[2.5rem] overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <TrendingUp size={120} />
          </div>
          <CardContent className="p-10 flex justify-between items-center relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-emerald-200" />
                <p className="text-emerald-100 text-xs font-black uppercase tracking-widest">আসল মোট আয় (Net Income)</p>
              </div>
              <h3 className="text-5xl font-black tracking-tighter">৳ {netIncome}</h3>
            </div>
            <div className="p-6 bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl">
              <TrendingUp size={40} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="entries" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-16 p-2 bg-slate-100 rounded-[1.5rem] mb-8 print:hidden">
          <TabsTrigger value="entries" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">কাজের বিবরণ (Entries)</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">পেমেন্ট বিবরণ (Payments)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="entries">
          <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FileText size={20} />
                </div>
                কাজের বিস্তারিত তালিকা
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                      <TableHead className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">তারিখ</TableHead>
                      <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">লেখক ও কাজ</TableHead>
                      <TableHead className="text-center font-bold text-slate-400 uppercase tracking-widest text-[10px]">সংখ্যা</TableHead>
                      <TableHead className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">রেট</TableHead>
                      <TableHead className="text-right px-8 font-bold text-slate-400 uppercase tracking-widest text-[10px]">মোট টাকা</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400 font-bold">কোনো তথ্য পাওয়া যায়নি</TableCell></TableRow>
                    ) : (
                      filteredEntries.map((e) => (
                        <TableRow key={e.id} className="hover:bg-indigo-50/30 transition-colors border-slate-50">
                          <TableCell className="px-8 py-6">
                            <span className="text-[10px] font-black font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{e.date}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700">{getWriterName(e.writerId)}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-0.5">{e.serviceType || 'দলিল'}</span>
                              {e.description && <span className="text-[10px] text-slate-400 italic mt-0.5">{e.description}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-600">
                              {e.deedCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-600">{e.rate} ৳</TableCell>
                          <TableCell className="text-right px-8 font-black text-slate-800">{e.totalAmount} ৳</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Download size={20} />
                </div>
                পেমেন্ট বিস্তারিত তালিকা
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                      <TableHead className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">তারিখ</TableHead>
                      <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">লেখক</TableHead>
                      <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">নোট</TableHead>
                      <TableHead className="text-right px-8 font-bold text-slate-400 uppercase tracking-widest text-[10px]">পরিমাণ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400 font-bold">কোনো তথ্য পাওয়া যায়নি</TableCell></TableRow>
                    ) : (
                      filteredPayments.map((p) => (
                        <TableRow key={p.id} className="hover:bg-emerald-50/30 transition-colors border-slate-50">
                          <TableCell className="px-8 py-6">
                            <span className="text-[10px] font-black font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{p.date}</span>
                          </TableCell>
                          <TableCell className="font-bold text-slate-700">{getWriterName(p.writerId)}</TableCell>
                          <TableCell className="text-xs text-slate-400 font-medium">{p.note || '-'}</TableCell>
                          <TableCell className="text-right px-8 font-black text-emerald-600">{p.amount} ৳</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
