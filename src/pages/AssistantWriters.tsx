import React, { useEffect, useState } from 'react';
import { db, collection, addDoc, onSnapshot, query, orderBy, Timestamp, deleteDoc, doc, where } from '@/src/firebase';
import { Writer } from '@/src/types';
import { handleFirestoreError, OperationType } from '@/src/lib/firestore-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import DeleteConfirmDialog from '@/src/components/DeleteConfirmDialog';
import { motion } from 'motion/react';

const AssistantWriters = () => {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [writerToDelete, setWriterToDelete] = useState<string | null>(null);
  const [newWriter, setNewWriter] = useState({ name: '', rate: '', previousBalance: '' });

  useEffect(() => {
    const q = query(
      collection(db, 'writers'), 
      where('type', '==', 'assistant'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const writersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Writer[];
      setWriters(writersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'writers');
    });
    return unsubscribe;
  }, []);

  const handleAddWriter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWriter.name || !newWriter.rate) {
      toast.error("নাম এবং রেট অবশ্যই দিতে হবে");
      return;
    }

    try {
      await addDoc(collection(db, 'writers'), {
        name: newWriter.name,
        rate: Number(newWriter.rate),
        previousBalance: Number(newWriter.previousBalance) || 0,
        type: 'assistant',
        createdAt: Timestamp.now()
      });
      toast.success("সহকারী লেখক সফলভাবে যোগ করা হয়েছে");
      setNewWriter({ name: '', rate: '', previousBalance: '' });
      setIsAddOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'writers');
    }
  };

  const handleDeleteClick = (id: string) => {
    setWriterToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!writerToDelete) return;
    try {
      await deleteDoc(doc(db, 'writers', writerToDelete));
      toast.success("সহকারী লেখক ডিলিট করা হয়েছে");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'writers');
    } finally {
      setWriterToDelete(null);
    }
  };

  return (
    <div className="space-y-10 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-4xl font-black tracking-tight animated-gradient-text">সহকারী লেখকদের তালিকা</h2>
          <p className="text-slate-500 font-medium mt-1">আপনার সকল সহকারী লেখকদের তথ্য এখানে ম্যানেজ করুন।</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="h-12 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-xl hover:shadow-indigo-200 transition-all duration-300 gap-2 font-bold" />}>
            <UserPlus size={18} />
            নতুন সহকারী লেখক
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-800">নতুন সহকারী লেখক যোগ করুন</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddWriter} className="space-y-6 pt-4">
              <div className="space-y-2.5">
                <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">সহকারী লেখকের নাম</Label>
                <Input 
                  id="name" 
                  value={newWriter.name} 
                  onChange={e => setNewWriter({...newWriter, name: e.target.value})} 
                  placeholder="যেমন: মোঃ করিম উদ্দিন"
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="rate" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">রেট (প্রতি দলিল)</Label>
                  <Input 
                    id="rate" 
                    type="number" 
                    value={newWriter.rate} 
                    onChange={e => setNewWriter({...newWriter, rate: e.target.value})} 
                    placeholder="যেমন: ৫০"
                    className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="balance" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">আগের বাকি (ঐচ্ছিক)</Label>
                  <Input 
                    id="balance" 
                    type="number" 
                    value={newWriter.previousBalance} 
                    onChange={e => setNewWriter({...newWriter, previousBalance: e.target.value})} 
                    placeholder="যেমন: ১০০"
                    className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-black rounded-2xl bg-indigo-600 hover:bg-indigo-700 transition-all duration-300">
                সংরক্ষণ করুন
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                    <TableHead className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">নাম</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">রেট</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">আগের বাকি</TableHead>
                    <TableHead className="text-right px-8 font-bold text-slate-400 uppercase tracking-widest text-[10px]">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-20">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-slate-400 font-bold">লোড হচ্ছে...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : writers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-20 text-slate-400 font-bold">কোনো সহকারী লেখক পাওয়া যায়নি</TableCell>
                    </TableRow>
                  ) : (
                    writers.map((writer) => (
                      <TableRow key={writer.id} className="hover:bg-indigo-50/30 transition-colors border-slate-50">
                        <TableCell className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm">
                              {writer.name[0]}
                            </div>
                            <span className="font-bold text-slate-700">{writer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black bg-indigo-50 text-indigo-600">
                            {writer.rate} ৳
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-slate-600">{writer.previousBalance} ৳</span>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteClick(writer.id)}
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

      <DeleteConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        description="এই সহকারী লেখককে ডিলিট করলে তার সাথে সম্পর্কিত সকল হিসাবের ওপর প্রভাব পড়তে পারে। আপনি কি নিশ্চিত?"
      />
    </div>
  );
};

export default AssistantWriters;
