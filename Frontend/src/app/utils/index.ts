// ─── Date / Time Utilities ────────────────────────────────────────────────────

const MONTH_ABBR = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

/** Pads a number to 2 digits with a leading zero when needed. */
const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Formats a date as "YYYY-MM-DD HH:MM:SS" (local time) — suitable for DB inserts. */
export const bdDateFormat = (date?: Date | string): string => {
  const dt = date ? new Date(date) : new Date();
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:${pad2(dt.getSeconds())}`;
};

/** Formats a date as "DD/MM/YYYY" (local time). */
export const dateFormat = (dt?: Date | string): string => {
  const date = dt ? new Date(dt) : new Date();
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
};

/** Formats a date as "YYYY-MM-DD" (UTC). */
export function formatDate(date: Date | string): string {
  return new Date(date).toISOString().split('T')[0] ?? '';
}

/** Formats a datetime as "YYYY-MM-DD HH:MM:SS" (UTC). */
export function formatDatetime(date: Date | string): string {
  return new Date(date).toISOString().replace('T', ' ').substring(0, 19);
}

/** Formats a date as "Mon DD, YYYY" using UTC (e.g. "Jan 5, 2024"). */
export function formatDatePatient(dateString: string | Date): string {
  const date = new Date(dateString);
  return `${MONTH_ABBR[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/** Formats a datetime as "DD/Mon/YYYY às HH:MM" (local time). */
export function formatDatetimeView(date: Date | string): string {
  const d = new Date(date);
  return `${pad2(d.getDate())}/${MONTH_ABBR[d.getMonth()]}/${d.getFullYear()} às ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Returns an array of all months as zero-padded strings: ["01", …, "12"]. */
export const allMonths = (): string[] => Array.from({ length: 12 }, (_, i) => pad2(i + 1));

/** Returns months from January up to and including the current month. */
export const monthsUntilCurrent = (): string[] =>
  Array.from({ length: new Date().getMonth() + 1 }, (_, i) => pad2(i + 1));

// ─── Time Utilities ───────────────────────────────────────────────────────────

/** Parses a "HH:MM[:SS]" string or Date. Falls back to the current time if the value is invalid. */
export function parseTimeOrDate(value: string | Date | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;

  const timeMatch = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const h = timeMatch[1] ?? '0';
    const m = timeMatch[2] ?? '0';
    const s = timeMatch[3] ?? '0';
    const now = new Date();
    now.setHours(+h, +m, +s, 0);
    return now;
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? new Date() : date;
}

/** Converts a "HH:MM:SS" string (or Date) to a Date object. Returns null if the value is falsy. */
export function convertTimeStringToDate(time?: string | Date | null): Date | null {
  if (!time) return null;
  if (time instanceof Date) return time;

  const parts = time.split(':').map(Number);
  const date = new Date();
  date.setHours(parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, 0);
  return date;
}

/** Normalises a time value to a Date, falling back to now if absent. */
export const normalizeTime = (v: string | Date | null | undefined): Date =>
  v ? (typeof v === 'string' ? (convertTimeStringToDate(v) ?? new Date()) : v) : new Date();

/** Returns the time portion of a date as "HH:MM". */
export function formatTimeOnly(date: string | Date): string {
  const d = typeof date === 'string' ? parseTimeOrDate(date) : date;
  return d.toTimeString().substring(0, 5);
}

// ─── Number / Currency Utilities ─────────────────────────────────────────────

/** Formats a number as Brazilian currency (BRL). */
export const currencyFormatter = (value: number | string): string => {
  if (!Number(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value as number
  );
};

/** Parses a locale-formatted numeric string into a JavaScript float. */
export const parseLocaleNumber = (stringNumber: string, locale: string): number => {
  const thousandSeparator = Intl.NumberFormat(locale)
    .format(11111)
    .replace(/\p{Number}/gu, '');
  const decimalSeparator = Intl.NumberFormat(locale)
    .format(1.1)
    .replace(/\p{Number}/gu, '');
  return parseFloat(
    stringNumber
      .replace(new RegExp('\\' + thousandSeparator, 'g'), '')
      .replace(new RegExp('\\' + decimalSeparator), '.')
  );
};

// ─── Array Utilities ──────────────────────────────────────────────────────────

/**
 * Returns a shuffled copy of `array` truncated to `limit` elements.
 * Does NOT mutate the original array.
 */
export function randomArray<T>(array: T[], limit: number): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy.slice(0, limit);
}

/** Counts elements that are not `undefined`. */
export const countDefined = <T>(arr: T[] = []): number =>
  arr.filter((el) => el !== undefined).length;

/** Counts elements that are `undefined`. */
export const countUndefined = <T>(arr: T[] = []): number =>
  arr.filter((el) => el === undefined).length;

// ─── Object Utilities ─────────────────────────────────────────────────────────

/** Returns true only if `obj` is a plain, non-null, non-array object with no own enumerable properties. */
export function isEmptyObject(obj: object): boolean {
  if (obj === null || Array.isArray(obj) || typeof obj !== 'object') return false;
  return Object.keys(obj).length === 0;
}

/** Formats a role string for display (capitalises first letter). */
export function displayRole(role?: string | null): string {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

// ─── String Utilities ─────────────────────────────────────────────────────────

/** Capitalises the first character of a string. */
export function firstLetterCapitalized(text?: string | null): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ─── Media / File Utilities ───────────────────────────────────────────────────

/** Fetches a remote image URL and returns its Base64-encoded data URL. */
export const getBase64FromUrl = async (url: string): Promise<string | ArrayBuffer | null> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
  });
};

// ─── Validation ───────────────────────────────────────────────────────────────

/** Returns true if `input` is a valid e-mail address. */
export function validateEmail(input: string): boolean {
  const email = input.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Returns true if `input` is a valid Brazilian CPF. */
export function validateCPF(input: string): boolean {
  const cpf = input.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (digits: string, factorStart: number): number => {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += parseInt(digits[i] ?? '0', 10) * (factorStart - i);
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return (
    calcDigit(cpf.slice(0, 9), 10) === parseInt(cpf[9] ?? '', 10) &&
    calcDigit(cpf.slice(0, 10), 11) === parseInt(cpf[10] ?? '', 10)
  );
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

/**
 * Returns a promise that resolves after 1 s, or rejects if `resolver` is false.
 * @deprecated Use only for testing / prototyping.
 */
export function promese(resolver = true): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!resolver) {
        reject(new Error('Deu erro'));
      } else {
        resolve('Promise resolvida');
      }
    }, 1000);
  });
}
