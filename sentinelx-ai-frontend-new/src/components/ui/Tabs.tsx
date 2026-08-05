'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TabsProps {
  tabs: {
    id: string;
    label: string;
    icon?: React.ReactNode;
  }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-1 backdrop-blur-xl">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={[
                'relative inline-flex h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-medium',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/40',
                active ? 'text-slate-50' : 'text-slate-400 hover:text-slate-200',
              ].join(' ')}
            >
              {active ? (
                <motion.div
                  layoutId="sentinelx-active-tab"
                  className="absolute inset-0 rounded-lg bg-cyan-500/10 border border-cyan-400/20"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              ) : null}

              <span className="relative z-10 inline-flex items-center gap-2">
                {tab.icon ? <span className="shrink-0">{tab.icon}</span> : null}
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}