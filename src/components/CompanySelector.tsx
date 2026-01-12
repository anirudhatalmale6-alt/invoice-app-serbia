import React from 'react';
import { useInvoices } from '../context/InvoiceContext';
import '../styles/CompanySelector.css';

const COMPANIES = ['Kompanija 1', 'Kompanija 2']; // Will be configurable

const CompanySelector: React.FC = () => {
  const { selectedCompany, setSelectedCompany } = useInvoices();

  return (
    <div className="company-selector">
      <select
        value={selectedCompany}
        onChange={(e) => setSelectedCompany(e.target.value)}
      >
        <option value="all">Sve kompanije</option>
        {COMPANIES.map(company => (
          <option key={company} value={company}>
            {company}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CompanySelector;
