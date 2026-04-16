import React, { useEffect, useState } from 'react';
import { db, collection, addDoc, onSnapshot, query, orderBy, Timestamp, deleteDoc, doc, where, writeBatch } from '@/src/firebase';
import { Writer, DeedEntry, ServiceConfig } from '@/src/types';
import { handleFirestoreError, OperationType } from '@/src/lib/firestore-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Calendar as CalendarIcon, Sparkles, History } from 'lucide-react';
import { toast } from 'sonner';
import DeleteConfirmDialog from '@/src/components/DeleteConfirmDialog';

const Entries = () => {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [entries, setEntries] = useState<DeedEntry[]>([]);
  const [serviceConfigs, setServiceConfigs] = useState<ServiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [writerType, setWriterType] = useState<'main' | 'assistant'>('main');
  const [formData, setFormData] = useState({
    writerId: '',
    serviceType: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    deedCount: '',
    rate: '',
    serviceCost: ''
  });

  useEffect(() => {
    const writersUnsubscribe = onSnapshot(collection(db, 'writers'), 
      (snapshot) => {
        setWriters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Writer[]);
      },
      (error) => console.error("Writers Snapshot Error:", error)
    );

    const configsUnsubscribe = onSnapshot(query(collection(db, 'serviceConfigs'), orderBy('order', 'asc')), 
      (snapshot) => {
        setServiceConfigs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceConfig[]);
      },
      (error) => console.error("Configs Snapshot Error:", error)
    );

    const entriesQuery = query(collection(db, 'entries'), orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
    const entriesUnsubscribe = onSnapshot(entriesQuery, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DeedEntry[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'entries');
    });

    return () => {
      writersUnsubscribe();
      configsUnsubscribe();
      entriesUnsubscribe();
    };
  }, []);

  const handleWriterChange = (id: string) => {
    const writer = writers.find(w => w.id === id);
    setFormData({
      ...formData,
      writerId: id,
      rate: writer ? writer.rate.toString() : ''
    });
  };

  const handleServiceTypeChange = (type: string) => {
    const config = serviceConfigs.find(c => c.name === type);
    const count = Number(formData.deedCount) || 0;
    setFormData({
      ...formData,
      serviceType: type,
      serviceCost: config ? (config.defaultCost * count).toString() : '',
      rate: config && config.defaultRate ? config.defaultRate.toString() : formData.rate
    });
  };

  const handleCountChange = (countStr: string) => {
    const count = Number(countStr) || 0;
    const config = serviceConfigs.find(c => c.name === formData.serviceType);
    setFormData({
      ...formData,
      deedCount: countStr,
      serviceCost: config ? (config.defaultCost * count).toString() : formData.serviceCost
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.writerId || !formData.deedCount || !formData.rate || !formData.serviceType) {
      toast.error("সবগুলো ঘর পূরণ করুন");
      return;
    }

    const count = Number(formData.deedCount);
    const rate = Number(formData.rate);
    const serviceCost = Number(formData.serviceCost || 0);
    const total = count * rate;

    try {
      await addDoc(collection(db, 'entries'), {
        writerId: formData.writerId,
        writerType: writerType,
        serviceType: formData.serviceType,
        description: formData.description,
        date: formData.date,
        deedCount: count,
        rate: rate,
        serviceCost: serviceCost,
        totalAmount: total,
        createdAt: Timestamp.now()
      });
      toast.success("এন্ট্রি সফল হয়েছে");
      setFormData({ ...formData, deedCount: '', description: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'entries');
    }
  };

  const handleDeleteClick = (id: string) => {
    setEntryToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    try {
      await deleteDoc(doc(db, 'entries', entryToDelete));
      toast.success("এন্ট্রি ডিলিট করা হয়েছে");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'entries');
    } finally {
      setEntryToDelete(null);
    }
  };

  const getWriterName = (id: string) => {
    return writers.find(w => w.id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-10 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-4xl font-black tracking-tight animated-gradient-text">প্রতিদিনের কাজ এন্ট্রি</h2>
          <p className="text-slate-500 font-medium mt-1">দলিল ও অন্যান্য কাজের হিসাব নির্ভুলভাবে সংরক্ষণ করুন।</p>
        </div>
      </motion.div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Entry Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex-1"
        >
          <Card className="border-none shadow-2xl shadow-indigo-500/10 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">নতুন এন্ট্রি যোগ করুন</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">লেখকের ধরন</Label>
                    <Select onValueChange={(val: 'main' | 'assistant') => {
                      setWriterType(val);
                      setFormData({...formData, writerId: '', rate: ''});
                    }} value={writerType}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500">
                        <SelectValue placeholder="ধরন বেছে নিন" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        <SelectItem value="main" className="rounded-xl my-1">প্রধান লেখক</SelectItem>
                        <SelectItem value="assistant" className="rounded-xl my-1">সহকারী লেখক</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">লেখক নির্বাচন করুন</Label>
                    <Select onValueChange={handleWriterChange} value={formData.writerId}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500">
                        <SelectValue>
                          {formData.writerId ? writers.find(w => w.id === formData.writerId)?.name : "লেখক বেছে নিন"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 shadow-xl max-h-[300px]">
                        {writers.filter(w => (w.type || 'main') === writerType).length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 font-bold">কোনো লেখক পাওয়া যায়নি</div>
                        ) : (
                          writers.filter(w => (w.type || 'main') === writerType).map(w => (
                            <SelectItem key={w.id} value={w.id} className="rounded-xl my-1 focus:bg-indigo-50 focus:text-indigo-600 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                  {w.name[0]}
                                </div>
                                <span>{w.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">কাজের ধরন</Label>
                    <Select 
                      onValueChange={handleServiceTypeChange} 
                      value={formData.serviceType}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500">
                        <SelectValue placeholder="কাজের ধরন বেছে নিন" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        {serviceConfigs.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 font-bold">সেটিংসে কাজের ধরন যোগ করুন</div>
                        ) : (
                          serviceConfigs.map(config => (
                            <SelectItem key={config.id} value={config.name} className="rounded-xl my-1">{config.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">তারিখ</Label>
                    <div className="relative">
                      <Input 
                        type="date" 
                        value={formData.date} 
                        onChange={e => setFormData({...formData, date: e.target.value})} 
                        className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500 pl-10"
                      />
                      <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">সংখ্যা (পরিমাণ)</Label>
                    <Input 
                      type="number" 
                      value={formData.deedCount} 
                      onChange={e => handleCountChange(e.target.value)} 
                      placeholder="যেমন: ৫"
                      className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">রেট (৳)</Label>
                    <Input 
                      type="number" 
                      value={formData.rate} 
                      onChange={e => setFormData({...formData, rate: e.target.value})} 
                      placeholder="যেমন: ৫০"
                      className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">নিজস্ব খরচ (ঐচ্ছিক)</Label>
                    <Input 
                      type="number" 
                      value={formData.serviceCost} 
                      onChange={e => setFormData({...formData, serviceCost: e.target.value})} 
                      placeholder="যেমন: ২০"
                      className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">বিবরণ (ঐচ্ছিক)</Label>
                  <Input 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="কাজের বিস্তারিত বিবরণ"
                    className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500"
                  />
                </div>
                
                <AnimatePresence>
                  {formData.deedCount && formData.rate && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex justify-between items-center shadow-inner"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                          <Sparkles size={20} />
                        </div>
                        <span className="text-sm font-black text-indigo-900 uppercase tracking-widest">মোট হিসাব:</span>
                      </div>
                      <span className="text-3xl font-black text-indigo-600">
                        {Number(formData.deedCount) * Number(formData.rate)} ৳
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" className="w-full h-14 text-lg font-black rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-xl hover:shadow-indigo-200 transition-all duration-300">
                  সংরক্ষণ করুন
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Entries */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-[1.2]"
        >
          <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <History size={20} />
                  </div>
                  <CardTitle className="text-2xl font-black text-slate-800">সাম্প্রতিক এন্ট্রি সমূহ</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                      <TableHead className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">তারিখ</TableHead>
                      <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">লেখক ও কাজ</TableHead>
                      <TableHead className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">হিসাব</TableHead>
                      <TableHead className="text-right px-8 font-bold text-slate-400 uppercase tracking-widest text-[10px]">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-20">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-slate-400 font-bold">লোড হচ্ছে...</span>
                        </div>
                      </TableCell></TableRow>
                    ) : entries.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400 font-bold">কোনো এন্ট্রি নেই</TableCell></TableRow>
                    ) : (
                      entries.map((entry) => (
                        <TableRow key={entry.id} className="hover:bg-indigo-50/30 transition-colors border-slate-50">
                          <TableCell className="px-8 py-6">
                            <span className="text-[10px] font-black font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{entry.date}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700">{getWriterName(entry.writerId)}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-0.5">{entry.serviceType}</span>
                              {entry.description && <span className="text-[10px] text-slate-400 italic mt-0.5">{entry.description}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-black text-slate-800">{entry.totalAmount} ৳</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{entry.deedCount} × {entry.rate}</span>
                              {entry.serviceCost ? <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">খরচ: {entry.serviceCost} ৳</span> : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-right px-8">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteClick(entry.id)}
                              className="w-10 h-10 rounded-xl hover:bg-rose-50 hover:text-rose-600 text-slate-300 transition-all duration-300"
                            >
                              <Trash2 size={16} />
                            </Button>
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
      <DeleteConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default Entries;
