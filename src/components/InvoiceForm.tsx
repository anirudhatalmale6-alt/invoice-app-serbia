import React, { useState, useRef } from 'react';
import { useInvoices } from '../context/InvoiceContext';
import { performOCR } from '../services/ocr';
import type { OCRResult } from '../services/ocr';
import type { Invoice } from '../types';
import '../styles/InvoiceForm.css';

interface Props {
  invoice: Invoice | null;
  onClose: () => void;
}

const COMPANIES = ['Kompanija 1', 'Kompanija 2']; // Will be configurable

const InvoiceForm: React.FC<Props> = ({ invoice, onClose }) => {
  const { addInvoice, updateInvoice } = useInvoices();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    brojFakture: invoice?.brojFakture || '',
    dobavljac: invoice?.dobavljac || '',
    pibDobavljaca: invoice?.pibDobavljaca || '',
    datumPrometa: invoice?.datumPrometa || '',
    datumDospeca: invoice?.datumDospeca || '',
    iznosZaPlacanje: invoice?.iznosZaPlacanje?.toString() || '',
    valuta: invoice?.valuta || 'RSD',
    status: invoice?.status || 'neplaceno',
    kompanija: invoice?.kompanija || COMPANIES[0],
    notes: invoice?.notes || '',
  });

  const [ocrProgress, setOcrProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setOcrProgress(0);
    setError('');

    try {
      const result: OCRResult = await performOCR(file, setOcrProgress);

      setFormData(prev => ({
        ...prev,
        brojFakture: result.brojFakture || prev.brojFakture,
        dobavljac: result.dobavljac || prev.dobavljac,
        pibDobavljaca: result.pibDobavljaca || prev.pibDobavljaca,
        datumPrometa: result.datumPrometa || prev.datumPrometa,
        datumDospeca: result.datumDospeca || prev.datumDospeca,
        iznosZaPlacanje: result.iznosZaPlacanje || prev.iznosZaPlacanje,
      }));
    } catch (err) {
      setError('Greška pri čitanju dokumenta. Možete uneti podatke ručno.');
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const invoiceData = {
        ...formData,
        iznosZaPlacanje: parseFloat(formData.iznosZaPlacanje.replace(',', '.')) || 0,
        status: formData.status as 'placeno' | 'neplaceno',
      };

      if (invoice) {
        await updateInvoice(invoice.id, invoiceData);
      } else {
        await addInvoice(invoiceData);
      }
      onClose();
    } catch (err) {
      setError('Greška pri čuvanju fakture. Pokušajte ponovo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{invoice ? 'Izmeni fakturu' : 'Nova faktura'}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="ocr-upload">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            {isProcessing ? `Čitanje... ${ocrProgress}%` : '📷 Učitaj sliku/PDF (OCR)'}
          </button>
          {isProcessing && (
            <div className="progress-bar">
              <div className="progress" style={{ width: `${ocrProgress}%` }}></div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Broj fakture</label>
              <input
                type="text"
                name="brojFakture"
                value={formData.brojFakture}
                onChange={handleChange}
                placeholder="VP2600184"
                required
              />
            </div>
            <div className="form-group">
              <label>Kompanija</label>
              <select name="kompanija" value={formData.kompanija} onChange={handleChange}>
                {COMPANIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Dobavljač</label>
            <input
              type="text"
              name="dobavljac"
              value={formData.dobavljac}
              onChange={handleChange}
              placeholder="Naziv dobavljača"
              required
            />
          </div>

          <div className="form-group">
            <label>PIB dobavljača</label>
            <input
              type="text"
              name="pibDobavljaca"
              value={formData.pibDobavljaca}
              onChange={handleChange}
              placeholder="123456789"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Datum prometa</label>
              <input
                type="date"
                name="datumPrometa"
                value={formData.datumPrometa}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Datum dospeća</label>
              <input
                type="date"
                name="datumDospeca"
                value={formData.datumDospeca}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Iznos za plaćanje</label>
              <input
                type="text"
                name="iznosZaPlacanje"
                value={formData.iznosZaPlacanje}
                onChange={handleChange}
                placeholder="8831.23"
                required
              />
            </div>
            <div className="form-group">
              <label>Valuta</label>
              <select name="valuta" value={formData.valuta} onChange={handleChange}>
                <option value="RSD">RSD</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="neplaceno">Neplaćeno</option>
              <option value="placeno">Plaćeno</option>
            </select>
          </div>

          <div className="form-group">
            <label>Napomene</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Dodatne napomene..."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Otkaži
            </button>
            <button type="submit" className="save-button" disabled={saving}>
              {saving ? 'Čuvanje...' : (invoice ? 'Sačuvaj izmene' : 'Dodaj fakturu')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
