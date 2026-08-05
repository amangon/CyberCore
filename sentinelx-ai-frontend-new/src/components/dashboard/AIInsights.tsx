'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, ShieldAlert, Zap, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getDashboard } from '@/services/dashboard.service';
import { getApiErrorMessage } from '@/lib/api';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

function riskColor(risk: string): string {
  switch (risk.toLowerCase()) {
    case 'critical':
      return 'text-red-400';
    case 'high':
      return 'text-orange-400';
    case 'medium':
      return 'text-amber-400';
    default:
      return 'text-emerald-400';
  }
}

function riskBadgeTone(risk: string): string {
  switch (risk.toLowerCase()) {
    case 'critical':
      return 'border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/15';
    case 'high':
      return 'border-orange-400/20 bg-orange-400/10 text-orange-200 hover:bg-orange-400/15';
    case 'medium':
      return 'border-amber-400/20 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15';
    default:
      return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15';
  }
}

export default function AIInsights(): React.JSX.Element {
  const [predictedRisk, setPredictedRisk] = useState<RiskLevel>('LOW');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [newThreats, setNewThreats] = useState<number | null>(null);
  const [potentialImpact, setPotentialImpact] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<readonly string[]>([]);
  const [modelStatus, setModelStatus] = useState<string>('online');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInsights, setHasInsights] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await getDashboard();
      const ai = dashboard.aiInsights;
      const hasAi = Boolean(ai) && Object.keys(ai ?? {}).length > 0;

      if (!hasAi) {
        setHasInsights(false);
        setRecommendations([]);
        setSummary(null);
        setConfidence(null);
        setNewThreats(null);
        setPotentialImpact(null);
        setModelStatus('online');
      } else {
        setHasInsights(true);
        setPredictedRisk((ai ? ai.predictedRisk : 'low').toUpperCase() as RiskLevel);
        setConfidence(ai?.confidence ?? null);
        setNewThreats(ai?.newThreatsDetected ?? null);
        setPotentialImpact(ai?.potentialImpact ?? null);
        setSummary(ai?.summary ?? null);
        setRecommendations(ai?.recommendations ?? []);
        setModelStatus(ai?.modelStatus ?? 'online');
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const displayRecommendations =
    recommendations.length > 0
      ? recommendations
      : summary
        ? [summary]
        : [];

  return (
    <Card className="relative overflow-hidden border-white/10 bg-slate-950/80 text-slate-100 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))]" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium tracking-wide text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              AI Security Insights
            </div>
            <h3 className="text-2xl font-semibold tracking-tight">AI Security Insights</h3>
            <p className="mt-1 text-sm text-slate-400">AI-powered threat analysis and recommendations</p>
          </div>

          {loading ? (
            <Badge className="animate-pulse border-slate-500/20 bg-slate-500/10 text-slate-300 hover:bg-slate-500/10">
              Analyzing…
            </Badge>
          ) : error ? (
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200 transition hover:bg-cyan-400/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          ) : (
            <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/15">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {modelStatus === 'online' ? 'Live Model' : 'Model'}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="grid animate-pulse gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 h-4 w-32 rounded bg-slate-800" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="h-20 rounded-2xl bg-slate-800/60" />
                  <div className="h-20 rounded-2xl bg-slate-800/60" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center">
            <RefreshCw className="h-8 w-8 text-slate-600" />
            <p className="max-w-[320px] text-sm text-slate-400">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20"
            >
              Retry
            </button>
          </div>
        ) : !hasInsights ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center">
            <Brain className="h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-400">No AI insights available.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-cyan-400/20 hover:bg-white/7"
            >
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-200">
                <Brain className="h-4 w-4 text-cyan-300" />
                Risk Prediction
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Predicted Risk</div>
                  <div className={`mt-2 text-3xl font-semibold ${riskColor(predictedRisk)}`}>
                    {predictedRisk}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Confidence</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-100">
                    {confidence !== null ? `${confidence}%` : '—'}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-cyan-400/20 hover:bg-white/7"
            >
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-200">
                <ShieldAlert className="h-4 w-4 text-cyan-300" />
                AI Recommendations
              </div>

              {displayRecommendations.length > 0 ? (
                <motion.ul
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.08 } },
                  }}
                  className="space-y-3"
                >
                  {displayRecommendations.map((item) => (
                    <motion.li
                      key={item}
                      variants={{
                        hidden: { opacity: 0, x: -8 },
                        show: { opacity: 1, x: 0 },
                      }}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3 text-sm text-slate-200"
                    >
                      <span className="mt-0.5 text-emerald-400">✓</span>
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-6 text-center text-sm text-slate-500">
                  No recommendations available.
                </div>
              )}
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-cyan-400/20 hover:bg-white/7"
            >
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-200">
                <Zap className="h-4 w-4 text-cyan-300" />
                Threat Summary
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">New threats detected</div>
                  <div className="mt-2 text-3xl font-semibold text-rose-400">
                    {newThreats !== null ? newThreats : '—'}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Potential impact</div>
                  <div className="mt-2">
                    {potentialImpact ? (
                      <Badge className={`border ${riskBadgeTone(potentialImpact)}`}>
                        {potentialImpact}
                      </Badge>
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </div>
                </div>
              </div>

              {summary ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-300">
                  {summary}
                </div>
              ) : null}
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-cyan-400/20 hover:bg-white/7"
            >
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-200">
                <Brain className="h-4 w-4 text-cyan-300" />
                AI Model Status
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Sentinel AI Engine</div>
                    <div className={`mt-2 text-2xl font-semibold ${modelStatus === 'online' ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {modelStatus.toUpperCase()}
                    </div>
                  </div>

                  <motion.div
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Badge className={modelStatus === 'online' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15' : 'border-amber-400/20 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15'}>
                      {modelStatus === 'online' ? 'Active' : modelStatus}
                    </Badge>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </Card>
  );
}

