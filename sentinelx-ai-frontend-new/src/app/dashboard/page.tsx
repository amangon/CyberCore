"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import SecurityScoreCard from "@/components/dashboard/SecurityScoreCard";
import ThreatLevelCard from "@/components/dashboard/ThreatLevelCard";
import AssetOverviewCard from "@/components/dashboard/AssetOverviewCard";
import IncidentCard from "@/components/dashboard/IncidentCard";
import AIInsights from "@/components/dashboard/AIInsights";
import RecentAlerts from "@/components/dashboard/RecentAlerts";
import RecentScans from "@/components/dashboard/RecentScans";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Security Overview
          </h2>
          <p className="text-sm text-slate-400">
            Monitor your security posture, active threats and recent activity.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          <SecurityScoreCard />
          <ThreatLevelCard />
          <AssetOverviewCard />
          <IncidentCard />
        </div>

        <AIInsights />

        <div className="grid gap-5 xl:grid-cols-2">
          <RecentAlerts />
          <RecentScans />
        </div>
      </div>
    </DashboardLayout>
  );
}

