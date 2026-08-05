'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldAlert, Sparkles, Trash2, ScanLine } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useIOCStore } from '@/store';

type IOCType = 'IP' | 'Domain' | 'URL' | 'Hash';

const typeOptions: IOCType[] = ['IP', 'Domain', 'URL', 'Hash'];

const typeToApiType = (type: IOCType) =>
  ({
    IP: 'ip',
    Domain: 'domain',
    URL: 'url',
    Hash: 'hash',
  })[type] as 'ip' | 'domain' | 'url' | 'hash';

function inferType(value: string, fallback: IOCType): IOCType {
  const v = value.trim().toLowerCase();
  if (/^(?:[0-9a-f]{32}|[0-9a-f]{40}|[0-9a-f]{64})$/.test(v)) return 'Hash';
  if (v.startsWith('http://') || v.startsWith('https://')) return 'URL';
  if (/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(v)) return 'Domain';
  if (/^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(v)) return 'IP';
  return fallback;
}

export default function IOCSearch() {
  const [iocType, setIocType] = useState<IOCType>('IP');
  const [query, setQuery] = useState('');
  const [localError, setLocalError] = useState('');
  const { analyze, loading, error, clearError, reset, recentSearches, clearRecentSearches } = useIOCStore();

  const searching = loading;

  const placeholder = useMemo(
    () =>
      ({
        IP: 'Enter indicator to investigate',
        Domain: 'Enter indicator to investigate',
        URL: 'Enter indicator to investigate',
        Hash: 'Enter indicator to investigate',
      })[iocType],
    [iocType],
  );

  const handleAnalyze = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (localError) setLocalError('');
    try {
      await analyze(trimmed, typeToApiType(iocType));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to analyze this indicator.');
    }
  };

  const handleClear = () => {
    setQuery('');
    setLocalError('');
    clearError();
    reset();
  };

  const displayError = localError || error;

  return (
    <Card className="border-white/10 bg-slate-950/70 text-slate-100 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10">
        <CardTitle className="text-2xl font-semibold tracking-tight text-white">
          IOC Search Engine
        </CardTitle>
        <CardDescription className="mt-2 text-sm text-slate-300">
          Investigate suspicious indicators using global threat intelligence sources.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setIocType(type)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                iocType === type
                  ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
              <ScanLine className="h-4 w-4 text-cyan-300" />
              Search parameters
            </div>
            <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
              Live threat intelligence
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-[140px_1fr_auto]">
            <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
              <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">IOC Type</p>
              <p className="text-sm font-medium text-white">{iocType}</p>
            </div>

            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (displayError) {
                  setLocalError('');
                  clearError();
                }
              }}
              placeholder={placeholder}
              className="h-12 border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500 focus-visible:ring-cyan-400/40"
            />

            <Button
              onClick={() => void handleAnalyze()}
              disabled={searching || !query.trim()}
              className="h-12 bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            >
              <Search className="mr-2 h-4 w-4" />
              Analyze Indicator
            </Button>
          </div>

          {displayError ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{displayError}</span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-violet-500/30 bg-violet-500/10 text-violet-200">
              Threat Intel
            </Badge>
            <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-200">AI Analysis</Badge>
            <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200">Global Lookup</Badge>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {searching ? (
            <motion.div
              key="searching"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="overflow-hidden rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="rounded-full border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-300"
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
                <div>
                  <p className="font-medium text-white">Threat Intelligence Lookup Running</p>
                  <p className="text-sm text-slate-300">AI analysis in progress...</p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400"
                  initial={{ x: '-35%' }}
                  animate={{ x: '105%' }}
                  transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: '35%' }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <ShieldAlert className="h-4 w-4 text-cyan-300" />
                  Ready for IOC analysis
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear search
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Recent Searches
            </h3>
            {recentSearches.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => clearRecentSearches()}
                className="text-slate-400 hover:text-white"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Clear all
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {recentSearches.length === 0 ? (
              <p className="text-sm text-slate-500">
                No recent searches yet. Run an analysis to see it here.
              </p>
            ) : (
              recentSearches.map((item) => {
                const displayType = item.type.toUpperCase();
                return (
                  <motion.button
                    key={`${item.indicator}-${item.type}`}
                    type="button"
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setQuery(item.indicator);
                      setIocType(inferType(item.indicator, item.type.toUpperCase() as IOCType));
                      setLocalError('');
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                  >
                    <span className="mr-2 text-cyan-300">{item.indicator}</span>
                    <Badge className="border border-violet-500/30 bg-violet-500/10 text-violet-200">
                      {displayType}
                    </Badge>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

