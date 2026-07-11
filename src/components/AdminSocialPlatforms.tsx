import React from "react";
import { SocialPlatform } from "../types";
import { invalidatePlatformsCache } from "../lib/platformsStore";
import PlatformIcon from "./PlatformIcon";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Power,
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Share2,
  X,
  Upload,
  ImageOff
} from "lucide-react";

interface AdminSocialPlatformsProps {
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
}

interface PlatformFormState {
  id: string | null;
  name: string;
  description: string;
  status: "Active" | "Inactive";
  logoUrl: string;
}

const EMPTY_FORM: PlatformFormState = { id: null, name: "", description: "", status: "Active", logoUrl: "" };

export default function AdminSocialPlatforms({ apiFetch }: AdminSocialPlatformsProps) {
  const [platforms, setPlatforms] = React.useState<SocialPlatform[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");

  const [showModal, setShowModal] = React.useState(false);
  const [form, setForm] = React.useState<PlatformFormState>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [modalError, setModalError] = React.useState("");

  const fetchPlatforms = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await apiFetch("/api/admin/platforms");
      if (Array.isArray(data)) {
        setPlatforms(data);
      } else {
        setErrorMsg("Failed to load social media platforms.");
      }
    } catch (e) {
      setErrorMsg("Error communicating with server.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPlatforms();
  }, []);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setModalError("");
    setShowModal(true);
  };

  const openEditModal = (p: SocialPlatform) => {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description || "",
      status: p.status,
      logoUrl: p.logoUrl || ""
    });
    setModalError("");
    setShowModal(true);
  };

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setModalError("Please select a valid image file for the logo.");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setModalError("Logo image is too large. Please choose an image under 1.5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setModalError("Platform name is required.");
      return;
    }
    setSaving(true);
    setModalError("");
    try {
      const payload = {
        name: form.name.trim(),
        icon: form.name.trim(),
        logoUrl: form.logoUrl || null,
        description: form.description.trim() || null,
        status: form.status
      };

      const res = form.id
        ? await apiFetch(`/api/admin/platforms/${form.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          })
        : await apiFetch("/api/admin/platforms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

      if (res && res.success) {
        invalidatePlatformsCache();
        setShowModal(false);
        flash(form.id ? "Platform updated successfully." : "New platform created and added to Task Pricing.");
        fetchPlatforms();
      } else {
        setModalError(res?.error || "Failed to save platform.");
      }
    } catch (e) {
      setModalError("Network error while saving the platform.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (p: SocialPlatform) => {
    try {
      const res = await apiFetch(`/api/admin/platforms/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: p.status === "Active" ? "Inactive" : "Active" })
      });
      if (res && res.success) {
        invalidatePlatformsCache();
        flash(`${p.name} is now ${p.status === "Active" ? "disabled" : "enabled"}.`);
        fetchPlatforms();
      } else {
        setErrorMsg(res?.error || "Failed to update platform status.");
      }
    } catch (e) {
      setErrorMsg("Network error while updating platform status.");
    }
  };

  const handleDelete = async (p: SocialPlatform) => {
    if (!window.confirm(`Delete "${p.name}"? This also removes its Task Pricing rule. Existing tasks already using this platform keep their history but the platform will no longer be selectable.`)) return;
    try {
      const res = await apiFetch(`/api/admin/platforms/${p.id}`, { method: "DELETE" });
      if (res && res.success) {
        invalidatePlatformsCache();
        flash(`"${p.name}" was deleted.`);
        fetchPlatforms();
      } else {
        setErrorMsg(res?.error || "Failed to delete platform.");
      }
    } catch (e) {
      setErrorMsg("Network error while deleting the platform.");
    }
  };

  const filtered = platforms.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-black text-slate-800 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-indigo-500" /> Social Media Platforms
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Manage the social media platforms available across task creation, task listings, filters, and Task Pricing. Everything here is stored in the database — no platform is hardcoded.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={fetchPlatforms}
              disabled={loading}
              className="rounded-xl border border-slate-200 hover:bg-slate-50 p-2.5 text-xs font-bold text-slate-600 transition-all flex items-center gap-1 cursor-pointer"
              title="Reload platforms"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Reload
            </button>
            <button
              onClick={openCreateModal}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle className="h-4 w-4" /> Add New Platform
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-xs font-semibold text-blue-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-xs font-semibold text-red-800 flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" /> {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
          <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-3 font-semibold animate-pulse">Loading social media platforms...</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="border-b border-slate-200 bg-slate-50 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search platforms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono font-bold uppercase shrink-0">
              {filtered.length} of {platforms.length} Platforms
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No platforms found. Click "Add New Platform" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] text-slate-400 font-extrabold tracking-wider uppercase border-b border-slate-200">
                    <th className="px-5 py-4 w-2/5">Platform</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/30 transition-all">
                      <td className="px-5 py-4.5">
                        <div className="flex items-center gap-3">
                          <PlatformIcon platform={p.name} size={15} showBg className="shrink-0" />
                          <span className="font-bold text-slate-800 text-sm block">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4.5 text-slate-500 max-w-xs">
                        <span className="line-clamp-2">{p.description || "—"}</span>
                      </td>
                      <td className="px-5 py-4.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                            p.status === "Active" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${p.status === "Active" ? "bg-blue-500" : "bg-slate-400"}`} />
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(p)}
                            title={p.status === "Active" ? "Disable platform" : "Enable platform"}
                            className="rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 p-2 transition-all cursor-pointer"
                          >
                            <Power className={`h-3.5 w-3.5 ${p.status === "Active" ? "text-blue-500" : "text-slate-400"}`} />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit platform"
                            className="rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 p-2 transition-all cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            title="Delete platform"
                            className="rounded-lg border border-red-100 text-red-500 hover:bg-red-50 p-2 transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Guide widget */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex gap-3 text-xs leading-relaxed text-slate-500 shadow-3xs">
        <Share2 className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Dynamic Platform Integration:</strong> Newly added platforms instantly appear in campaign creation, task listings, filters, and Task Pricing — set the advertiser price and earner reward for each one from the Task Pricing tab. Disabling a platform hides it from advertisers and earners without deleting historical data.
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-display text-sm font-black text-slate-800">
                {form.id ? "Edit Platform" : "Add New Platform"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {modalError && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Platform Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Instagram, TikTok, Facebook"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Platform Logo / Icon</label>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="logo preview" className="h-full w-full object-contain" />
                    ) : (
                      <ImageOff className="h-5 w-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30 px-3 py-2 text-xs font-semibold text-slate-500 cursor-pointer transition-all">
                      <Upload className="h-3.5 w-3.5" /> Upload image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && e.target.files[0] && handleLogoFile(e.target.files[0])}
                      />
                    </label>
                    <input
                      type="text"
                      value={form.logoUrl.startsWith("data:") ? "" : form.logoUrl}
                      onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                      placeholder="or paste an image URL"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Leave empty to use the platform's default auto-detected icon.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short note for internal reference"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Status</label>
                <div className="flex gap-2">
                  {(["Active", "Inactive"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                        form.status === s ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
              >
                {saving ? "Saving..." : form.id ? "Save Changes" : "Create Platform"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
