import React from 'react';
import { useInvoices } from '../context/InvoiceContext';
import type { Invoice } from '../types';
import '../styles/InvoiceList.css';

interface Props {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
}

const InvoiceList: React.FC<Props> = ({ invoices, onEdit }) => {
  const { toggleStatus, deleteInvoice } = useInvoices();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('sr-RS');
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString('sr-RS', { minimumFractionDigits: 2 })} ${currency}`;
  };

  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === 'placeno') return false;
    const today = new Date().toISOString().split('T')[0];
    return invoice.datumDospeca < today;
  };

  const isDueToday = (invoice: Invoice) => {
    if (invoice.status === 'placeno') return false;
    const today = new Date().toISOString().split('T')[0];
    return invoice.datumDospeca === today;
  };

  const handleDelete = async (invoice: Invoice) => {
    if (window.confirm(`Da li ste sigurni da želite da obrišete fakturu ${invoice.brojFakture}?`)) {
      await deleteInvoice(invoice.id);
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="empty-state">
        <p>Nema faktura za prikaz</p>
      </div>
    );
  }

  return (
    <div className="invoice-list">
      {/* Desktop Table View */}
      <table className="invoice-table desktop-view">
        <thead>
          <tr>
            <th>Br. fakture</th>
            <th>Dobavljač</th>
            <th>Datum dospeća</th>
            <th>Iznos</th>
            <th>Status</th>
            <th>Akcije</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(invoice => (
            <tr
              key={invoice.id}
              className={`
                ${invoice.status === 'placeno' ? 'paid' : ''}
                ${isOverdue(invoice) ? 'overdue' : ''}
                ${isDueToday(invoice) ? 'due-today' : ''}
              `}
            >
              <td>{invoice.brojFakture}</td>
              <td>
                <div className="supplier-cell">
                  <span className="supplier-name">{invoice.dobavljac}</span>
                  {invoice.kompanija && (
                    <span className="company-tag">{invoice.kompanija}</span>
                  )}
                </div>
              </td>
              <td>
                <span className={isDueToday(invoice) ? 'today-badge' : ''}>
                  {formatDate(invoice.datumDospeca)}
                  {isDueToday(invoice) && ' (Danas)'}
                </span>
              </td>
              <td className="amount">{formatAmount(invoice.iznosZaPlacanje, invoice.valuta)}</td>
              <td>
                <button
                  className={`status-badge ${invoice.status}`}
                  onClick={() => toggleStatus(invoice)}
                >
                  {invoice.status === 'placeno' ? 'Plaćeno' : 'Neplaćeno'}
                </button>
              </td>
              <td className="actions">
                <button onClick={() => onEdit(invoice)} className="edit-btn">Izmeni</button>
                <button onClick={() => handleDelete(invoice)} className="delete-btn">Obriši</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Card View */}
      <div className="invoice-cards mobile-view">
        {invoices.map(invoice => (
          <div
            key={invoice.id}
            className={`invoice-card
              ${invoice.status === 'placeno' ? 'paid' : ''}
              ${isOverdue(invoice) ? 'overdue' : ''}
              ${isDueToday(invoice) ? 'due-today' : ''}
            `}
          >
            <div className="card-header">
              <span className="invoice-number">{invoice.brojFakture}</span>
              <button
                className={`status-badge ${invoice.status}`}
                onClick={() => toggleStatus(invoice)}
              >
                {invoice.status === 'placeno' ? 'Plaćeno' : 'Neplaćeno'}
              </button>
            </div>

            <div className="card-body">
              <div className="supplier">{invoice.dobavljac}</div>
              <span className="company-tag">{invoice.kompanija}</span>

              <div className="card-details">
                <div className="detail">
                  <span className="label">Dospeće:</span>
                  <span className={isDueToday(invoice) ? 'today-badge' : ''}>
                    {formatDate(invoice.datumDospeca)}
                    {isDueToday(invoice) && ' (Danas)'}
                  </span>
                </div>
                <div className="detail amount">
                  <span className="label">Iznos:</span>
                  <span>{formatAmount(invoice.iznosZaPlacanje, invoice.valuta)}</span>
                </div>
              </div>
            </div>

            <div className="card-actions">
              <button onClick={() => onEdit(invoice)} className="edit-btn">Izmeni</button>
              <button onClick={() => handleDelete(invoice)} className="delete-btn">Obriši</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvoiceList;
