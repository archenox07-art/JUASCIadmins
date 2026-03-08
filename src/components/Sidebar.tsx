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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-60 bg-panel/95 backdrop-blur-md border-r border-border flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-5 sm:p-6 border-b border-border">
          <h1 className="font-heading text-lg sm:text-xl font-bold text-stellar-gold tracking-widest">
            AstroSci
          </h1>
          <p className="text-[10px] sm:text-xs text-text/50 mt-1 font-mono-tech tracking-wider">
            ADMIN CONSOLE
          </p>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-stellar-gold/15 text-stellar-gold border border-stellar-gold/25"
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
          <p className="text-[10px] text-text/30 font-mono-tech text-center tracking-wider">
            v1.0.0 — MISSION CONTROL
          </p>
        </div>
      </aside>
    </>
  );
}
