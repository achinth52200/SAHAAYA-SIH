'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Download, FileSpreadsheet, Filter, Layers, ShieldCheck, X } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { downloadCsv, estimateSize, toCsv, type CsvColumn } from '@/lib/export';

interface ExportDialogProps<T> {
  open: boolean;
  onClose: () => void;
  /** Rows currently visible after the page's own filters. */
  filteredRows: T[];
  /** Every row before filtering — enables the "all records" scope. */
  allRows: T[];
  columns: CsvColumn<T>[];
  /** Used for the filename: sahaaya-<baseName>-<date>.csv */
  baseName: string;
  title: string;
  /** Human-readable summary of the page's active filters. */
  filterSummary?: string;
  exportedBy?: string;
}

export function ExportDialog<T>({
  open,
  onClose,
  filteredRows,
  allRows,
  columns,
  baseName,
  title,
  filterSummary,
  exportedBy,
}: ExportDialogProps<T>) {
  const groups = useMemo(() => {
    const seen: string[] = [];
    for (const c of columns) {
      const g = c.group ?? 'General';
      if (!seen.includes(g)) seen.push(g);
    }
    return seen;
  }, [columns]);

  const [scope, setScope] = useState<'filtered' | 'all'>('filtered');
  const [activeGroups, setActiveGroups] = useState<string[]>(groups);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [done, setDone] = useState<string | null>(null);

  const rows = scope === 'filtered' ? filteredRows : allRows;
  const selectedColumns = columns.filter((c) => activeGroups.includes(c.group ?? 'General'));

  const csv = useMemo(() => {
    if (selectedColumns.length === 0) return '';
    return toCsv(
      rows,
      selectedColumns,
      includeHeader
        ? {
            title,
            exportedBy,
            filters: scope === 'filtered' ? filterSummary || 'None' : 'None — full dataset',
            extra: { Scope: scope === 'filtered' ? 'Current view' : 'All records' },
          }
        : undefined,
    );
  }, [rows, selectedColumns, includeHeader, title, exportedBy, filterSummary, scope]);

  const toggleGroup = (group: string) => {
    setActiveGroups((current) =>
      current.includes(group) ? current.filter((g) => g !== group) : [...current, group],
    );
  };

  const handleExport = () => {
    const filename = downloadCsv(baseName, csv);
    setDone(filename);
    setTimeout(() => {
      setDone(null);
      onClose();
    }, 1800);
  };

  // First two data rows, for the preview strip.
  const previewRows = rows.slice(0, 2);

  return (
    <Modal isOpen={open} onClose={onClose} title="Export to CSV" description={title} size="lg">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-10 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-distress-green/15">
              <Check className="h-7 w-7 text-distress-green" />
            </div>
            <p className="font-heading text-heading-md font-semibold text-text-primary">Export complete</p>
            <p className="mt-1.5 font-mono text-body-sm text-text-secondary">{done}</p>
            <p className="mt-2 text-caption text-text-muted">
              {rows.length} records · {selectedColumns.length} columns
            </p>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Scope */}
            <div>
              <p className="mb-2.5 flex items-center gap-2 text-body-sm font-semibold text-text-primary">
                <Filter className="h-4 w-4 text-primary-500" /> Which records
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {([
                  { id: 'filtered', label: 'Current view', count: filteredRows.length, hint: filterSummary || 'No filters applied' },
                  { id: 'all', label: 'All records', count: allRows.length, hint: 'Ignores active filters' },
                ] as const).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setScope(option.id)}
                    className={cn(
                      'rounded-2xl border-2 p-4 text-left transition-all duration-200',
                      scope === option.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border bg-surface hover:border-primary-200',
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-body-sm font-semibold text-text-primary">{option.label}</span>
                      <span className="font-heading text-heading-md font-bold tabular-nums text-primary-600">
                        {option.count}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-caption text-text-muted">{option.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Columns */}
            <div>
              <p className="mb-2.5 flex items-center gap-2 text-body-sm font-semibold text-text-primary">
                <Layers className="h-4 w-4 text-primary-500" /> Column groups
              </p>
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => {
                  const active = activeGroups.includes(group);
                  const count = columns.filter((c) => (c.group ?? 'General') === group).length;
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-body-sm transition-all duration-200',
                        active
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-border bg-surface text-text-secondary hover:border-primary-200',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border',
                          active ? 'border-primary-500 bg-primary-500' : 'border-border',
                        )}
                      >
                        {active && <Check className="h-3 w-3 text-white" />}
                      </span>
                      {group}
                      <span className="text-caption text-text-muted">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Provenance toggle */}
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-secondary-50 p-4">
              <input
                type="checkbox"
                checked={includeHeader}
                onChange={(e) => setIncludeHeader(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
              />
              <span>
                <span className="flex items-center gap-2 text-body-sm font-medium text-text-primary">
                  <ShieldCheck className="h-4 w-4 text-primary-500" />
                  Include provenance header
                </span>
                <span className="mt-1 block text-caption text-text-secondary">
                  Records who exported the file, when, the active filters and the prototype-data
                  classification. Turn off for a plain machine-readable table.
                </span>
              </span>
            </label>

            {/* Preview */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-2 text-body-sm font-semibold text-text-primary">
                  <FileSpreadsheet className="h-4 w-4 text-primary-500" /> Preview
                </p>
                <span className="text-caption text-text-muted">
                  {rows.length} rows · {selectedColumns.length} cols · ~{estimateSize(csv)}
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border bg-surface">
                {selectedColumns.length === 0 ? (
                  <p className="p-4 text-center text-body-sm text-text-muted">Select at least one column group</p>
                ) : (
                  <table className="w-full text-caption">
                    <thead>
                      <tr className="border-b border-border bg-secondary-50">
                        {selectedColumns.slice(0, 6).map((c) => (
                          <th key={c.header} className="whitespace-nowrap px-3 py-2 text-left font-medium text-text-secondary">
                            {c.header}
                          </th>
                        ))}
                        {selectedColumns.length > 6 && (
                          <th className="px-3 py-2 text-left text-text-muted">+{selectedColumns.length - 6}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                          {selectedColumns.slice(0, 6).map((c) => (
                            <td key={c.header} className="max-w-[160px] truncate px-3 py-2 text-text-primary">
                              {String(c.value(row) ?? '—')}
                            </td>
                          ))}
                          {selectedColumns.length > 6 && <td className="px-3 py-2 text-text-muted">…</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button variant="ghost" onClick={onClose} leftIcon={<X className="h-4 w-4" />}>
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={selectedColumns.length === 0 || rows.length === 0}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Download CSV
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
