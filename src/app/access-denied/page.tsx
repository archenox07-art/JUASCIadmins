"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-solar-flare mb-2 tracking-wide">
          Access Denied
        </h1>
        <p className="text-text/50 mb-8 max-w-md text-sm sm:text-base">
          Your account does not have admin privileges. Contact an administrator
          if you believe this is an error.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 sm:py-2.5 bg-stellar-gold text-background rounded-lg text-sm font-heading font-medium tracking-wide hover:bg-stellar-gold/90 transition-colors"
        >
          Back to Login
        </Link>
      </motion.div>
    </div>
  );
}
