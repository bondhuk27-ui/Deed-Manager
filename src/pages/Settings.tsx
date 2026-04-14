import React, { useEffect, useState } from 'react';
import { db, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from '@/src/firebase';
import { ServiceConfig } from '@/src/types';
import { handleFirestoreError, OperationType } from '@/src/lib/firestore-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Settings as SettingsIcon, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';
import DeleteConfirmDialog from '@/src/components/DeleteConfirmDialog';

const Settings = () => {
  const [configs, setConfigs] = useState<ServiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [newService, setNewService] = useState({ name: '', defaultCost: '' });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'serviceConfigs'), (snapshot) => {
      setConfigs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceConfig[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'serviceConfigs');
    });

    return () => unsubscribe();
  }, []);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || newService.defaultCost === '') {
      toast.error("সবগুলো ঘর পূরণ করুন");
      return;
    }

    try {
      await addDoc(collection(db, 'serviceConfigs'), {
        name: newService.name,
        defaultCost: Number(newService.defaultCost)
      });
      toast.success("সার্ভিস কনফিগারেশন যোগ করা হয়েছে");
      setNewService({ name: '', defaultCost: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'serviceConfigs');
    }
  };

  const handleDeleteClick = (id: string) => {
    setConfigToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!configToDelete) return;
    try {
      await deleteDoc(doc(db, 'serviceConfigs', configToDelete));
      toast.success("ডিলিট করা হয়েছে");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'serviceConfigs');
    } finally {
      setConfigToDelete(null);
    }
  };

  const handleUpdateCost = async (id: string, cost: number) => {
    try {
      await updateDoc(doc(db, 'serviceConfigs', id), { defaultCost: cost });
      toast.success("আপডেট করা হয়েছে");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'serviceConfigs');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">সেটিংস</h2>
        <p className="text-muted-foreground">সার্ভিস অনুযায়ী আপনার নিজস্ব খরচ সেটআপ করুন।</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add New Service Config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Plus size={20} /> নতুন সার্ভিস খরচ যুক্ত করুন
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddService} className="space-y-4">
              <div className="space-y-2">
                <Label>সার্ভিসের নাম</Label>
                <Input 
                  placeholder="যেমন: অনলাইন পর্চা" 
                  value={newService.name}
                  onChange={e => setNewService({...newService, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>নিজস্ব খরচ (প্রতিটি)</Label>
                <Input 
                  type="number" 
                  placeholder="যেমন: ২০" 
                  value={newService.defaultCost}
                  onChange={e => setNewService({...newService, defaultCost: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full">সংরক্ষণ করুন</Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Configs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <SettingsIcon size={20} /> সার্ভিস খরচ তালিকা
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>সার্ভিস</TableHead>
                  <TableHead>খরচ (৳)</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-10">লোড হচ্ছে...</TableCell></TableRow>
                ) : configs.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">কোনো কনফিগারেশন নেই</TableCell></TableRow>
                ) : (
                  configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.name}</TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="w-24 h-8"
                          defaultValue={config.defaultCost}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val !== config.defaultCost) {
                              handleUpdateCost(config.id, val);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(config.id)}>
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-800">
          <strong>টিপস:</strong> এখানে সার্ভিস অনুযায়ী খরচ সেট করে রাখলে, প্রতিদিনের এন্ট্রি করার সময় ওই সার্ভিসের খরচ অটোমেটিক চলে আসবে। এতে করে আপনার আসল নিট আয় (Net Income) হিসাব করা সহজ হবে।
        </p>
      </div>
      <DeleteConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default Settings;
