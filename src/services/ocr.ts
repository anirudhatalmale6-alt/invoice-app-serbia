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
