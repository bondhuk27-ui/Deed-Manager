import React, { useEffect, useState } from 'react';
import { db, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy, writeBatch } from '@/src/firebase';
import { ServiceConfig } from '@/src/types';
import { handleFirestoreError, OperationType } from '@/src/lib/firestore-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Settings as SettingsIcon, Save, Plus, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import DeleteConfirmDialog from '@/src/components/DeleteConfirmDialog';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const EditableInput = ({ initialValue, onSave, className }: { initialValue: number, onSave: (val: number) => void, className?: string }) => {
  const [value, setValue] = useState(initialValue.toString());

  useEffect(() => {
    setValue(initialValue.toString());
  }, [initialValue]);

  return (
    <Input
      type="number"
      className={className}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const num = Number(value);
        if (num !== initialValue) {
          onSave(num);
        }
      }}
    />
  );
};

const SortableRow = ({ config, handleUpdateCost, handleUpdateRate, handleDeleteClick }: { 
  config: ServiceConfig, 
  handleUpdateCost: (id: string, cost: number) => void,
  handleUpdateRate: (id: string, rate: number) => void,
  handleDeleteClick: (id: string) => void,
  key?: string
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: config.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={cn(isDragging && "bg-slate-50")}>
      <TableCell className="w-10">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded">
          <GripVertical size={16} className="text-slate-400" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{config.name}</TableCell>
      <TableCell>
        <EditableInput 
          className="w-20 h-8"
          initialValue={config.defaultCost}
          onSave={(val) => handleUpdateCost(config.id, val)}
        />
      </TableCell>
      <TableCell>
        <EditableInput 
          className="w-20 h-8"
          initialValue={config.defaultRate || 0}
          onSave={(val) => handleUpdateRate(config.id, val)}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(config.id)}>
          <Trash2 size={14} className="text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

const Settings = () => {
  const [configs, setConfigs] = useState<ServiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [newService, setNewService] = useState({ name: '', defaultCost: '', defaultRate: '' });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'serviceConfigs'), orderBy('order', 'asc')), (snapshot) => {
      setConfigs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceConfig[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'serviceConfigs');
    });

    return () => unsubscribe();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = configs.findIndex((c: ServiceConfig) => c.id === active.id);
      const newIndex = configs.findIndex((c: ServiceConfig) => c.id === over.id);

      const newOrder = arrayMove(configs, oldIndex, newIndex);
      setConfigs(newOrder);

      try {
        const batch = writeBatch(db);
        newOrder.forEach((config: ServiceConfig, index: number) => {
          batch.update(doc(db, 'serviceConfigs', config.id), { order: index });
        });
        await batch.commit();
        toast.success("ক্রম পরিবর্তন করা হয়েছে");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'serviceConfigs');
      }
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || newService.defaultCost === '') {
      toast.error("সবগুলো ঘর পূরণ করুন");
      return;
    }

    try {
      await addDoc(collection(db, 'serviceConfigs'), {
        name: newService.name,
        defaultCost: Number(newService.defaultCost),
        defaultRate: Number(newService.defaultRate || 0),
        order: configs.length
      });
      toast.success("কাজের ধরন যোগ করা হয়েছে");
      setNewService({ name: '', defaultCost: '', defaultRate: '' });
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
      toast.success("খরচ আপডেট করা হয়েছে");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'serviceConfigs');
    }
  };

  const handleUpdateRate = async (id: string, rate: number) => {
    try {
      await updateDoc(doc(db, 'serviceConfigs', id), { defaultRate: rate });
      toast.success("রেট আপডেট করা হয়েছে");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'serviceConfigs');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">সেটিংস</h2>
        <p className="text-muted-foreground">কাজের ধরন এবং আপনার নিজস্ব খরচ সেটআপ করুন।</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add New Service Config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Plus size={20} /> নতুন কাজের ধরন যুক্ত করুন
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddService} className="space-y-4">
              <div className="space-y-2">
                <Label>কাজের নাম</Label>
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
              <div className="space-y-2">
                <Label>ডিফল্ট রেট (প্রতিটি)</Label>
                <Input 
                  type="number" 
                  placeholder="যেমন: ৫০" 
                  value={newService.defaultRate}
                  onChange={e => setNewService({...newService, defaultRate: e.target.value})}
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
              <SettingsIcon size={20} /> কাজের ধরনের তালিকা
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>কাজের নাম</TableHead>
                    <TableHead>খরচ (৳)</TableHead>
                    <TableHead>রেট (৳)</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10">লোড হচ্ছে...</TableCell></TableRow>
                  ) : configs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">কোনো কনফিগারেশন নেই</TableCell></TableRow>
                  ) : (
                    <SortableContext 
                      items={configs.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {configs.map((config: ServiceConfig) => (
                        <SortableRow 
                          key={config.id} 
                          config={config} 
                          handleUpdateCost={handleUpdateCost}
                          handleUpdateRate={handleUpdateRate}
                          handleDeleteClick={handleDeleteClick}
                        />
                      ))}
                    </SortableContext>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-800">
          <strong>টিপস:</strong> এখানে কাজের ধরন অনুযায়ী খরচ এবং রেট সেট করে রাখলে, প্রতিদিনের এন্ট্রি করার সময় ওই তথ্যগুলো অটোমেটিক চলে আসবে। এতে করে আপনার এন্ট্রি করা দ্রুত হবে এবং নিট আয় (Net Income) হিসাব করা সহজ হবে।
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
