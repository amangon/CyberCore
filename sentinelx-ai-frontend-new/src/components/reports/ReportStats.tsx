import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Zap,
  Crown,
  ShieldAlert,
  AlertTriangle,
  Activity,
  ShieldCheck,
  ClipboardCheck,
  Server,
  type LucideIcon,
} from "lucide-react";
import { ReportCard } from "./ReportCard";

interface ReportStatsData {
  totalReports: number;
  generatedToday: number;
  executiveReports: number;
  threatReports: number;
  incidentReports: number;
  riskScore: number;
  securityScore: number;
  complianceScore: number;
  assetsCovered: number;
}

interface ReportStatsProps {
  data?: ReportStatsData;
  loading?: boolean;
}

const defaultData: ReportStatsData = {
  totalReports: 24819,
  generatedToday: 143,
  executiveReports: 2047,
  threatReports: 8362,
  incidentReports: 1594,
  riskScore: 72,
  securityScore: 91,
  complianceScore: 88,
  assetsCovered: 13740,
};

interface KpiDefinition {
  key: keyof ReportStatsData;
  title: string;
  description: string;
  icon: LucideIcon;
  color: "blue" | "purple" | "cyan" | "emerald" | "rose";
  trend: number;
  trendDirection: "up" | "down" | "neutral";
  suffix?: string;
}

const kpiDefinitions: KpiDefinition[] = [
  {
    key: "totalReports",
    title: "Total Reports",
    description: "All-time reports generated across the platform",
    icon: FileText,
    color: "blue",
    trend: 12.4,
    trendDirection: "up",
  },
  {
    key: "generatedToday",
    title: "Generated Today",
    description: "Reports created in the last 24 hours",
    icon: Zap,
    color: "cyan",
    trend: 8.7,
    trendDirection: "up",
  },
  {
    key: "executiveReports",
    title: "Executive Reports",
    description: "C-suite and board-level summaries",
    icon: Crown,
    color: "purple",
    trend: 3.2,
    trendDirection: "up",
  },
  {
    key: "threatReports",
    title: "Threat Reports",
    description: "Active and historical threat intelligence",
    icon: ShieldAlert,
    color: "rose",
    trend: -5.1,
    trendDirection: "down",
  },
  {
    key: "incidentReports",
    title: "Incident Reports",
    description: "Security incidents logged and tracked",
    icon: AlertTriangle,
    color: "rose",
    trend: -11.3,
    trendDirection: "down",
  },
  {
    key: "riskScore",
    title: "Risk Score",
    description: "Aggregated enterprise risk exposure index",
    icon: Activity,
    color: "purple",
    trend: -4.6,
    trendDirection: "down",
  },
  {
    key: "securityScore",
    title: "Security Score",
    description: "Overall posture across all security domains",
    icon: ShieldCheck,
    color: "emerald",
    trend: 6.8,
    trendDirection: "up",
  },
  {
    key: "complianceScore",
    title: "Compliance Score",
    description: "Regulatory and framework adherence rating",
    icon: ClipboardCheck,
    color: "emerald",
    trend: 2.1,
    trendDirection: "up",
  },
  {
    key: "assetsCovered",
    title: "Assets Covered",
    description: "Monitored endpoints, services, and resources",
    icon: Server,
    color: "blue",
    trend: 9.5,
    trendDirection: "up",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

function SectionHeader({ loading }: { loading: boolean }) {
  return (
    <div className="mb-6 flex flex-col gap-1 sm:mb-8">
      {loading ? (
        <>
          <div className="h-6 w-48 animate-pulse rounded-lg bg-white/5" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-white/5" />
        </>
      ) : (
        <AnimatePresence>
          <motion.div
            key="header"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                Report Intelligence
              </h2>
              {/* Live pulse indicator */}
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-emerald-400">Live</span>
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Real-time KPI metrics across all report categories — SentinelX AI platform
            </p>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function GridDivider() {
  return (
    <div className="col-span-full my-1 h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
  );
}

export function ReportStats({ data = defaultData, loading = false }: ReportStatsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Split into visual groups: report counts (5), scores (3), assets (1)
  const reportGroup = kpiDefinitions.slice(0, 5);
  const scoreGroup = kpiDefinitions.slice(5, 8);
  const assetGroup = kpiDefinitions.slice(8, 9);

  return (
    <section
      className="w-full"
      aria-label="Report KPI statistics"
      aria-live="polite"
      aria-busy={loading}
    >
      <SectionHeader loading={loading} />

      {isMounted && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:gap-5"
        >
          {/* Group 1 — Report counts */}
          {reportGroup.map((kpi) => (
            <motion.div key={kpi.key} variants={itemVariants}>
              <ReportCard
                title={kpi.title}
                value={loading ? 0 : data[kpi.key]}
                description={kpi.description}
                icon={kpi.icon}
                trend={kpi.trend}
                trendDirection={kpi.trendDirection}
                color={kpi.color}
                loading={loading}
              />
            </motion.div>
          ))}

          {/* Visual divider between groups */}
          <GridDivider />

          {/* Group 2 — Score metrics */}
          {scoreGroup.map((kpi) => (
            <motion.div key={kpi.key} variants={itemVariants}>
              <ReportCard
                title={kpi.title}
                value={loading ? 0 : data[kpi.key]}
                description={kpi.description}
                icon={kpi.icon}
                trend={kpi.trend}
                trendDirection={kpi.trendDirection}
                color={kpi.color}
                loading={loading}
              />
            </motion.div>
          ))}

          {/* Group 3 — Assets */}
          {assetGroup.map((kpi) => (
            <motion.div key={kpi.key} variants={itemVariants}>
              <ReportCard
                title={kpi.title}
                value={loading ? 0 : data[kpi.key]}
                description={kpi.description}
                icon={kpi.icon}
                trend={kpi.trend}
                trendDirection={kpi.trendDirection}
                color={kpi.color}
                loading={loading}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Footer meta row */}
      {!loading && isMounted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4 text-xs text-slate-600"
        >
          <span>
            Last updated:{" "}
            <time dateTime="2026-08-01T10:28:33Z" className="text-slate-500">
              Aug 1, 2026 — 10:28 UTC
            </time>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
            SentinelX AI · Enterprise Edition
          </span>
        </motion.div>
      )}
    </section>
  );
}

export default ReportStats;