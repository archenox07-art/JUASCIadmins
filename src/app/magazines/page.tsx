"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { SkeletonImage } from "@/components/Skeleton";
import { extractStoragePath } from "@/lib/utils";
import type { Magazine } from "@/lib/types";

export default function MagazinesPage() {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [issue, setIssue] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const fetchMagazines = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("magazines")
      .select("*")
      .order("published_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      console.error("Failed to fetch magazines:", fetchError);
    } else {
      setMagazines(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMagazines();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError("");

    let coverImageUrl: string | null = null;
    let pdfUrl: string | null = null;

    // Upload cover image
    if (coverFile) {
      const coverExt = coverFile.name.split(".").pop();
      const coverPath = `covers/${Date.now()}-${Math.random().toString(36).substring(2)}.${coverExt}`;

      const { error: coverUploadError } = await supabase.storage
        .from("magazines")
        .upload(coverPath, coverFile);

      if (coverUploadError) {
        setError(`Cover upload failed: ${coverUploadError.message}`);
        console.error("Cover upload error:", coverUploadError);
        setUploading(false);
        return;
      }

      const { data: coverUrlData } = supabase.storage
        .from("magazines")
        .getPublicUrl(coverPath);

      coverImageUrl = coverUrlData.publicUrl;
    }

    // Upload PDF file
    if (pdfFile) {
      const pdfPath = `pdfs/${Date.now()}-${Math.random().toString(36).substring(2)}.pdf`;

      const { error: pdfUploadError } = await supabase.storage
        .from("magazines")
        .upload(pdfPath, pdfFile);

      if (pdfUploadError) {
        setError(`PDF upload failed: ${pdfUploadError.message}`);
        console.error("PDF upload error:", pdfUploadError);
        setUploading(false);
        return;
      }

      const { data: pdfUrlData } = supabase.storage
        .from("magazines")
        .getPublicUrl(pdfPath);

      pdfUrl = pdfUrlData.publicUrl;
    }

    // Insert database record
    const { error: insertError } = await supabase.from("magazines").insert({
      title,
      issue,
      cover_image: coverImageUrl,
      pdf_url: pdfUrl,
    });

    if (insertError) {
      setError(`Upload succeeded but database insert failed: ${insertError.message}`);
      console.error("Insert error:", insertError);
    } else {
      setTitle("");
      setIssue("");
      setCoverFile(null);
      setPdfFile(null);
      fetchMagazines();
    }
    setUploading(false);
  };

  const handleDelete = async (magazine: Magazine) => {
    if (!confirm("Delete this magazine?")) return;

    // Clean up storage files
    if (magazine.cover_image) {
      const coverPath = extractStoragePath(magazine.cover_image, "magazines");
      if (coverPath) {
        await supabase.storage.from("magazines").remove([coverPath]);
      }
    }

    if (magazine.pdf_url) {
      const pdfPath = extractStoragePath(magazine.pdf_url, "magazines");
      if (pdfPath) {
        await supabase.storage.from("magazines").remove([pdfPath]);
      }
    }

    const { error: deleteError } = await supabase
      .from("magazines")
      .delete()
      .eq("id", magazine.id);

    if (deleteError) {
      setError(`Failed to delete: ${deleteError.message}`);
      console.error("Delete error:", deleteError);
    } else {
      setMagazines((prev) => prev.filter((m) => m.id !== magazine.id));
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text tracking-wide">Magazines</h1>
        <p className="text-text/50 text-xs sm:text-sm mt-1">Manage club magazines</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-solar-flare/10 border border-solar-flare/30 rounded-lg text-solar-flare text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-panel/80 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="font-heading text-base sm:text-lg font-semibold text-text mb-4 tracking-wide">Upload Magazine</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Magazine Title"
              className="bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-stellar-gold transition-colors"
            />
            <input
              type="text"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Issue (e.g., Vol. 1, Issue 3)"
              className="bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-stellar-gold transition-colors"
            />
            <div>
              <label className="block text-[10px] sm:text-xs text-text/50 mb-1.5 font-mono-tech uppercase tracking-wider">
                Cover Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-stellar-gold file:text-background file:font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs text-text/50 mb-1.5 font-mono-tech uppercase tracking-wider">
                PDF File
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-stellar-gold file:text-background file:font-medium"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="px-5 sm:px-6 py-3 sm:py-2.5 bg-stellar-gold text-background rounded-lg text-sm font-heading font-medium tracking-wide hover:bg-stellar-gold/90 transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Magazine"}
          </button>
        </form>
      </div>

      {/* Magazines Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonImage key={i} />)
          : magazines.map((magazine, index) => (
              <motion.div
                key={magazine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden"
              >
                {magazine.cover_image ? (
                  <div className="aspect-[3/4] relative">
                    <img
                      src={magazine.cover_image}
                      alt={magazine.title || "Magazine cover"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-panel flex items-center justify-center text-text/20 text-4xl">
                    📰
                  </div>
                )}
                <div className="p-3 sm:p-4">
                  <h3 className="font-heading font-semibold text-text truncate text-sm sm:text-base tracking-wide">
                    {magazine.title || "Untitled"}
                  </h3>
                  {magazine.issue && (
                    <p className="text-xs text-nebula-violet mt-1">{magazine.issue}</p>
                  )}
                  {magazine.published_at && (
                    <p className="text-xs font-mono-tech text-text/30 mt-1">
                      {new Date(magazine.published_at).toLocaleDateString()}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    {magazine.pdf_url && (
                      <a
                        href={magazine.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs bg-background border border-border rounded text-text/50 hover:text-solar-flare hover:border-solar-flare/30 transition-colors"
                      >
                        Download
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(magazine)}
                      className="px-3 py-1.5 text-xs bg-background border border-border rounded text-text/50 hover:text-solar-flare hover:border-solar-flare/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
      </div>
    </AdminLayout>
  );
}
