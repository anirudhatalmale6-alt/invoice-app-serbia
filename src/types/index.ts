export interface Invoice {
  id: string;
  brojFakture: string; // Invoice number
  dobavljac: string; // Supplier name
  pibDobavljaca: string; // Supplier PIB/Tax ID
  brojRacunaZaUplatu: string; // Bank account number for payment
  datumPrometa: string; // Invoice date
  datumDospeca: string; // Due date
  iznosZaPlacanje: number; // Amount to pay
  valuta: string; // Currency (RSD)
  status: 'placeno' | 'neplaceno'; // Paid / Unpaid
  kompanija: string; // Company this invoice belongs to
  createdAt: number;
  updatedAt: number;
  createdBy: string; // User ID who created this
  imageUrl?: string; // Optional stored image/PDF
  notes?: string; // Optional notes
}

export interface Supplier {
  id: string;
  name: string; // Supplier name
  pib: string; // Supplier PIB/Tax ID
  brojRacuna: string; // Bank account number
  createdAt: number;
  updatedAt: number;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: number;
}

export interface Company {
  id: string;
  name: string;
  createdAt: number;
}

export interface AppSettings {
  companies: Company[];
  notificationsEnabled: boolean;
  reminderTime: string; // HH:mm format
}
