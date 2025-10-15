import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// --- Setup: replace with your values ---
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "your-anon-key";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// --------------------------------------

// Tailwind-friendly component that implements:
// - Upload image/video to Supabase Storage
// - Create a status record in `statuses` table
// - List active statuses (not expired)
// - Real-time subscription to new statuses
// - Mark status as viewed (optional)

export default function WhatsAppStatus({ currentUserId }) {
  const [statuses, setStatuses] = useState([]);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    fetchStatuses();
    subscribeToStatuses();
    return () => {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchStatuses() {
    setLoading(true);
    // Only get statuses that haven't expired
    const { data, error } = await supabase
      .from("statuses")
      .select(`*, users(username, avatar_url)`)
      .gte("expires_at", new Date().toISOString());

    if (error) {
      console.error("fetchStatuses error", error);
      setLoading(false);
      return;
    }
    setStatuses(data || []);
    setLoading(false);
  }

  function subscribeToStatuses() {
    // Realtime subscription to statuses table
    subscriptionRef.current = supabase
      .channel("public:statuses")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "statuses" },
        (payload) => {
          // add new status if not expired
          const newStatus = payload.new;
          if (new Date(newStatus.expires_at) > new Date()) {
            setStatuses((s) => [newStatus, ...s]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "statuses" },
        (payload) => {
          const deleted = payload.old;
          setStatuses((s) => s.filter((st) => st.id !== deleted.id));
        }
      )
      .subscribe();
  }

  async function uploadAndCreateStatus(e) {
    e.preventDefault();
    if (!file) return alert("Select a file first");
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const fileName = `${currentUserId}/${Date.now()}.${ext}`;
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("statuses")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL (or signed URL for private buckets)
      const { data: { publicURL } = {} } = { data: { publicURL: null } };
      // If bucket is public:
      const { data } = supabase.storage.from("statuses").getPublicUrl(fileName);
      const url = data.publicUrl;

      // Create status row with 24 hour expiry
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { error: insertError } = await supabase.from("statuses").insert([
        {
          user_id: currentUserId,
          file_url: url,
          caption: caption || null,
          mime_type: file.type,
          expires_at: expiresAt,
        },
      ]);

      if (insertError) throw insertError;

      setFile(null);
      setCaption("");
    } catch (err) {
      console.error("upload error", err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function markViewed(statusId) {
    if (!currentUserId) return;
    await supabase.from("status_views").insert([
      { status_id: statusId, viewer_id: currentUserId },
    ]);
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Statuses</h2>

      <form onSubmit={uploadAndCreateStatus} className="mb-6">
        <div className="flex gap-2 items-center">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Add a caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="flex-1 border p-2 rounded"
          />
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 rounded shadow hover:scale-[.99] transition"
          >
            {uploading ? "Uploading..." : "Post"}
          </button>
        </div>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : statuses.length === 0 ? (
        <p>No active statuses</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {statuses.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-lg p-2 shadow cursor-pointer"
              onClick={() => markViewed(st.id)}
            >
              <div className="h-40 w-full bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                {st.mime_type?.startsWith("image") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={st.file_url} alt={st.caption ?? "status"} className="object-cover h-full w-full" />
                ) : (
                  <video src={st.file_url} controls className="h-full w-full object-cover" />
                )}
              </div>
              <div className="mt-2 text-sm">
                <div className="font-medium">{st.users?.username ?? "Unknown"}</div>
                <div className="text-xs text-gray-500">{st.caption}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/*
SQL schema (run in Supabase SQL editor):

-- statuses table
create table public.statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  file_url text not null,
  mime_type text,
  caption text,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

-- status_views table (track who viewed)
create table public.status_views (
  id uuid primary key default gen_random_uuid(),
  status_id uuid references public.statuses(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete cascade,
  viewed_at timestamptz default now()
);

-- Add an index for quick expiry filtering
create index on public.statuses (expires_at);

-- Optional: Policy to allow inserts for authenticated users
-- Enable Row Level Security first: (in SQL)
-- alter table public.statuses enable row level security;
-- Then create policies as needed for your app.


Notes & setup:
1. Create a Storage bucket named `statuses`. If you want the files private, use signed URLs instead of getPublicUrl.
2. In a production app you should run a background job (Edge Function, cron, or DB function) to delete expired statuses or let client filter them out.
3. For real-time updates we use Supabase Realtime (postgres_changes). Make sure realtime is enabled for the table in Supabase.
4. This component expects `currentUserId` prop (the authenticated user's id). Use your auth/login flow to provide it.
5. For private storage: after upload use `createSignedUrl(fileName, expiresInSeconds)` and store that signed url or generate it on demand.
*/
