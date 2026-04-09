"use client";

import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/app-shell";

interface ContentItem {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  mediaUrl: string;
  mediaType: string;
  platform: string[];
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  error: string | null;
  createdAt: string;
  author: { name: string | null; email: string };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-black/8 text-text3",
  SCHEDULED: "bg-blue-100 text-blue-700",
  PUBLISHING: "bg-yellow-100 text-yellow-700",
  PUBLISHED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export default function ContentStudioPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [filter, setFilter] = useState<"all" | "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED">("all");

  const fetchContents = async () => {
    const res = await fetch("/api/admin/content");
    const data = await res.json();
    if (data.success) setContents(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchContents(); }, []);

  const filtered = filter === "all" ? contents : contents.filter(c => c.status === filter);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this content?")) return;
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchContents();
  };

  return (
    <AppShell>
      <div className="animate-fade-in max-w-[1400px] mx-auto p-4 sm:p-6 md:p-7 md:px-8 pb-14">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.035em]">Content Studio</h1>
            <p className="text-[13px] text-text3 mt-1">Upload, schedule, and publish to TikTok & Instagram</p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-5 py-2.5 bg-text text-white text-[13px] font-semibold rounded-[var(--radius-xs)] cursor-pointer border-none hover:bg-black/80 transition-colors shrink-0"
          >
            {showUpload ? "Cancel" : "+ New Content"}
          </button>
        </div>

        {/* Upload form */}
        {showUpload && (
          <UploadForm onSuccess={() => { setShowUpload(false); fetchContents(); }} />
        )}

        {/* Filters */}
        <div className="flex gap-[5px] mb-5 overflow-x-auto pb-1">
          {(["all", "DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-[5px] rounded-[18px] text-[11px] font-semibold border-none cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                filter === f ? "bg-text text-white" : "bg-black/5 text-text3 hover:bg-black/8"
              }`}
            >
              {f === "all" ? `All (${contents.length})` : `${f.charAt(0) + f.slice(1).toLowerCase()} (${contents.filter(c => c.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Content grid */}
        {loading ? (
          <div className="text-center text-text3 text-[13px] py-16">Loading content...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-[48px] mb-3 opacity-20">0</div>
            <p className="text-[14px] text-text3">No content yet. Click &quot;+ New Content&quot; to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <div key={c.id} className="bg-white border border-border rounded-[var(--radius)] overflow-hidden">
                {/* Media preview */}
                <div className="relative aspect-video bg-bg2 overflow-hidden">
                  {c.mediaType === "video" ? (
                    <video src={c.mediaUrl} className="w-full h-full object-cover" muted playsInline
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                    />
                  ) : (
                    <img src={c.mediaUrl} alt={c.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {c.platform.map(p => (
                      <span key={p} className="text-[9px] font-bold uppercase bg-black/60 text-white px-2 py-[2px] rounded-full backdrop-blur-sm">
                        {p}
                      </span>
                    ))}
                  </div>
                  <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-[2px] rounded-full ${STATUS_COLORS[c.status] ?? ""}`}>
                    {c.status}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-[14px] font-semibold mb-1 line-clamp-1">{c.title}</h3>
                  <p className="text-[12px] text-text3 line-clamp-2 mb-3">{c.caption}</p>

                  {c.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {c.hashtags.slice(0, 5).map(h => (
                        <span key={h} className="text-[10px] text-accent font-medium">#{h}</span>
                      ))}
                      {c.hashtags.length > 5 && <span className="text-[10px] text-text3">+{c.hashtags.length - 5}</span>}
                    </div>
                  )}

                  {c.scheduledAt && (
                    <div className="text-[11px] text-text3 mb-3">
                      Scheduled: {new Date(c.scheduledAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}

                  {c.error && (
                    <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded mb-3">{c.error}</div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => navigator.clipboard.writeText(c.caption + "\n\n" + c.hashtags.map(h => "#" + h).join(" "))}
                      className="flex-1 py-1.5 text-[11px] font-semibold bg-black/5 text-text2 rounded-[var(--radius-xs)] cursor-pointer border-none hover:bg-black/8 transition-colors"
                    >
                      Copy Caption
                    </button>
                    <button
                      onClick={() => window.open(c.mediaUrl, "_blank")}
                      className="flex-1 py-1.5 text-[11px] font-semibold bg-black/5 text-text2 rounded-[var(--radius-xs)] cursor-pointer border-none hover:bg-black/8 transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="py-1.5 px-3 text-[11px] font-semibold text-red-500 bg-red-50 rounded-[var(--radius-xs)] cursor-pointer border-none hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ─── Upload Form ────────────────────────────────────────────

function UploadForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["tiktok", "instagram"]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select a file"); return; }
    if (platforms.length === 0) { setError("Select at least one platform"); return; }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("caption", caption);
    formData.append("hashtags", hashtags);
    formData.append("platforms", platforms.join(","));
    if (scheduledAt) formData.append("scheduledAt", scheduledAt);

    const res = await fetch("/api/admin/content", { method: "POST", body: formData });
    const data = await res.json();

    if (data.success) {
      onSuccess();
    } else {
      setError(data.error || "Upload failed");
    }
    setUploading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-border rounded-[var(--radius)] p-5 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: form fields */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] block mb-1.5">Title</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)} required
              placeholder="e.g. WTI surge analysis"
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-xs)] border border-border bg-bg text-[13px] outline-none focus:border-text/30 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] block mb-1.5">Caption</label>
            <textarea
              value={caption} onChange={e => setCaption(e.target.value)} required rows={4}
              placeholder="Write your post caption..."
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-xs)] border border-border bg-bg text-[13px] outline-none focus:border-text/30 transition-colors resize-y"
            />
            <div className="text-[10px] text-text3 mt-1 text-right">{caption.length}/2200</div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] block mb-1.5">Hashtags (comma separated)</label>
            <input
              type="text" value={hashtags} onChange={e => setHashtags(e.target.value)}
              placeholder="oil, trading, WTI, crude, tanker"
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-xs)] border border-border bg-bg text-[13px] outline-none focus:border-text/30 transition-colors"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] block mb-1.5">Platforms</label>
              <div className="flex gap-2">
                {["tiktok", "instagram"].map(p => (
                  <button key={p} type="button" onClick={() => togglePlatform(p)}
                    className={`px-4 py-2 rounded-[var(--radius-xs)] text-[12px] font-semibold cursor-pointer border transition-colors ${
                      platforms.includes(p) ? "bg-text text-white border-text" : "bg-bg text-text3 border-border hover:border-text/30"
                    }`}
                  >
                    {p === "tiktok" ? "TikTok" : "Instagram"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] block mb-1.5">Schedule (optional)</label>
              <input
                type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                className="w-full px-3.5 py-2 rounded-[var(--radius-xs)] border border-border bg-bg text-[12px] outline-none focus:border-text/30 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Right: file upload + preview */}
        <div>
          <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.07em] block mb-1.5">Media</label>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={e => { e.preventDefault(); e.stopPropagation(); handleFile(e.dataTransfer.files[0] || null); }}
            className="border-2 border-dashed border-border rounded-[var(--radius)] cursor-pointer hover:border-text/30 transition-colors overflow-hidden"
          >
            {preview ? (
              <div className="relative aspect-[9/16] max-h-[360px]">
                {file?.type.startsWith("video/") ? (
                  <video src={preview} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                ) : (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handleFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-[14px] cursor-pointer border-none flex items-center justify-center hover:bg-black/80"
                >
                  x
                </button>
              </div>
            ) : (
              <div className="aspect-[9/16] max-h-[360px] flex flex-col items-center justify-center text-center p-6">
                <div className="text-[32px] text-text3/30 mb-2">+</div>
                <p className="text-[12px] text-text3 font-medium">Click or drag to upload</p>
                <p className="text-[10px] text-text3/60 mt-1">MP4, MOV, JPG, PNG — max 100MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef} type="file" className="hidden"
            accept="video/mp4,video/quicktime,image/jpeg,image/png,image/webp"
            onChange={e => handleFile(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 text-[12px] rounded-[var(--radius-xs)]">{error}</div>
      )}

      <div className="flex gap-3 mt-5 pt-4 border-t border-border">
        <button
          type="submit" disabled={uploading}
          className="px-6 py-2.5 bg-text text-white text-[13px] font-semibold rounded-[var(--radius-xs)] cursor-pointer border-none hover:bg-black/80 transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading..." : scheduledAt ? "Schedule" : "Save as Draft"}
        </button>
      </div>
    </form>
  );
}
