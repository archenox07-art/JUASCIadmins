"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        router.push("/access-denied");
        return;
      }

      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-stellar-gold tracking-widest">
            AstroSci
          </h1>
          <p className="text-text/50 text-[10px] sm:text-xs mt-2 font-mono-tech tracking-wider">
            ADMIN MISSION CONTROL
          </p>
        </div>

        <div className="bg-panel/80 backdrop-blur-md border border-border rounded-xl p-6 sm:p-8">
          <h2 className="font-heading text-lg sm:text-xl font-semibold text-text mb-6 tracking-wide">
            Sign In
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] sm:text-xs text-text/50 mb-1.5 font-mono-tech uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 sm:py-2.5 bg-card border border-border rounded-lg text-text text-sm focus:outline-none focus:border-stellar-gold transition-colors"
                placeholder="admin@astrosci.club"
              />
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs text-text/50 mb-1.5 font-mono-tech uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 sm:py-2.5 bg-card border border-border rounded-lg text-text text-sm focus:outline-none focus:border-stellar-gold transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-solar-flare text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-2.5 bg-stellar-gold text-background rounded-lg font-heading font-medium text-sm tracking-wide hover:bg-stellar-gold/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
