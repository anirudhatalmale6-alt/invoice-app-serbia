import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs
} from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Invoice, Supplier } from '../types';
import { useAuth } from './AuthContext';

// Helper function to get next working day
const getNextWorkingDay = (date: Date): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  // Skip weekends (Saturday = 6, Sunday = 0)
  while (result.getDay() === 0 || result.getDay() === 6) {
    result.setDate(result.getDate() + 1);
  }
  return result;
};

interface InvoiceContextType {
  invoices: Invoice[];
  suppliers: Supplier[];
  loading: boolean;
  selectedCompany: string;
  setSelectedCompany: (company: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  toggleStatus: (invoice: Invoice) => Promise<void>;
  getDueToday: () => Invoice[];
  getDueTomorrow: () => Invoice[];
  getOverdue: () => Invoice[];
  searchInvoices: (searchTerm: string) => Invoice[];
  getSupplierSuggestions: (searchTerm: string) => Supplier[];
  addOrUpdateSupplier: (name: string, pib: string, brojRacuna: string) => Promise<void>;
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setInvoices([]);
      setSuppliers([]);
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

    // Load suppliers
    const loadSuppliers = async () => {
      const suppliersSnapshot = await getDocs(collection(db, 'suppliers'));
      const supplierData: Supplier[] = [];
      suppliersSnapshot.forEach((doc) => {
        supplierData.push({ id: doc.id, ...doc.data() } as Supplier);
      });
      setSuppliers(supplierData);
    };
    loadSuppliers();

    // Subscribe to suppliers changes
    const suppliersUnsubscribe = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      const supplierData: Supplier[] = [];
      snapshot.forEach((doc) => {
        supplierData.push({ id: doc.id, ...doc.data() } as Supplier);
      });
      setSuppliers(supplierData);
    });

    return () => {
      unsubscribe();
      suppliersUnsubscribe();
    };
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

  // Get invoices due on the next working day (for reminder 1 working day before)
  const getDueTomorrow = () => {
    const today = new Date();
    const nextWorkDay = getNextWorkingDay(today);
    const nextWorkDayStr = nextWorkDay.toISOString().split('T')[0];
    return getFilteredInvoices().filter(
      inv => inv.datumDospeca === nextWorkDayStr && inv.status === 'neplaceno'
    );
  };

  const getOverdue = () => {
    const today = new Date().toISOString().split('T')[0];
    return getFilteredInvoices().filter(
      inv => inv.datumDospeca < today && inv.status === 'neplaceno'
    );
  };

  // Extended search - by supplier name OR invoice number
  const searchInvoices = (searchTerm: string) => {
    const term = searchTerm.toLowerCase();
    return getFilteredInvoices().filter(
      inv => inv.dobavljac.toLowerCase().includes(term) ||
             inv.brojFakture.toLowerCase().includes(term)
    );
  };

  // Get supplier suggestions for autocomplete
  const getSupplierSuggestions = (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    return suppliers.filter(s => s.name.toLowerCase().includes(term));
  };

  // Add or update supplier in database
  const addOrUpdateSupplier = async (name: string, pib: string, brojRacuna: string) => {
    if (!name) return;

    // Check if supplier already exists (by name)
    const existingSupplier = suppliers.find(
      s => s.name.toLowerCase() === name.toLowerCase()
    );

    if (existingSupplier) {
      // Update existing supplier if bank account changed
      if (existingSupplier.brojRacuna !== brojRacuna || existingSupplier.pib !== pib) {
        await updateDoc(doc(db, 'suppliers', existingSupplier.id), {
          pib,
          brojRacuna,
          updatedAt: Date.now(),
        });
      }
    } else {
      // Add new supplier
      await addDoc(collection(db, 'suppliers'), {
        name,
        pib,
        brojRacuna,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  };

  const value = {
    invoices: getFilteredInvoices(),
    suppliers,
    loading,
    selectedCompany,
    setSelectedCompany,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    toggleStatus,
    getDueToday,
    getDueTomorrow,
    getOverdue,
    searchInvoices,
    getSupplierSuggestions,
    addOrUpdateSupplier,
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
};
