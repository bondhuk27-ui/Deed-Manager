import { Timestamp } from 'firebase/firestore';

export interface Writer {
  id: string;
  name: string;
  rate: number;
  previousBalance: number;
  createdAt: Timestamp;
  type?: 'main' | 'assistant';
}

export interface DeedEntry {
  id: string;
  writerId: string;
  writerType?: 'main' | 'assistant';
  serviceType: string;
  description?: string;
  date: string; // YYYY-MM-DD
  deedCount: number;
  rate: number;
  serviceCost?: number;
  totalAmount: number;
  createdAt: Timestamp;
}

export interface ServiceConfig {
  id: string;
  name: string;
  defaultCost: number;
  defaultRate?: number;
  order?: number;
}

export interface Payment {
  id: string;
  writerId: string;
  writerType?: 'main' | 'assistant';
  date: string; // YYYY-MM-DD
  amount: number;
  note?: string;
  createdAt: Timestamp;
}

export interface WriterSummary {
  writer: Writer;
  totalDeeds: number;
  totalEarned: number;
  totalPaid: number;
  currentBalance: number;
}
