"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { SkeletonImage } from "@/components/Skeleton";
import { extractStoragePath } from "@/lib/utils";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAuthor, setEditAuthor] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      console.error("Failed to fetch projects:", fetchError);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setUploading(true);
    setError("");

    let thumbnailUrl: string | null = null;
    let pdfUrl: string | null = null;

    // Upload thumbnail
    if (thumbnailFile) {
      const thumbExt = thumbnailFile.name.split(".").pop();
      const thumbPath = `thumbnails/${Date.now()}-${Math.random().toString(36).substring(2)}.${thumbExt}`;

      const { error: thumbUploadError } = await supabase.storage
        .from("projects")
        .upload(thumbPath, thumbnailFile);

      if (thumbUploadError) {
        setError(`Thumbnail upload failed: ${thumbUploadError.message}`);
        console.error("Thumbnail upload error:", thumbUploadError);
        setUploading(false);
        return;
      }

      const { data: thumbUrlData } = supabase.storage
        .from("projects")
        .getPublicUrl(thumbPath);

      thumbnailUrl = thumbUrlData.publicUrl;
    }

    // Upload PDF
    if (pdfFile) {
      const pdfPath = `pdfs/${Date.now()}-${Math.random().toString(36).substring(2)}.pdf`;

      const { error: pdfUploadError } = await supabase.storage
        .from("projects")
        .upload(pdfPath, pdfFile);

      if (pdfUploadError) {
        setError(`PDF upload failed: ${pdfUploadError.message}`);
        console.error("PDF upload error:", pdfUploadError);
        setUploading(false);
        return;
      }

      const { data: pdfUrlData } = supabase.storage
        .from("projects")
        .getPublicUrl(pdfPath);

      pdfUrl = pdfUrlData.publicUrl;
    }

    // Insert database record
    const { error: insertError } = await supabase.from("projects").insert({
      title,
      description: description || null,
      thumbnail_url: thumbnailUrl,
      pdf_url: pdfUrl,
      author: author || null,
    });

    if (insertError) {
      // Clean up orphaned storage files on failed insert
      if (thumbnailUrl) {
        const thumbPath = extractStoragePath(thumbnailUrl, "projects");
        if (thumbPath) await supabase.storage.from("projects").remove([thumbPath]);
      }
      if (pdfUrl) {
        const pPath = extractStoragePath(pdfUrl, "projects");
        if (pPath) await supabase.storage.from("projects").remove([pPath]);
      }
      setError(`Upload succeeded but database insert failed: ${insertError.message}`);
      console.error("Insert error:", insertError);
    } else {
      setTitle("");
      setDescription("");
      setAuthor("");
      setThumbnailFile(null);
      setPdfFile(null);
      fetchProjects();
    }
    setUploading(false);
  };

  const handleEdit = async (id: string) => {
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        title: editTitle,
        description: editDescription || null,
        author: editAuthor || null,
      })
      .eq("id", id);

    if (updateError) {
      setError(`Failed to update project: ${updateError.message}`);
      console.error("Update error:", updateError);
    } else {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, title: editTitle, description: editDescription || null, author: editAuthor || null }
            : p
        )
      );
      setEditingId(null);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!confirm("Delete this project?")) return;

    // Clean up storage files
    if (project.thumbnail_url) {
      const thumbPath = extractStoragePath(project.thumbnail_url, "projects");
      if (thumbPath) {
        await supabase.storage.from("projects").remove([thumbPath]);
      }
    }

    if (project.pdf_url) {
      const pdfPath = extractStoragePath(project.pdf_url, "projects");
      if (pdfPath) {
        await supabase.storage.from("projects").remove([pdfPath]);
      }
    }

    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (deleteError) {
      setError(`Failed to delete: ${deleteError.message}`);
      console.error("Delete error:", deleteError);
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    }
  };

  const startEditing = (project: Project) => {
    setEditingId(project.id);
    setEditTitle(project.title);
    setEditDescription(project.description || "");
    setEditAuthor(project.author || "");
  };

  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text tracking-wide">Projects</h1>
        <p className="text-text/50 text-xs sm:text-sm mt-1">Manage club projects</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-solar-flare/10 border border-solar-flare/30 rounded-lg text-solar-flare text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-panel/80 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="font-heading text-base sm:text-lg font-semibold text-text mb-4 tracking-wide">Upload Project</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project Title"
              required
              className="bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-stellar-gold transition-colors"
            />
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author"
              className="bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-stellar-gold transition-colors"
            />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Project Description"
            rows={3}
            className="w-full bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-stellar-gold resize-none transition-colors"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[10px] sm:text-xs text-text/50 mb-1.5 font-mono-tech uppercase tracking-wider">
                Thumbnail Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
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
            disabled={uploading || !title.trim()}
            className="px-5 sm:px-6 py-3 sm:py-2.5 bg-stellar-gold text-background rounded-lg text-sm font-heading font-medium tracking-wide hover:bg-stellar-gold/90 transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Project"}
          </button>
        </form>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonImage key={i} />)
          : projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden"
              >
                {project.thumbnail_url ? (
                  <div className="aspect-video relative">
                    <img
                      src={project.thumbnail_url}
                      alt={project.title || "Project thumbnail"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-panel flex items-center justify-center text-text/20 text-4xl">
                    📁
                  </div>
                )}
                <div className="p-3 sm:p-4">
                  {editingId === project.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-stellar-gold"
                        placeholder="Title"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-stellar-gold resize-none"
                        placeholder="Description"
                        rows={2}
                      />
                      <input
                        type="text"
                        value={editAuthor}
                        onChange={(e) => setEditAuthor(e.target.value)}
                        className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-stellar-gold"
                        placeholder="Author"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(project.id)}
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
                      <h3 className="font-heading font-semibold text-text truncate text-sm sm:text-base tracking-wide">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="text-xs text-text/50 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      {project.author && (
                        <p className="text-xs text-nebula-violet mt-1">{project.author}</p>
                      )}
                      {project.created_at && (
                        <p className="text-xs font-mono-tech text-text/30 mt-1">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </>
                  )}
                  {editingId !== project.id && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {project.pdf_url && (
                        <a
                          href={project.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs bg-background border border-border rounded text-text/50 hover:text-solar-flare hover:border-solar-flare/30 transition-colors"
                        >
                          View PDF
                        </a>
                      )}
                      <button
                        onClick={() => startEditing(project)}
                        className="px-3 py-1.5 text-xs bg-background border border-border rounded text-text/50 hover:text-nebula-violet hover:border-nebula-violet/30 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project)}
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
