import Tesseract from 'tesseract.js';

export interface OCRResult {
  brojFakture: string;
  dobavljac: string;
  pibDobavljaca: string;
  datumPrometa: string;
  datumDospeca: string;
  iznosZaPlacanje: string;
  rawText: string;
}

export const performOCR = async (
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  const result = await Tesseract.recognize(imageFile, 'srp+srp_latn+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const text = result.data.text;
  return extractInvoiceData(text);
};

const extractInvoiceData = (text: string): OCRResult => {
  // Extract invoice number (Broj fakture)
  let brojFakture = '';
  const invoicePatterns = [
    /broj\s*fakture[:\s]*([A-Z0-9\-\/]+)/i,
    /broj\s*dokumenta[:\s]*([A-Z0-9\-\/]+)/i,
    /faktura\s*br[:\.\s]*([A-Z0-9\-\/]+)/i,
    /VP\d+/i,
    /račun\s*br[:\.\s]*([A-Z0-9\-\/]+)/i,
  ];
  for (const pattern of invoicePatterns) {
    const match = text.match(pattern);
    if (match) {
      brojFakture = match[1] || match[0];
      break;
    }
  }

  // Extract supplier name (Dobavljač / Prodavac)
  let dobavljac = '';
  const supplierPatterns = [
    /prodavac[:\s]*([^\n]+)/i,
    /dobavljač[:\s]*([^\n]+)/i,
    /naziv[:\s]*([^\n]+d\.?o\.?o\.?[^\n]*)/i,
    /([A-Z][A-Z\s]+D\.?O\.?O\.?[^\n]*)/,
  ];
  for (const pattern of supplierPatterns) {
    const match = text.match(pattern);
    if (match) {
      dobavljac = match[1]?.trim() || match[0]?.trim() || '';
      break;
    }
  }

  // Extract PIB
  let pibDobavljaca = '';
  const pibPatterns = [
    /PIB[:\s]*(\d{9})/i,
    /poreski\s*broj[:\s]*(\d{9})/i,
    /(\d{9})/,
  ];
  for (const pattern of pibPatterns) {
    const match = text.match(pattern);
    if (match) {
      pibDobavljaca = match[1];
      break;
    }
  }

  // Extract dates
  let datumPrometa = '';
  let datumDospeca = '';
  const datePattern = /(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})/g;
  const dates: string[] = [];
  let dateMatch;
  while ((dateMatch = datePattern.exec(text)) !== null) {
    const [, day, month, year] = dateMatch;
    dates.push(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }

  // Look for specific date labels
  const prometaMatch = text.match(/datum\s*prometa[:\s]*(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})/i);
  if (prometaMatch) {
    datumPrometa = `${prometaMatch[3]}-${prometaMatch[2].padStart(2, '0')}-${prometaMatch[1].padStart(2, '0')}`;
  } else if (dates.length > 0) {
    datumPrometa = dates[0];
  }

  const dospecaMatch = text.match(/datum\s*dospe[cć]a[:\s]*(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})/i);
  if (dospecaMatch) {
    datumDospeca = `${dospecaMatch[3]}-${dospecaMatch[2].padStart(2, '0')}-${dospecaMatch[1].padStart(2, '0')}`;
  } else if (dates.length > 1) {
    datumDospeca = dates[1];
  }

  // Extract amount (Iznos za plaćanje)
  let iznosZaPlacanje = '';
  const amountPatterns = [
    /iznos\s*za\s*pla[cć]anje[:\s]*([\d\.,]+)/i,
    /ukupan\s*iznos\s*fakture[:\s]*([\d\.,]+)/i,
    /ukupno[:\s]*([\d\.,]+)\s*RSD/i,
    /za\s*uplatu[:\s]*([\d\.,]+)/i,
    /total[:\s]*([\d\.,]+)/i,
  ];
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      iznosZaPlacanje = match[1].replace(/\./g, '').replace(',', '.');
      break;
    }
  }

  return {
    brojFakture,
    dobavljac,
    pibDobavljaca,
    datumPrometa,
    datumDospeca,
    iznosZaPlacanje,
    rawText: text,
  };
};

