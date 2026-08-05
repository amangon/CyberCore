'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">
      <Sidebar />

      <div className="min-h-screen md:pl-64">
        <Topbar />

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative min-h-screen pt-16 md:pt-20"
        >
          <div className="h-[calc(100vh-4rem)] overflow-y-auto md:h-[calc(100vh-5rem)]">
            <div className="min-h-full rounded-none border border-white/10 bg-slate-950/40 backdrop-blur-xl md:rounded-tl-3xl md:border-l md:border-t shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="p-4 sm:p-6 lg:p-8"
              >
                {children}
              </motion.div>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}