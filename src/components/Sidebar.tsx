"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/profiles", label: "Profiles", icon: "👤" },
  { href: "/gallery", label: "Gallery", icon: "🖼️" },
  { href: "/potw", label: "POTW", icon: "🌟" },
  { href: "/events", label: "Events", icon: "📅" },
  { href: "/magazines", label: "Magazines", icon: "📰" },
  { href: "/projects", label: "Projects", icon: "📁" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-panel border-r border-border flex flex-col z-50">
      <div className="p-6 border-b border-border">
        <h1 className="font-heading text-xl font-bold text-atmo-blue tracking-wide">
          AstroSci
        </h1>
        <p className="text-xs text-text/50 mt-1 font-mono-tech">ADMIN CONSOLE</p>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-orbit-blue/20 text-orbit-blue border border-orbit-blue/30"
                    : "text-text/70 hover:bg-card hover:text-text"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-text/30 font-mono-tech text-center">
          v1.0.0 — MISSION CONTROL
        </p>
      </div>
    </aside>
  );
}
