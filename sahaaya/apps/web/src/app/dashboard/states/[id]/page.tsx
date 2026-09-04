'use client';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { Building2, Users, AlertTriangle, TrendingUp, Download, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";
import type { StateDashboard } from "@/types";

const BANDS = ["Red", "Orange", "Yellow", "Green"] as const;
const BG_COLORS: Record<string, string> = {
  Red: "bg-red-500",
  Orange: "bg-orange-500",
  Yellow: "bg-yellow-500",
  Green: "bg-green-500",
};
const BADGE_COLORS: Record<string, string> = {
  Red: "badge-red",
  Orange: "badge-orange",
  Yellow: "badge-yellow",
  Green: "badge-green",
};

function getPct(district: { total_victims: number; band_distribution: Record<string, number> }, band: string) {
  return district.total_victims ? (district.band_distribution[band] / district.total_victims) * 100 : 0;
}

export default function StateDashboardPage() {
  const params = useParams();
  const stateId = params.id as string;
  const [data, setData] = useState<StateDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterBand, setFilterBand] = useState<"all" | "Green" | "Yellow" | "Orange" | "Red">("all");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await api.getStateDashboard(stateId);
        // The state endpoint returns counts but not the percentage the UI shows,
        // which rendered as a bare "%". Derive it here.
        const payload = res.data;
        setData({
          ...payload,
          high_risk_percentage: payload.high_risk_percentage ?? (
            payload.total_victims > 0
              ? Math.round((payload.high_risk_count / payload.total_victims) * 100)
              : 0
          ),
        });
      } catch (error) {
        console.error("Failed to load state dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [stateId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-2">
          <div className="h-8 w-48 bg-secondary-100 rounded" />
          <div className="h-4 w-96 bg-secondary-100 rounded" />
        </div>
        <div className="grid lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5">
              <div className="h-4 w-1/4 bg-secondary-100 rounded mb-4" />
              <div className="h-12 w-full bg-secondary-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-heading-lg font-semibold text-text-secondary mb-2">Unable to load state data</h2>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  // Apply filter
  const filteredDistricts = data?.districts.filter((d) => {
    if (filterBand === "all") return true;
    return d.band_distribution[filterBand] > 0;
  }) || [];

  return (
    <div className="space-y-6">
      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <div className="flex items-center gap-2 text-text-secondary mb-1">
            <Building2 className="w-4 h-4" />
            <span>State Dashboard</span>
          </div>
          <h1 className="text-display-sm font-heading font-bold text-text-primary">{stateId}</h1>
          <p className="text-body text-text-secondary mt-1">
            {data?.total_districts} districts • {data?.total_victims} victims • {data?.high_risk_count} high risk ({data?.high_risk_percentage}%)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" /> Export Report
          </button>
        </div>
      </motion.div>

      <motion.div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-text-secondary">Total Victims</p>
              <p className="text-3xl font-bold text-text-primary">{data?.total_victims}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-500" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-text-secondary">Districts</p>
              <p className="text-3xl font-bold text-text-primary">{data?.total_districts}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-500" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-text-secondary">High Risk</p>
              <p className="text-3xl font-bold text-orange-500">{data?.high_risk_count}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-text-secondary">High Risk %</p>
              <p className="text-3xl font-bold text-red-500">{data?.high_risk_percentage}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-text-secondary">Stable</p>
              <p className="text-3xl font-bold text-green-500">{data?.band_distribution.Green}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Districts Overview</h2>
            <p className="text-gray-500">Click a district to view detailed dashboard</p>
          </div>
          <select value={filterBand} onChange={(e) => setFilterBand(e.target.value as "all" | "Green" | "Yellow" | "Orange" | "Red")} className="input w-[180px]">
            <option value="all">All Bands</option>
            <option value="Red">Red (Urgent)</option>
            <option value="Orange">Orange (Significant)</option>
            <option value="Yellow">Yellow (Mild)</option>
            <option value="Green">Green (Stable)</option>
          </select>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDistricts.map((district) => (
            <div key={district.district} className="card p-5 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/dashboard/districts/" + district.district}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{district.district}</h3>
                  <p className="text-sm text-gray-500">{district.total_victims} victims</p>
                </div>
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              {/* The per-band breakdown below already carries these counts — the badge
                  row above it was the same numbers a second time. */}
              <div className="space-y-2">
                {BANDS.map((band) => {
                  const pct = getPct(district, band);
                  const bg = BG_COLORS[band];
                  return (
                    <div key={band} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bg }} />
                        <span className="font-medium text-gray-900">{band}</span>
                        <span className="badge badge-gray text-xs">{district.band_distribution[band]}</span>
                      </div>
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ backgroundColor: bg, width: pct + "%" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <a href={"/dashboard/districts/" + district.district} className="btn btn-ghost w-full">
                  <ArrowRight className="w-4 h-4 mr-2" /> View District Dashboard
                </a>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
