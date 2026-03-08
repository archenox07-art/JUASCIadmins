"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";

export default function Header() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="h-14 sm:h-16 bg-panel/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 pl-14 sm:pl-16 lg:px-6">
      <div>
        <h2 className="font-heading text-[10px] sm:text-xs font-semibold text-text/50 uppercase tracking-[0.2em]">
          Mission Control
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {profile?.profile_image ? (
            <img
              src={profile.profile_image}
              alt="Admin"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stellar-gold/15 flex items-center justify-center text-xs text-stellar-gold font-bold">
              {profile?.name?.charAt(0) || "A"}
            </div>
          )}
          <span className="text-xs sm:text-sm text-text font-medium hidden sm:inline">
            {profile?.name || "Admin"}
          </span>
        </div>

        <button
          onClick={handleSignOut}
          className="px-3 py-1.5 sm:py-1.5 text-xs bg-card border border-border rounded-md text-text/70 hover:text-solar-flare hover:border-solar-flare/30 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
