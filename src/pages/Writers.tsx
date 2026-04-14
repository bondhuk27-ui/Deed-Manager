import React, { useEffect, useState } from 'react';
import { db, collection, addDoc, onSnapshot, query, orderBy, Timestamp, deleteDoc, doc, updateDoc } from '@/src/firebase';
import { Writer } from '@/src/types';
import { handleFirestoreError, OperationType } from '@/src/lib/firestore-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import DeleteConfirmDialog from '@/src/components/DeleteConfirmDialog';

const Writers = () => {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [writerToDelete, setWriterToDelete] = useState<string | null>(null);
  const [newWriter, setNewWriter] = useState({ name: '', rate: '', previousBalance: '' });

  useEffect(() => {
    const q = query(collection(db, 'writers'), orderBy('createdAt', 'desc'));
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
        createdAt: Timestamp.now()
      });
      toast.success("লেখক সফলভাবে যোগ করা হয়েছে");
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
      toast.success("লেখক ডিলিট করা হয়েছে");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'writers');
    } finally {
      setWriterToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">লেখকদের তালিকা</h2>
          <p className="text-muted-foreground">আপনার সকল দলিল লেখকদের তথ্য এখানে ম্যানেজ করুন।</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="gap-2" />}>
            <UserPlus size={18} />
            নতুন লেখক
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>নতুন লেখক যোগ করুন</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddWriter} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">লেখকের নাম</Label>
                <Input 
                  id="name" 
                  value={newWriter.name} 
                  onChange={e => setNewWriter({...newWriter, name: e.target.value})} 
                  placeholder="যেমন: মোঃ রহিম উদ্দিন"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate">রেট (প্রতি দলিল)</Label>
                  <Input 
                    id="rate" 
                    type="number" 
                    value={newWriter.rate} 
                    onChange={e => setNewWriter({...newWriter, rate: e.target.value})} 
                    placeholder="যেমন: ৫০"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance">আগের বাকি (ঐচ্ছিক)</Label>
                  <Input 
                    id="balance" 
                    type="number" 
                    value={newWriter.previousBalance} 
                    onChange={e => setNewWriter({...newWriter, previousBalance: e.target.value})} 
                    placeholder="যেমন: ১০০"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">সংরক্ষণ করুন</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>নাম</TableHead>
                <TableHead>রেট</TableHead>
                <TableHead>আগের বাকি</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">লোড হচ্ছে...</TableCell>
                </TableRow>
              ) : writers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">কোনো লেখক পাওয়া যায়নি</TableCell>
                </TableRow>
              ) : (
                writers.map((writer) => (
                  <TableRow key={writer.id}>
                    <TableCell className="font-medium">{writer.name}</TableCell>
                    <TableCell>{writer.rate} ৳</TableCell>
                    <TableCell>{writer.previousBalance} ৳</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(writer.id)}>
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <DeleteConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        description="এই লেখককে ডিলিট করলে তার সাথে সম্পর্কিত সকল হিসাবের ওপর প্রভাব পড়তে পারে। আপনি কি নিশ্চিত?"
      />
    </div>
  );
};

export default Writers;
