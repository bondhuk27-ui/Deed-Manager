import { Timestamp } from 'firebase/firestore';

export interface Writer {
  id: string;
  name: string;
  rate: number;
  previousBalance: number;
  createdAt: Timestamp;
}

export interface DeedEntry {
  id: string;
  writerId: string;
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
}

export interface Payment {
  id: string;
  writerId: string;
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
