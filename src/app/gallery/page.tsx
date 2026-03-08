"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { SkeletonImage } from "@/components/Skeleton";
import { extractStoragePath } from "@/lib/utils";
import type { GalleryImage } from "@/lib/types";

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");

  const fetchImages = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      console.error("Failed to fetch gallery:", fetchError);
    } else {
      setImages(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchImages();
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
      .from("gallery")
      .upload(filePath, file);

    if (uploadError) {
      setError(`File upload failed: ${uploadError.message}`);
      console.error("Upload error:", uploadError);
      setUploading(false);
      return;
    }

    // Step 2: Get public URL
    const { data: urlData } = supabase.storage
      .from("gallery")
      .getPublicUrl(filePath);

    // Step 3: Insert database record
    const { data: { user } } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("gallery").insert({
      image_url: urlData.publicUrl,
      caption,
      uploaded_by: user?.id,
    });

    if (insertError) {
      setError(`Upload succeeded but database insert failed: ${insertError.message}`);
      console.error("Insert error:", insertError);
    } else {
      setCaption("");
      setFile(null);
      fetchImages();
    }
    setUploading(false);
  };

  const handleDelete = async (image: GalleryImage) => {
    if (!confirm("Delete this image?")) return;

    // Extract file path from URL
    const filePath = extractStoragePath(image.image_url, "gallery");
    if (filePath) {
      await supabase.storage.from("gallery").remove([filePath]);
    }

    const { error: deleteError } = await supabase
      .from("gallery")
      .delete()
      .eq("id", image.id);

    if (deleteError) {
      setError(`Failed to delete: ${deleteError.message}`);
      console.error("Delete error:", deleteError);
    } else {
      setImages((prev) => prev.filter((img) => img.id !== image.id));
    }
  };

  const handleEditCaption = async (id: string) => {
    const { error: updateError } = await supabase
      .from("gallery")
      .update({ caption: editCaption })
      .eq("id", id);

    if (updateError) {
      setError(`Failed to update caption: ${updateError.message}`);
      console.error("Update error:", updateError);
    } else {
      setImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, caption: editCaption } : img))
      );
      setEditingId(null);
      setEditCaption("");
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text tracking-wide">Gallery</h1>
        <p className="text-text/50 text-xs sm:text-sm mt-1">Manage gallery images</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-solar-flare/10 border border-solar-flare/30 rounded-lg text-solar-flare text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-panel/80 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="font-heading text-base sm:text-lg font-semibold text-text mb-4 tracking-wide">Upload Image</h2>
        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="flex-1 bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-stellar-gold file:text-background file:font-medium"
          />
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption"
            className="flex-1 bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-stellar-gold transition-colors"
          />
          <button
            type="submit"
            disabled={uploading || !file}
            className="px-5 sm:px-6 py-3 sm:py-2.5 bg-stellar-gold text-background rounded-lg text-sm font-heading font-medium tracking-wide hover:bg-stellar-gold/90 transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonImage key={i} />)
          : images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden group"
              >
                <div className="aspect-square relative">
                  <img
                    src={image.image_url}
                    alt={image.caption || "Gallery image"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  {editingId === image.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-stellar-gold"
                      />
                      <button
                        onClick={() => handleEditCaption(image.id)}
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
                  ) : (
                    <p className="text-sm text-text/70 truncate">{image.caption || "No caption"}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setEditingId(image.id);
                        setEditCaption(image.caption || "");
                      }}
                      className="px-3 py-1.5 text-xs bg-background border border-border rounded text-text/50 hover:text-nebula-violet hover:border-nebula-violet/30 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(image)}
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
