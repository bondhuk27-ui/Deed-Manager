import React, { useEffect, useState } from 'react';
import { db, collection, addDoc, onSnapshot, query, orderBy, Timestamp, deleteDoc, doc } from '@/src/firebase';
import { Writer, Payment } from '@/src/types';
import { handleFirestoreError, OperationType } from '@/src/lib/firestore-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Trash2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import DeleteConfirmDialog from '@/src/components/DeleteConfirmDialog';

const Payments = () => {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    writerId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    note: ''
  });

  useEffect(() => {
    const writersUnsubscribe = onSnapshot(collection(db, 'writers'), (snapshot) => {
      setWriters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Writer[]);
    });

    const paymentsQuery = query(collection(db, 'payments'), orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
    const paymentsUnsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Payment[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payments');
    });

    return () => {
      writersUnsubscribe();
      paymentsUnsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.writerId || !formData.amount) {
      toast.error("সবগুলো ঘর পূরণ করুন");
      return;
    }

    try {
      await addDoc(collection(db, 'payments'), {
        writerId: formData.writerId,
        date: formData.date,
        amount: Number(formData.amount),
        note: formData.note,
        createdAt: Timestamp.now()
      });
      toast.success("পেমেন্ট সফল হয়েছে");
      setFormData({ ...formData, amount: '', note: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payments');
    }
  };

  const handleDeleteClick = (id: string) => {
    setPaymentToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;
    try {
      await deleteDoc(doc(db, 'payments', paymentToDelete));
      toast.success("পেমেন্ট ডিলিট করা হয়েছে");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'payments');
    } finally {
      setPaymentToDelete(null);
    }
  };

  const getWriterName = (id: string) => {
    return writers.find(w => w.id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Payment Form */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Receipt className="text-primary" />
              পেমেন্ট ইনপুট
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>লেখক নির্বাচন করুন</Label>
                <Select onValueChange={id => setFormData({...formData, writerId: id})} value={formData.writerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="লেখক বেছে নিন" />
                  </SelectTrigger>
                  <SelectContent>
                    {writers.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>তারিখ</Label>
                  <Input 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>টাকার পরিমাণ (৳)</Label>
                  <Input 
                    type="number" 
                    value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: e.target.value})} 
                    placeholder="যেমন: ৫০০"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>নোট (ঐচ্ছিক)</Label>
                <Input 
                  value={formData.note} 
                  onChange={e => setFormData({...formData, note: e.target.value})} 
                  placeholder="যেমন: অগ্রিম পেমেন্ট"
                />
              </div>
              <Button type="submit" className="w-full h-12 text-lg">পেমেন্ট সেভ করুন</Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="flex-[1.5]">
          <CardHeader>
            <CardTitle className="text-xl">সাম্প্রতিক পেমেন্ট সমূহ</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                  <TableRow>
                    <TableHead>তারিখ</TableHead>
                    <TableHead>লেখক</TableHead>
                    <TableHead>পরিমাণ</TableHead>
                    <TableHead>নোট</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10">লোড হচ্ছে...</TableCell></TableRow>
                  ) : payments.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">কোনো পেমেন্ট নেই</TableCell></TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-xs font-mono">{payment.date}</TableCell>
                        <TableCell className="font-medium">{getWriterName(payment.writerId)}</TableCell>
                        <TableCell className="font-bold text-green-600">{payment.amount} ৳</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                          {payment.note || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(payment.id)}>
                            <Trash2 size={14} className="text-destructive" />
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
      </div>
      <DeleteConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default Payments;
