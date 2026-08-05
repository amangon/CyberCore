'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="relative flex min-h-full items-end justify-center p-4 sm:items-center sm:p-6">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
              aria-describedby={description ? 'modal-description' : undefined}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={[
                'w-full rounded-2xl border border-slate-800 bg-[#0F172A]/95 shadow-2xl shadow-black/50 backdrop-blur-xl',
                'overflow-hidden',
                sizeClasses[size],
              ].join(' ')}
              onClick={(e) => e.stopPropagation()}
            >
              {(title || description) && (
                <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
                  <div className="min-w-0">
                    {title ? (
                      <h2 id="modal-title" className="text-base font-semibold text-slate-100">
                        {title}
                      </h2>
                    ) : null}
                    {description ? (
                      <p id="modal-description" className="mt-1 text-sm text-slate-400">
                        {description}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-100"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {!(title || description) && (
                <div className="flex justify-end px-5 pt-5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-100"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="px-5 py-5">{children}</div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}