export const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return '';
  // Assume format DD.MM.YYYY or already YYYY-MM-DD
  if (dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
};

// Single field OCR - scans image and extracts specific field type
export type FieldType = 'dobavljac' | 'pib' | 'brojFakture' | 'iznos' | 'datumPrometa' | 'datumDospeca' | 'brojRacuna';

export const performFieldOCR = async (
  imageFile: File,
  fieldType: FieldType,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const result = await Tesseract.recognize(imageFile, 'srp+srp_latn+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const text = result.data.text;
  return extractFieldValue(text, fieldType);
};

const extractFieldValue = (text: string, fieldType: FieldType): string => {
  switch (fieldType) {
    case 'dobavljac': {
      // Try to find company name
      const patterns = [
        /prodavac[:\s]*([^\n]+)/i,
        /dobavljač[:\s]*([^\n]+)/i,
        /naziv[:\s]*([^\n]+d\.?o\.?o\.?[^\n]*)/i,
        /([A-Z][A-Z\s]+D\.?O\.?O\.?[^\n]*)/,
      ];
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return match[1]?.trim() || match[0]?.trim() || '';
        }
      }
      // If no pattern matches, return the first line of text (cleaned)
      const firstLine = text.split('\n')[0]?.trim();
      return firstLine || '';
    }

    case 'pib': {
      const patterns = [
        /PIB[:\s]*(\d{9})/i,
        /poreski\s*broj[:\s]*(\d{9})/i,
        /(\d{9})/,
      ];
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[1];
      }
      return '';
    }

    case 'brojFakture': {
      const patterns = [
        /broj\s*fakture[:\s]*([A-Z0-9\-\/]+)/i,
        /broj\s*dokumenta[:\s]*([A-Z0-9\-\/]+)/i,
        /faktura\s*br[:\.\s]*([A-Z0-9\-\/]+)/i,
        /VP\d+/i,
        /račun\s*br[:\.\s]*([A-Z0-9\-\/]+)/i,
        /([A-Z0-9\-\/]+)/i, // Fallback - first alphanumeric sequence
      ];
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[1] || match[0];
      }
      return text.trim().split('\n')[0] || '';
    }

    case 'iznos': {
      const patterns = [
        /iznos\s*za\s*pla[cć]anje[:\s]*([\d\.,]+)/i,
        /ukupan\s*iznos\s*fakture[:\s]*([\d\.,]+)/i,
        /ukupno[:\s]*([\d\.,]+)\s*RSD/i,
        /za\s*uplatu[:\s]*([\d\.,]+)/i,
        /total[:\s]*([\d\.,]+)/i,
        /([\d\.]+,\d{2})/,  // Match number with decimal comma
        /([\d,]+\.\d{2})/,  // Match number with decimal point
      ];
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return match[1].replace(/\./g, '').replace(',', '.');
        }
      }
      return '';
    }

    case 'datumPrometa':
    case 'datumDospeca': {
      const datePattern = /(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})/;
      const match = text.match(datePattern);
      if (match) {
        const [, day, month, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return '';
    }

    case 'brojRacuna': {
      // Serbian bank account pattern: XXX-XXXXXXXXX-XX or similar
      const patterns = [
        /(\d{3}[-\s]?\d{13}[-\s]?\d{2})/,  // 18 digits with separators
        /(\d{3}[-\s]?\d{12,13}[-\s]?\d{2})/,
        /tekući\s*račun[:\s]*([0-9\-\s]+)/i,
        /račun[:\s]*([0-9\-\s]+)/i,
        /([0-9]{3}[0-9\-\s]{10,20})/,
      ];
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return match[1].replace(/\s/g, '');
        }
      }
      return '';
    }

    default:
      return text.trim();
  }
};
