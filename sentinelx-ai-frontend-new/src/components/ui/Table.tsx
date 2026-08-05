'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Skeleton from '@/components/ui/Skeleton';

// Compound table components (named exports) used by feature modules.
interface TableSectionProps {
  children: React.ReactNode;
  className?: string;
}

function TableHeader({ children, className = '' }: TableSectionProps) {
  return <thead className={className}>{children}</thead>;
}

function TableBody({ children, className = '' }: TableSectionProps) {
  return <tbody className={className}>{children}</tbody>;
}

function TableHead({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <th className={className}>{children}</th>;
}

function TableCell({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <td className={className}>{children}</td>;
}

function TableRow({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <tr className={className}>{children}</tr>;
}

function Table({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <table className={className}>{children}</table>;
}

interface TableProps {
  columns: {
    key: string;
    label: string;
  }[];
  data: Record<string, any>[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
}: TableProps) {
  if (loading) {
    return (
      <div
        className={[
          'overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-xl',
          className,
        ].join(' ')}
      >
        <div className="min-w-full overflow-x-auto">
          <div className="space-y-3 p-4">
            <Skeleton variant="text" className="h-8 w-1/3" />
            <Skeleton variant="table" />
            <Skeleton variant="table" />
            <Skeleton variant="table" />
            <Skeleton variant="table" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        'overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-xl',
        className,
      ].join(' ')}
    >
      <div className="min-w-full overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-slate-950/90">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border-b border-slate-800 px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center text-sm text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <motion.tr
                  key={row.id ?? rowIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: rowIndex * 0.02 }}
                  className="border-b border-slate-800/60 last:border-b-0 hover:bg-slate-900/50"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="whitespace-nowrap px-5 py-4 text-sm text-slate-200"
                    >
                      {row[column.key] ?? '—'}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { Table, TableHeader, TableBody, TableHead, TableCell, TableRow };
