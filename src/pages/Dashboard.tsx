import React, { useState } from 'react';
import { useInvoices } from '../context/InvoiceContext';
import { useAuth } from '../context/AuthContext';
import InvoiceList from '../components/InvoiceList';
import InvoiceForm from '../components/InvoiceForm';
import CompanySelector from '../components/CompanySelector';
import SearchBar from '../components/SearchBar';
import DueTodayCard from '../components/DueTodayCard';
import StorageManager from '../components/StorageManager';
import type { Invoice } from '../types';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const { invoices, getDueToday, getDueTomorrow, getOverdue, searchInvoices, loading, selectedCompany } = useInvoices();
  const { userData, signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue' | 'today' | 'tomorrow'>('all');
  const [showStorageManager, setShowStorageManager] = useState(false);

  const dueToday = getDueToday();
  const dueTomorrow = getDueTomorrow();
  const overdue = getOverdue();

  const getFilteredInvoices = () => {
    let filtered = searchTerm ? searchInvoices(searchTerm) : invoices;

    switch (filter) {
      case 'unpaid':
        return filtered.filter(inv => inv.status === 'neplaceno');
      case 'paid':
        return filtered.filter(inv => inv.status === 'placeno');
      case 'overdue':
        return overdue;
      case 'today':
        return dueToday;
      case 'tomorrow':
        return dueTomorrow;
      default:
        return filtered;
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInvoice(null);
  };

  const unpaidTotal = invoices
    .filter(inv => inv.status === 'neplaceno')
    .reduce((sum, inv) => sum + inv.iznosZaPlacanje, 0);

  if (loading) {
    return <div className="loading">Učitavanje...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Fakture</h1>
          <CompanySelector />
        </div>
        <div className="header-right">
          <button onClick={() => setShowStorageManager(true)} className="storage-button" title="Upravljanje memorijom">
            💾
          </button>
          <span className="user-name">{userData?.displayName || userData?.email}</span>
          <button onClick={signOut} className="logout-button">
            Odjavi se
          </button>
        </div>
      </header>

      <div className="dashboard-stats">
        <DueTodayCard count={dueToday.length} />
        <div className={`stat-card tomorrow ${dueTomorrow.length > 0 ? 'has-items' : ''}`}>
          <span className="stat-number">{dueTomorrow.length}</span>
          <span className="stat-label">Dospeva sutra</span>
          {dueTomorrow.length > 0 && <span className="reminder-icon">🔔</span>}
        </div>
        <div className="stat-card overdue">
          <span className="stat-number">{overdue.length}</span>
          <span className="stat-label">Istekle fakture</span>
        </div>
        <div className="stat-card unpaid">
          <span className="stat-number">{invoices.filter(i => i.status === 'neplaceno').length}</span>
          <span className="stat-label">Neplaćene</span>
        </div>
        <div className="stat-card total">
          <span className="stat-number">{unpaidTotal.toLocaleString('sr-RS')} RSD</span>
          <span className="stat-label">
            Ukupno za plaćanje
            {selectedCompany !== 'all' && <span className="company-indicator"> ({selectedCompany})</span>}
          </span>
        </div>
      </div>

      <div className="dashboard-actions">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Sve
          </button>
          <button
            className={filter === 'today' ? 'active' : ''}
            onClick={() => setFilter('today')}
          >
            Danas dospevaju
          </button>
          <button
            className={filter === 'tomorrow' ? 'active' : ''}
            onClick={() => setFilter('tomorrow')}
          >
            Sutra dospevaju
          </button>
          <button
            className={filter === 'overdue' ? 'active' : ''}
            onClick={() => setFilter('overdue')}
          >
            Istekle
          </button>
          <button
            className={filter === 'unpaid' ? 'active' : ''}
            onClick={() => setFilter('unpaid')}
          >
            Neplaćene
          </button>
          <button
            className={filter === 'paid' ? 'active' : ''}
            onClick={() => setFilter('paid')}
          >
            Plaćene
          </button>
        </div>
        <button className="add-button" onClick={() => setShowForm(true)}>
          + Dodaj fakturu
        </button>
      </div>

      <InvoiceList invoices={getFilteredInvoices()} onEdit={handleEdit} />

      {showForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onClose={handleCloseForm}
        />
      )}

      {showStorageManager && (
        <StorageManager onClose={() => setShowStorageManager(false)} />
      )}
    </div>
  );
};

export default Dashboard;
