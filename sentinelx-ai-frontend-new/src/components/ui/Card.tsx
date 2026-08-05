'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({
  children,
  title,
  description,
  icon,
  className = '',
  hover = true,
}: CardProps) {
  const hasHeader = Boolean(title);

  return (
    <motion.section
      initial={false}
      whileHover={
        hover
          ? {
              y: -2,
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.45)',
              borderColor: 'rgba(56, 189, 248, 0.25)',
            }
          : undefined
      }
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={[
        'relative rounded-2xl border border-slate-800 bg-[#0F172A] backdrop-blur-xl',
        'shadow-lg shadow-black/20 transition-colors',
        className,
      ].join(' ')}
    >
      {hasHeader && (
        <div className="flex items-start gap-3 border-b border-slate-800/70 px-5 py-4">
          {icon ? (
            <div className="mt-0.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-sky-400">
              {icon}
            </div>
          ) : null}

          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-wide text-slate-100">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            ) : null}
          </div>
        </div>
      )}

      <div className={hasHeader ? 'p-5' : 'p-5'}>{children}</div>
    </motion.section>
  );
}

export { Card };

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`relative space-y-2 ${className}`}>{children}</div>;
}

function CardTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-xl font-semibold text-white ${className}`}>
      {children}
    </h3>
  );
}

function CardDescription({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={`text-sm text-slate-400 ${className}`}>{children}</p>;
}

function CardContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`relative ${className}`}>{children}</div>;
}

export {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
};
