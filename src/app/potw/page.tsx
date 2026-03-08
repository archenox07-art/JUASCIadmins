"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { SkeletonImage } from "@/components/Skeleton";
import { extractStoragePath } from "@/lib/utils";
import type { POTW } from "@/lib/types";

export default function POTWPage() {
  const [entries, setEntries] = useState<POTW[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [photographer, setPhotographer] = useState("");
  const [description, setDescription] = useState("");
  const [weekDate, setWeekDate] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editPhotographer, setEditPhotographer] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWeekDate, setEditWeekDate] = useState("");

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("potw")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      console.error("Failed to fetch POTW:", fetchError);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");

    const fileExt = file.name.split(".").pop();
    const filePath = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Step 1: Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from("potw")
      .upload(filePath, file);

    if (uploadError) {
      setError(`File upload failed: ${uploadError.message}`);
      console.error("Upload error:", uploadError);
      setUploading(false);
      return;
    }

    // Step 2: Get public URL
    const { data: urlData } = supabase.storage
      .from("potw")
      .getPublicUrl(filePath);

    // Step 3: Insert database record
    const { error: insertError } = await supabase.from("potw").insert({
      image_url: urlData.publicUrl,
      title,
      photographer,
      description,
      week_date: weekDate || null,
    });

    if (insertError) {
      setError(`Upload succeeded but database insert failed: ${insertError.message}`);
      console.error("Insert error:", insertError);
    } else {
      setTitle("");
      setPhotographer("");
      setDescription("");
      setWeekDate("");
      setFile(null);
      fetchEntries();
    }
    setUploading(false);
  };

  const handleDelete = async (entry: POTW) => {
    if (!confirm("Delete this POTW entry?")) return;

    const filePath = extractStoragePath(entry.image_url, "potw");
    if (filePath) {
      await supabase.storage.from("potw").remove([filePath]);
    }

    const { error: deleteError } = await supabase
      .from("potw")
      .delete()
      .eq("id", entry.id);

    if (deleteError) {
      setError(`Failed to delete: ${deleteError.message}`);
      console.error("Delete error:", deleteError);
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }
  };

  const handleEdit = async (id: string) => {
    const { error: updateError } = await supabase
      .from("potw")
      .update({
        title: editTitle,
        photographer: editPhotographer,
        description: editDescription,
        week_date: editWeekDate || null,
      })
      .eq("id", id);

    if (updateError) {
      setError(`Failed to update: ${updateError.message}`);
      console.error("Update error:", updateError);
    } else {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, title: editTitle, photographer: editPhotographer, description: editDescription, week_date: editWeekDate }
            : e
        )
      );
      setEditingId(null);
    }
  };

  const startEdit = (entry: POTW) => {
    setEditingId(entry.id);
    setEditTitle(entry.title || "");
    setEditPhotographer(entry.photographer || "");
    setEditDescription(entry.description || "");
    setEditWeekDate(entry.week_date || "");
  };

  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text tracking-wide">Picture of the Week</h1>
        <p className="text-text/50 text-xs sm:text-sm mt-1">Manage POTW entries</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-solar-flare/10 border border-solar-flare/30 rounded-lg text-solar-flare text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-panel/80 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="font-heading text-base sm:text-lg font-semibold text-text mb-4 tracking-wide">Add POTW Entry</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              className="bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-stellar-gold file:text-background file:font-medium"
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-stellar-gold transition-colors"
            />
            <input
              type="text"
              value={photographer}
              onChange={(e) => setPhotographer(e.target.value)}
              placeholder="Photographer"
              className="bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-stellar-gold transition-colors"
            />
            <input
              type="date"
              value={weekDate}
              onChange={(e) => setWeekDate(e.target.value)}
              className="bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text focus:outline-none focus:border-stellar-gold transition-colors"
            />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-stellar-gold resize-none transition-colors"
          />
          <button
            type="submit"
            disabled={uploading || !file}
            className="px-5 sm:px-6 py-3 sm:py-2.5 bg-stellar-gold text-background rounded-lg text-sm font-heading font-medium tracking-wide hover:bg-stellar-gold/90 transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Add Entry"}
          </button>
        </form>
      </div>

      {/* Entries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonImage key={i} />)
          : entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden"
              >
                <div className="aspect-video relative">
                  <img
                    src={entry.image_url}
                    alt={entry.title || "POTW"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  {editingId === entry.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-stellar-gold"
                      />
                      <input
                        type="text"
                        value={editPhotographer}
                        onChange={(e) => setEditPhotographer(e.target.value)}
                        placeholder="Photographer"
                        className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-stellar-gold"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                        rows={2}
                        className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-stellar-gold resize-none"
                      />
                      <input
                        type="date"
                        value={editWeekDate}
                        onChange={(e) => setEditWeekDate(e.target.value)}
                        className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-stellar-gold"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(entry.id)}
                          className="text-xs text-solar-flare hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-text/50 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-heading font-semibold text-text text-sm sm:text-base tracking-wide">{entry.title || "Untitled"}</h3>
                      <p className="text-xs text-nebula-violet mt-1">{entry.photographer || "Unknown"}</p>
                      <p className="text-xs text-text/50 mt-1 line-clamp-2">{entry.description || ""}</p>
                      {entry.week_date && (
                        <p className="text-xs font-mono-tech text-text/30 mt-2">{entry.week_date}</p>
                      )}
                    </>
                  )}
                  {editingId !== entry.id && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => startEdit(entry)}
                        className="px-3 py-1.5 text-xs bg-background border border-border rounded text-text/50 hover:text-nebula-violet hover:border-nebula-violet/30 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry)}
                        className="px-3 py-1.5 text-xs bg-background border border-border rounded text-text/50 hover:text-solar-flare hover:border-solar-flare/30 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
      </div>
    </AdminLayout>
  );
}
