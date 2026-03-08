"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { SkeletonRow } from "@/components/Skeleton";
import { extractStoragePath, formatDate, toDatetimeLocal } from "@/lib/utils";
import type { ClubEvent } from "@/lib/types";

export default function EventsPage() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editEventDate, setEditEventDate] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("club_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      console.error("Failed to fetch events:", fetchError);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setUploading(true);
    setError("");

    let posterUrl: string | null = null;

    if (file) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Step 1: Upload poster to storage
      const { error: uploadError } = await supabase.storage
        .from("events")
        .upload(filePath, file);

      if (uploadError) {
        setError(`Poster upload failed: ${uploadError.message}`);
        console.error("Upload error:", uploadError);
        setUploading(false);
        return;
      }

      // Step 2: Get public URL
      const { data: urlData } = supabase.storage
        .from("events")
        .getPublicUrl(filePath);

      posterUrl = urlData.publicUrl;
    }

    // Step 3: Insert database record
    const { error: insertError } = await supabase.from("club_events").insert({
      title,
      description,
      poster_url: posterUrl,
      location,
      event_date: eventDate || null,
    });

    if (insertError) {
      setError(`Upload succeeded but database insert failed: ${insertError.message}`);
      console.error("Insert error:", insertError);
    } else {
      setTitle("");
      setDescription("");
      setLocation("");
      setEventDate("");
      setFile(null);
      fetchEvents();
    }
    setUploading(false);
  };

  const handleDelete = async (event: ClubEvent) => {
    if (!confirm("Delete this event?")) return;

    if (event.poster_url) {
      const filePath = extractStoragePath(event.poster_url, "events");
      if (filePath) {
        await supabase.storage.from("events").remove([filePath]);
      }
    }

    const { error: deleteError } = await supabase
      .from("club_events")
      .delete()
      .eq("id", event.id);

    if (deleteError) {
      setError(`Failed to delete: ${deleteError.message}`);
      console.error("Delete error:", deleteError);
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    }
  };

  const handleEdit = async (id: string) => {
    const { error: updateError } = await supabase
      .from("club_events")
      .update({
        title: editTitle,
        description: editDescription,
        location: editLocation,
        event_date: editEventDate || null,
      })
      .eq("id", id);

    if (updateError) {
      setError(`Failed to update: ${updateError.message}`);
      console.error("Update error:", updateError);
    } else {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, title: editTitle, description: editDescription, location: editLocation, event_date: editEventDate }
            : e
        )
      );
      setEditingId(null);
    }
  };

  const startEdit = (event: ClubEvent) => {
    setEditingId(event.id);
    setEditTitle(event.title);
    setEditDescription(event.description || "");
    setEditLocation(event.location || "");
    setEditEventDate(event.event_date ? toDatetimeLocal(event.event_date) : "");
  };

  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text tracking-wide">Events</h1>
        <p className="text-text/50 text-xs sm:text-sm mt-1">Manage club events</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-solar-flare/10 border border-solar-flare/30 rounded-lg text-solar-flare text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Create Form */}
      <div className="bg-panel/80 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="font-heading text-base sm:text-lg font-semibold text-text mb-4 tracking-wide">Create Event</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event Title"
              required
              className="bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-stellar-gold transition-colors"
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-stellar-gold transition-colors"
            />
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text focus:outline-none focus:border-stellar-gold transition-colors"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-stellar-gold file:text-background file:font-medium"
            />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Event Description"
            rows={3}
            className="w-full bg-card border border-border rounded-lg px-4 py-3 sm:py-2.5 text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-stellar-gold resize-none transition-colors"
          />
          <button
            type="submit"
            disabled={uploading || !title}
            className="px-5 sm:px-6 py-3 sm:py-2.5 bg-stellar-gold text-background rounded-lg text-sm font-heading font-medium tracking-wide hover:bg-stellar-gold/90 transition-colors disabled:opacity-50"
          >
            {uploading ? "Creating..." : "Create Event"}
          </button>
        </form>
      </div>

      {/* Events Table */}
      <div className="bg-panel/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 sm:p-4 text-text/50 font-mono-tech text-[10px] sm:text-xs uppercase tracking-wider">Poster</th>
                <th className="text-left p-3 sm:p-4 text-text/50 font-mono-tech text-[10px] sm:text-xs uppercase tracking-wider">Title</th>
                <th className="text-left p-3 sm:p-4 text-text/50 font-mono-tech text-[10px] sm:text-xs uppercase tracking-wider hidden sm:table-cell">Location</th>
                <th className="text-left p-3 sm:p-4 text-text/50 font-mono-tech text-[10px] sm:text-xs uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-left p-3 sm:p-4 text-text/50 font-mono-tech text-[10px] sm:text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="p-0">
                        <SkeletonRow />
                      </td>
                    </tr>
                  ))
                : events.map((event, index) => (
                    <motion.tr
                      key={event.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border/50 hover:bg-card/50 transition-colors"
                    >
                      <td className="p-3 sm:p-4">
                        {event.poster_url ? (
                          <img
                            src={event.poster_url}
                            alt={event.title}
                            className="w-12 h-9 sm:w-16 sm:h-12 object-cover rounded border border-border"
                          />
                        ) : (
                          <div className="w-12 h-9 sm:w-16 sm:h-12 bg-card border border-border rounded flex items-center justify-center text-text/30 text-xs">
                            No poster
                          </div>
                        )}
                      </td>
                      <td className="p-3 sm:p-4">
                        {editingId === event.id ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="bg-background border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-stellar-gold w-full"
                          />
                        ) : (
                          <span className="text-text font-medium text-xs sm:text-sm">{event.title}</span>
                        )}
                      </td>
                      <td className="p-3 sm:p-4 hidden sm:table-cell">
                        {editingId === event.id ? (
                          <input
                            type="text"
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                            className="bg-background border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-stellar-gold w-full"
                          />
                        ) : (
                          <span className="text-text/70 text-xs sm:text-sm">{event.location || "—"}</span>
                        )}
                      </td>
                      <td className="p-3 sm:p-4 hidden md:table-cell">
                        {editingId === event.id ? (
                          <input
                            type="datetime-local"
                            value={editEventDate}
                            onChange={(e) => setEditEventDate(e.target.value)}
                            className="bg-background border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-stellar-gold"
                          />
                        ) : (
                          <span className="text-text/70 font-mono-tech text-xs">
                            {event.event_date
                              ? formatDate(event.event_date)
                              : "—"}
                          </span>
                        )}
                      </td>
                      <td className="p-3 sm:p-4">
                        {editingId === event.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(event.id)}
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(event)}
                              className="px-3 py-1.5 text-xs bg-card border border-border rounded text-text/50 hover:text-nebula-violet hover:border-nebula-violet/30 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(event)}
                              className="px-3 py-1.5 text-xs bg-card border border-border rounded text-text/50 hover:text-solar-flare hover:border-solar-flare/30 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
