"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { SkeletonRow } from "@/components/Skeleton";
import { extractStoragePath } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const PLANS = ["free", "monthly", "annual"];
const ROLES = ["member", "admin"];

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      console.error("Failed to fetch profiles:", fetchError);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const updatePlan = async (userId: string, plan: string) => {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ plan })
      .eq("id", userId);

    if (updateError) {
      setError(`Failed to update plan: ${updateError.message}`);
      console.error("Plan update error:", updateError);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, plan } : p))
      );
    }
  };

  const updateRole = async (userId: string, role: string) => {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (updateError) {
      setError(`Failed to update role: ${updateError.message}`);
      console.error("Role update error:", updateError);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role } : p))
      );
    }
  };

  const deleteProfileImage = async (userId: string, imageUrl: string | null) => {
    if (!imageUrl) return;

    const filePath = extractStoragePath(imageUrl, "profiles");
    if (filePath) {
      await supabase.storage.from("profiles").remove([filePath]);
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ profile_image: null })
      .eq("id", userId);

    if (updateError) {
      setError(`Failed to delete profile image: ${updateError.message}`);
      console.error("Delete profile image error:", updateError);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, profile_image: null } : p))
      );
    }
  };

  const deleteAccount = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this account? This cannot be undone.")) return;

    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      setError(`Failed to delete account: ${deleteError.message}`);
      console.error("Delete account error:", deleteError);
    } else {
      setProfiles((prev) => prev.filter((p) => p.id !== userId));
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text tracking-wide">Profiles</h1>
        <p className="text-text/50 text-xs sm:text-sm mt-1">Manage member accounts and plans</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-solar-flare/10 border border-solar-flare/30 rounded-lg text-solar-flare text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <div className="bg-panel/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 sm:p-4 text-text/50 font-mono-tech text-[10px] sm:text-xs uppercase tracking-wider">Image</th>
                <th className="text-left p-3 sm:p-4 text-text/50 font-mono-tech text-[10px] sm:text-xs uppercase tracking-wider">Name</th>
                <th className="text-left p-3 sm:p-4 text-text/50 font-mono-tech text-[10px] sm:text-xs uppercase tracking-wider hidden md:table-cell">Department</th>
                <th className="text-left p-3 sm:p-4 text-text/50 font-mono-tech text-[10px] sm:text-xs uppercase tracking-wider hidden lg:table-cell">Year</th>
                <th className="text-left p-3 sm:p-4 text-text/50 font-mono-tech text-[10px] sm:text-xs uppercase tracking-wider">Plan</th>
                <th className="text-left p-3 sm:p-4 text-text/50 font-mono-tech text-[10px] sm:text-xs uppercase tracking-wider hidden sm:table-cell">Role</th>
                <th className="text-left p-3 sm:p-4 text-text/50 font-mono-tech text-[10px] sm:text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="p-0">
                        <SkeletonRow />
                      </td>
                    </tr>
                  ))
                : profiles.map((profile) => (
                    <tr key={profile.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                      <td className="p-3 sm:p-4">
                        {profile.profile_image ? (
                          <img
                            src={profile.profile_image}
                            alt={profile.name || "User"}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card border border-border flex items-center justify-center text-xs text-text/50">
                            {profile.name?.charAt(0) || "?"}
                          </div>
                        )}
                      </td>
                      <td className="p-3 sm:p-4 text-text font-medium text-xs sm:text-sm">{profile.name || "—"}</td>
                      <td className="p-3 sm:p-4 text-text/70 text-xs sm:text-sm hidden md:table-cell">{profile.department || "—"}</td>
                      <td className="p-3 sm:p-4 text-text/70 font-mono-tech text-xs hidden lg:table-cell">{profile.year || "—"}</td>
                      <td className="p-3 sm:p-4">
                        <select
                          value={profile.plan || "free"}
                          onChange={(e) => updatePlan(profile.id, e.target.value)}
                          className="bg-card border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-stellar-gold"
                        >
                          {PLANS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 sm:p-4 hidden sm:table-cell">
                        <select
                          value={profile.role || "member"}
                          onChange={(e) => updateRole(profile.id, e.target.value)}
                          className="bg-card border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-stellar-gold"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex gap-1 sm:gap-2 flex-wrap">
                          <button
                            onClick={() => deleteProfileImage(profile.id, profile.profile_image)}
                            disabled={!profile.profile_image}
                            className="px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs bg-card border border-border rounded text-text/50 hover:text-stellar-gold hover:border-stellar-gold/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete profile image"
                          >
                            🗑️ <span className="hidden sm:inline">Image</span>
                          </button>
                          <button
                            onClick={() => deleteAccount(profile.id)}
                            className="px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs bg-card border border-border rounded text-text/50 hover:text-solar-flare hover:border-solar-flare/30 transition-colors"
                            title="Delete account"
                          >
                            ✕ <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
