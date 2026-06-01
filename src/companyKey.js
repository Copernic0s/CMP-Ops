const normalizeText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const normalizeCompanyKey = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/\b(llc|inc|corp|co|ltd|limited|transportation|logistics|express)\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
