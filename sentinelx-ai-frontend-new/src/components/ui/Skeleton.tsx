'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'avatar' | 'table';
}

const variantClasses: Record<NonNullable<SkeletonProps['variant']>, string> = {
  text: 'h-4 w-full rounded-md',
  card: 'h-32 w-full rounded-2xl',
  circle: 'h-12 w-12 rounded-full',
  avatar: 'h-10 w-10 rounded-full',
  table: 'h-12 w-full rounded-xl',
};

export default function Skeleton({
  className = '',
  variant = 'text',
}: SkeletonProps) {
  return (
    <div className={['relative overflow-hidden bg-slate-800/70', variantClasses[variant], className].join(' ')}>
      <motion.div
        aria-hidden="true"
        initial={{ x: '-120%' }}
        animate={{ x: '120%' }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-60" />
    </div>
  );
}