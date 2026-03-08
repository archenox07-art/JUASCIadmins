"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { SkeletonCard } from "@/components/Skeleton";

interface Stats {
  members: number;
  gallery: number;
  potw: number;
  events: number;
  magazines: number;
  projects: number;
}

const colorMap: Record<string, string> = {
  "stellar-gold": "text-stellar-gold",
  "nebula-violet": "text-nebula-violet",
  "solar-flare": "text-solar-flare",
};

const statCards = [
  { key: "members", label: "Total Members", icon: "👤", color: "stellar-gold" },
  { key: "gallery", label: "Gallery Images", icon: "🖼️", color: "nebula-violet" },
  { key: "potw", label: "POTW Entries", icon: "🌟", color: "solar-flare" },
  { key: "events", label: "Total Events", icon: "📅", color: "stellar-gold" },
  { key: "magazines", label: "Magazines", icon: "📰", color: "nebula-violet" },
  { key: "projects", label: "Projects", icon: "📁", color: "solar-flare" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [members, gallery, potw, events, magazines, projects] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("gallery").select("id", { count: "exact", head: true }),
        supabase.from("potw").select("id", { count: "exact", head: true }),
        supabase.from("club_events").select("id", { count: "exact", head: true }),
        supabase.from("magazines").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        members: members.count ?? 0,
        gallery: gallery.count ?? 0,
        potw: potw.count ?? 0,
        events: events.count ?? 0,
        magazines: magazines.count ?? 0,
        projects: projects.count ?? 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text tracking-wide">Dashboard</h1>
        <p className="text-text/50 text-xs sm:text-sm mt-1">System overview and statistics</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card, index) => (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6 hover:border-border/80 transition-colors"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-xl sm:text-2xl">{card.icon}</span>
                  <span className={`text-[10px] sm:text-xs font-mono-tech ${colorMap[card.color]}`}>
                    LIVE
                  </span>
                </div>
                <p className="font-mono-tech text-2xl sm:text-3xl font-bold text-text">
                  {stats?.[card.key as keyof Stats] ?? 0}
                </p>
                <p className="text-[10px] sm:text-xs text-text/50 mt-1">{card.label}</p>
              </motion.div>
            ))}
      </div>
    </AdminLayout>
  );
}
