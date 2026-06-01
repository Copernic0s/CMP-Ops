import * as XLSX from 'xlsx';
import { normalizeCompanyKey } from './companyKey.js';

export { normalizeCompanyKey } from './companyKey.js';

export const DEFAULT_PORTFOLIO_SHEET_NAME = 'Client BY agent';
export const DEFAULT_PORTFOLIO_SOURCE_URL =
  'https://sheet.zohopublic.com/sheet/published/w0yyac483bf4377414680872e6205cd34447b?download=xlsx';

const normalizeText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const findPortfolioSheetName = (sheetNames, desiredName = DEFAULT_PORTFOLIO_SHEET_NAME) => {
  const target = String(desiredName || '').trim().toLowerCase();
  return (sheetNames || []).find((name) => String(name || '').trim().toLowerCase() === target) || null;
};

export const extractPortfolioCompanies = (workbook, desiredSheetName = DEFAULT_PORTFOLIO_SHEET_NAME) => {
  if (!workbook || !Array.isArray(workbook.SheetNames)) {
    throw new Error('Invalid workbook');
  }

  const sheetName = findPortfolioSheetName(workbook.SheetNames, desiredSheetName);
  if (!sheetName) {
    throw new Error(`Sheet "${desiredSheetName}" not found`);
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: '',
    raw: true
  });

  const columns = rows.length > 0 ? Object.keys(rows[0]).reduce((acc, key) => {
    acc[String(key).trim().toLowerCase()] = key;
    return acc;
  }, {}) : {};

  const companyColumn = columns['company name'] || columns.company;
  if (!companyColumn) {
    throw new Error('Portfolio sheet must include a "Company Name" column');
  }

  const companies = [];
  const seen = new Set();

  for (const row of rows) {
    const companyName = normalizeText(row[companyColumn]);
    const key = normalizeCompanyKey(companyName);
    if (!companyName || !key || seen.has(key)) continue;
    seen.add(key);
    companies.push({
      companyName,
      companyKey: key,
      raw: row
    });
  }

  return {
    sheetName,
    totalRows: rows.length,
    companies
  };
};

export const fetchPortfolioWorkbook = async (sourceUrl = DEFAULT_PORTFOLIO_SOURCE_URL) => {
  const response = await fetch(sourceUrl, {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio workbook (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return XLSX.read(arrayBuffer, { type: 'array' });
};

export const loadPortfolioFromSource = async ({
  sourceUrl = DEFAULT_PORTFOLIO_SOURCE_URL,
  desiredSheetName = DEFAULT_PORTFOLIO_SHEET_NAME
} = {}) => {
  const workbook = await fetchPortfolioWorkbook(sourceUrl);
  return extractPortfolioCompanies(workbook, desiredSheetName);
};
