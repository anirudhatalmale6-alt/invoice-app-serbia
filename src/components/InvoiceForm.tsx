import React, { useState, useRef, useEffect } from 'react';
import { useInvoices } from '../context/InvoiceContext';
import { performFieldOCR } from '../services/ocr';
import type { FieldType } from '../services/ocr';
import type { Invoice, Supplier } from '../types';
import '../styles/InvoiceForm.css';

interface Props {
  invoice: Invoice | null;
  onClose: () => void;
}

const COMPANIES = ['Sirius Medical', 'S-Life'];

const InvoiceForm: React.FC<Props> = ({ invoice, onClose }) => {
  const { addInvoice, updateInvoice, getSupplierSuggestions, addOrUpdateSupplier, selectedCompany } = useInvoices();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeField, setActiveField] = useState<FieldType | null>(null);

  // Default to selected company from header, or first company if "all" is selected
  const defaultCompany = selectedCompany === 'all' ? COMPANIES[0] : selectedCompany;

  const [formData, setFormData] = useState({
    brojFakture: invoice?.brojFakture || '',
    dobavljac: invoice?.dobavljac || '',
    pibDobavljaca: invoice?.pibDobavljaca || '',
    brojRacunaZaUplatu: invoice?.brojRacunaZaUplatu || '',
    datumPrometa: invoice?.datumPrometa || '',
    datumDospeca: invoice?.datumDospeca || '',
    iznosZaPlacanje: invoice?.iznosZaPlacanje?.toString() || '',
    valuta: invoice?.valuta || 'RSD',
    status: invoice?.status || 'neplaceno',
    kompanija: invoice?.kompanija || defaultCompany,
    notes: invoice?.notes || '',
  });

  const [ocrProgress, setOcrProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Supplier autocomplete state
  const [supplierSuggestions, setSupplierSuggestions] = useState<Supplier[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const supplierInputRef = useRef<HTMLInputElement>(null);

  // Update supplier suggestions when typing
  useEffect(() => {
    if (formData.dobavljac.length >= 2) {
      const suggestions = getSupplierSuggestions(formData.dobavljac);
      setSupplierSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSupplierSuggestions([]);
      setShowSuggestions(false);
    }
  }, [formData.dobavljac, getSupplierSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (supplierInputRef.current && !supplierInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplierSelect = (supplier: Supplier) => {
    setFormData(prev => ({
      ...prev,
      dobavljac: supplier.name,
      pibDobavljaca: supplier.pib || prev.pibDobavljaca,
      brojRacunaZaUplatu: supplier.brojRacuna || prev.brojRacunaZaUplatu,
    }));
    setShowSuggestions(false);
  };

  // Handle per-field OCR scanning
  const handleFieldScan = (fieldType: FieldType) => {
    setActiveField(fieldType);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setOcrProgress(0);
    setError('');

    try {
      if (activeField) {
        // Single field OCR
        const value = await performFieldOCR(file, activeField, setOcrProgress);

        // Map field type to form field name
        const fieldMapping: Record<FieldType, string> = {
          dobavljac: 'dobavljac',
          pib: 'pibDobavljaca',
          brojFakture: 'brojFakture',
          iznos: 'iznosZaPlacanje',
          datumPrometa: 'datumPrometa',
          datumDospeca: 'datumDospeca',
          brojRacuna: 'brojRacunaZaUplatu',
        };

        const formField = fieldMapping[activeField];
        if (formField && value) {
          setFormData(prev => ({ ...prev, [formField]: value }));
        }
      }
    } catch (err) {
      setError('Greška pri čitanju. Pokušajte ponovo ili unesite ručno.');
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
      setActiveField(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

      // Save supplier to database for future autocomplete
      if (formData.dobavljac) {
        await addOrUpdateSupplier(
          formData.dobavljac,
          formData.pibDobavljaca,
          formData.brojRacunaZaUplatu
        );
      }

      onClose();
    } catch (err) {
      setError('Greška pri čuvanju fakture. Pokušajte ponovo.');
    } finally {
      setSaving(false);
    }
  };

  const renderScanButton = (fieldType: FieldType) => (
    <button
      type="button"
      className="scan-field-button"
      onClick={() => handleFieldScan(fieldType)}
      disabled={isProcessing}
      title="Skeniraj kamerom"
    >
      📷
    </button>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{invoice ? 'Izmeni fakturu' : 'Nova faktura'}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="form-error">{error}</div>}

        {isProcessing && (
          <div className="ocr-processing">
            <div className="processing-text">Skeniram... {ocrProgress}%</div>
            <div className="progress-bar">
              <div className="progress" style={{ width: `${ocrProgress}%` }}></div>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Broj fakture</label>
              <div className="input-with-scan">
                <input
                  type="text"
                  name="brojFakture"
                  value={formData.brojFakture}
                  onChange={handleChange}
                  placeholder="VP2600184"
                  required
                />
                {renderScanButton('brojFakture')}
              </div>
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

          <div className="form-group" ref={supplierInputRef}>
            <label>Dobavljač</label>
            <div className="input-with-scan">
              <input
                type="text"
                name="dobavljac"
                value={formData.dobavljac}
                onChange={handleChange}
                onFocus={() => formData.dobavljac.length >= 2 && setShowSuggestions(supplierSuggestions.length > 0)}
                placeholder="Naziv dobavljača"
                required
                autoComplete="off"
              />
              {renderScanButton('dobavljac')}
            </div>
            {showSuggestions && (
              <ul className="supplier-suggestions">
                {supplierSuggestions.map(supplier => (
                  <li
                    key={supplier.id}
                    onClick={() => handleSupplierSelect(supplier)}
                  >
                    <span className="supplier-name">{supplier.name}</span>
                    {supplier.brojRacuna && (
                      <span className="supplier-account">Račun: {supplier.brojRacuna}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group">
            <label>PIB dobavljača</label>
            <div className="input-with-scan">
              <input
                type="text"
                name="pibDobavljaca"
                value={formData.pibDobavljaca}
                onChange={handleChange}
                placeholder="123456789"
              />
              {renderScanButton('pib')}
            </div>
          </div>

          <div className="form-group">
            <label>Broj računa za uplatu</label>
            <div className="input-with-scan">
              <input
                type="text"
                name="brojRacunaZaUplatu"
                value={formData.brojRacunaZaUplatu}
                onChange={handleChange}
                placeholder="160-0000000123456-12"
              />
              {renderScanButton('brojRacuna')}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Datum prometa</label>
              <div className="input-with-scan">
                <input
                  type="date"
                  name="datumPrometa"
                  value={formData.datumPrometa}
                  onChange={handleChange}
                />
                {renderScanButton('datumPrometa')}
              </div>
            </div>
            <div className="form-group">
              <label>Datum dospeća</label>
              <div className="input-with-scan">
                <input
                  type="date"
                  name="datumDospeca"
                  value={formData.datumDospeca}
                  onChange={handleChange}
                  required
                />
                {renderScanButton('datumDospeca')}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Iznos za plaćanje</label>
              <div className="input-with-scan">
                <input
                  type="text"
                  name="iznosZaPlacanje"
                  value={formData.iznosZaPlacanje}
                  onChange={handleChange}
                  placeholder="8831.23"
                  required
                />
                {renderScanButton('iznos')}
              </div>
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
