/**
 * CSV export.
 *
 * Three things here matter beyond "join the values with commas":
 *
 *  - Excel needs a UTF-8 BOM or it mangles non-Latin scripts. This project carries
 *    Tamil, Hindi, Bengali and other Indian-language fields, so without the BOM an
 *    exported file opens as mojibake.
 *  - A cell beginning with = + - @ is executed as a formula by Excel and Sheets.
 *    Victim-supplied free text reaches these exports, so those cells are prefixed
 *    to neutralise CSV injection.
 *  - Exports are evidence. Each file can carry a provenance block recording who
 *    exported it, when, from which view, and under which filters, which matches the
 *    audit-trail expectation that applies everywhere else in the console.
 */

export interface CsvColumn<T> {
  /** Column header as it appears in the file. */
  header: string;
  /** Pull the cell value out of a row. */
  value: (row: T) => string | number | null | undefined;
  /** Optional grouping used by the export dialog to offer column sets. */
  group?: string;
}

export interface CsvMeta {
  title: string;
  /** e.g. "Officer Rajesh Kumar (district_officer)" */
  exportedBy?: string;
  /** Human-readable description of any active filters. */
  filters?: string;
  /** Extra key/value lines to record. */
  extra?: Record<string, string | number>;
}

const FORMULA_PREFIX = /^[=+\-@\t\r]/;
/** Plain numbers, including negatives and decimals, are never formulas. */
const NUMERIC = /^-?\d+(\.\d+)?$/;

/** Quote, escape, and defuse a single cell. */
function cell(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  let text = String(input);

  // Neutralise spreadsheet formula injection without losing the original text.
  // Negative numbers start with "-" but must stay numeric, or a deviation of -2.2
  // lands in the sheet as the text '-2.2 and stops being chartable.
  if (FORMULA_PREFIX.test(text) && !NUMERIC.test(text)) text = `'${text}`;

  // RFC 4180: escape embedded quotes by doubling, wrap if the value contains a
  // delimiter, quote or line break.
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function metaBlock(meta: CsvMeta, rowCount: number): string[] {
  const lines: string[][] = [
    ['SAHAAYA — ' + meta.title],
    ['Generated', new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })],
  ];
  if (meta.exportedBy) lines.push(['Exported by', meta.exportedBy]);
  if (meta.filters) lines.push(['Filters applied', meta.filters]);
  lines.push(['Records', String(rowCount)]);
  for (const [key, value] of Object.entries(meta.extra ?? {})) {
    lines.push([key, String(value)]);
  }
  lines.push(['Data classification', 'PROTOTYPE DATA — NOT REAL VICTIM DATA']);
  lines.push([]); // blank row separating provenance from the table
  return lines.map((line) => line.map(cell).join(','));
}

/** Build the CSV text for a set of rows. */
export function toCsv<T>(
  rows: T[],
  columns: CsvColumn<T>[],
  meta?: CsvMeta,
): string {
  const lines: string[] = [];
  if (meta) lines.push(...metaBlock(meta, rows.length));

  lines.push(columns.map((c) => cell(c.header)).join(','));
  for (const row of rows) {
    lines.push(columns.map((c) => cell(c.value(row))).join(','));
  }
  return lines.join('\r\n');
}

/** Trigger a browser download. Returns the filename used. */
export function downloadCsv(baseName: string, csv: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `sahaaya-${baseName}-${stamp}.csv`;

  // Leading BOM so Excel detects UTF-8.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

/** Rough byte size of the finished file, for the size hint in the dialog. */
export function estimateSize(csv: string): string {
  const bytes = new Blob([csv]).size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
