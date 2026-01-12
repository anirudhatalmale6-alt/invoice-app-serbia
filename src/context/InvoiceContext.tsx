import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Invoice } from '../types';
import { useAuth } from './AuthContext';

interface InvoiceContextType {
  invoices: Invoice[];
  loading: boolean;
  selectedCompany: string;
  setSelectedCompany: (company: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  toggleStatus: (invoice: Invoice) => Promise<void>;
  getDueToday: () => Invoice[];
  getOverdue: () => Invoice[];
  searchBySupplier: (searchTerm: string) => Invoice[];
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoices must be used within an InvoiceProvider');
  }
  return context;
};

export const InvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'invoices'),
      orderBy('datumDospeca', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoiceData: Invoice[] = [];
      snapshot.forEach((doc) => {
        invoiceData.push({ id: doc.id, ...doc.data() } as Invoice);
      });
      setInvoices(invoiceData);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!currentUser) throw new Error('Must be logged in');

    await addDoc(collection(db, 'invoices'), {
      ...invoiceData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser.uid,
    });
  };

  const updateInvoice = async (id: string, data: Partial<Invoice>) => {
    await updateDoc(doc(db, 'invoices', id), {
      ...data,
      updatedAt: Date.now(),
    });
  };

  const deleteInvoice = async (id: string) => {
    await deleteDoc(doc(db, 'invoices', id));
  };

  const toggleStatus = async (invoice: Invoice) => {
    await updateInvoice(invoice.id, {
      status: invoice.status === 'placeno' ? 'neplaceno' : 'placeno',
    });
  };

  const getFilteredInvoices = () => {
    if (selectedCompany === 'all') return invoices;
    return invoices.filter(inv => inv.kompanija === selectedCompany);
  };

  const getDueToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return getFilteredInvoices().filter(
      inv => inv.datumDospeca === today && inv.status === 'neplaceno'
    );
  };

  const getOverdue = () => {
    const today = new Date().toISOString().split('T')[0];
    return getFilteredInvoices().filter(
      inv => inv.datumDospeca < today && inv.status === 'neplaceno'
    );
  };

  const searchBySupplier = (searchTerm: string) => {
    const term = searchTerm.toLowerCase();
    return getFilteredInvoices().filter(
      inv => inv.dobavljac.toLowerCase().includes(term)
    );
  };

  const value = {
    invoices: getFilteredInvoices(),
    loading,
    selectedCompany,
    setSelectedCompany,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    toggleStatus,
    getDueToday,
    getOverdue,
    searchBySupplier,
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
};
