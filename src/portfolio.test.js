import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {
  extractPortfolioCompanies,
  findPortfolioSheetName,
  normalizeCompanyKey
} from './portfolio.js';

test('normalizeCompanyKey removes punctuation and common suffixes', () => {
  assert.equal(normalizeCompanyKey('ACME Logistics LLC'), 'acme');
  assert.equal(normalizeCompanyKey('  Blue Star Inc.  '), 'bluestar');
});

test('findPortfolioSheetName matches case-insensitively', () => {
  assert.equal(findPortfolioSheetName(['Sheet1', 'Client BY agent']), 'Client BY agent');
  assert.equal(findPortfolioSheetName(['Sheet1', 'client by agent']), 'client by agent');
  assert.equal(findPortfolioSheetName(['Sheet1'], 'Missing'), null);
});

test('extractPortfolioCompanies returns unique normalized company keys', () => {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet([
    { 'Company Name': 'ACME Logistics LLC', Agent: 'A' },
    { 'Company Name': 'Acme Logistics', Agent: 'B' },
    { 'Company Name': 'Blue Star Inc', Agent: 'C' }
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Client BY agent');

  const result = extractPortfolioCompanies(workbook, 'Client BY agent');

  assert.equal(result.sheetName, 'Client BY agent');
  assert.equal(result.totalRows, 3);
  assert.equal(result.companies.length, 2);
  assert.deepEqual(
    result.companies.map((row) => row.companyKey),
    ['acme', 'bluestar']
  );
});
