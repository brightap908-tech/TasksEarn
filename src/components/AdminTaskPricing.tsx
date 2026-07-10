import React from "react";
import { Platform, TaskPricing } from "../types";
import { Save, RefreshCw, CheckCircle, AlertTriangle, Coins, ShieldCheck, Search } from "lucide-react";
import PlatformIcon from "./PlatformIcon";

interface AdminTaskPricingProps {
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
}

export default function AdminTaskPricing({ apiFetch }: AdminTaskPricingProps) {
  const [pricing, setPricing] = React.useState<TaskPricing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Track edits per platform ID
  const [editStates, setEditStates] = React.useState<Record<string, { cost: number; earning: number }>>({});
  const [editingIds, setEditingIds] = React.useState<Set<string>>(new Set());

  const fetchPricing = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const data = await apiFetch("/api/admin/task-pricing");
      if (Array.isArray(data)) {
        setPricing(data);
        // Initialize edit states
        const initialStates: Record<string, { cost: number; earning: number }> = {};
        data.forEach(item => {
          initialStates[item.id] = {
            cost: item.costPerSlot,
            earning: item.earningPerSlot
          };
        });
        setEditStates(initialStates);
        setEditingIds(new Set());
      } else {
        setErrorMsg("Failed to load task pricing data.");
      }
    } catch (e) {
      setErrorMsg("Error communicating with server.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPricing();
  }, []);

  const toggleEdit = (id: string, item: TaskPricing) => {
    const next = new Set(editingIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      // Reset buffers on start edit
      setEditStates(prev => ({
        ...prev,
        [id]: { cost: item.costPerSlot, earning: item.earningPerSlot }
      }));
    }
    setEditingIds(next);
  };

  const handleInputChange = (id: string, field: "cost" | "earning", val: string) => {
    const num = parseFloat(val) || 0;
    setEditStates(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: num
      }
    }));
  };

  const handleSaveRow = async (id: string) => {
    const state = editStates[id];
    if (!state) return;

    if (state.cost < state.earning) {
      setErrorMsg("Advertiser Cost per completed task must be greater than or equal to the Earner Reward.");
      return;
    }
    if (state.earning <= 0 || state.cost <= 0) {
      setErrorMsg("Prices and rewards must be greater than ₦0.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Create updated pricing array
      const updatedPricing = pricing.map(p => {
        if (p.id === id) {
          return {
            ...p,
            costPerSlot: state.cost,
            earningPerSlot: state.earning
          };
        }
        return p;
      });

      const res = await apiFetch("/api/admin/task-pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricing: updatedPricing })
      });

      if (res && res.success) {
        setSuccessMsg("Pricing rule saved successfully!");
        setPricing(updatedPricing);
        const next = new Set(editingIds);
        next.delete(id);
        setEditingIds(next);
      } else {
        setErrorMsg(res.error || "Failed to update pricing.");
      }
    } catch (e) {
      setErrorMsg("An error occurred while saving the updated pricing.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    // Collect all updated items
    const updatedPricing = pricing.map(p => {
      const state = editStates[p.id];
      if (state) {
        return {
          ...p,
          costPerSlot: state.cost,
          earningPerSlot: state.earning
        };
      }
      return p;
    });

    // Validate all items
    const invalidItem = updatedPricing.find(p => p.costPerSlot < p.earningPerSlot || p.earningPerSlot <= 0 || p.costPerSlot <= 0);
    if (invalidItem) {
      setErrorMsg(`Invalid pricing detected for "${invalidItem.platform}". Cost must be greater than or equal to Reward, and both must be positive.`);
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await apiFetch("/api/admin/task-pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricing: updatedPricing })
      });

      if (res && res.success) {
        setSuccessMsg("All platform task pricing synchronized successfully!");
        setPricing(updatedPricing);
        setEditingIds(new Set());
      } else {
        setErrorMsg(res.error || "Failed to save entire task pricing configuration.");
      }
    } catch (e) {
      setErrorMsg("Network error trying to synchronize platform pricing.");
    } finally {
      setSaving(false);
    }
  };

  // Filter and sort pricing rows
  const filteredPricing = pricing.filter(item => 
    item.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header Widget */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-black text-slate-800 flex items-center gap-2">
              <Coins className="h-5 w-5 text-indigo-500" /> Task Pricing & Platform Settings
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure rewards paid to earners (₦) and fees charged to advertisers (₦) dynamically across all supported social media platforms.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={fetchPricing}
              disabled={loading}
              className="rounded-xl border border-slate-200 hover:bg-slate-50 p-2.5 text-xs font-bold text-slate-600 transition-all flex items-center gap-1 cursor-pointer"
              title="Reload pricing list"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Reload
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving || loading}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="h-4 w-4" /> Save All Changes
            </button>
          </div>
        </div>
      </div>

      {/* Message banners */}
      {successMsg && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-xs font-semibold text-blue-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-xs font-semibold text-red-800 flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
          <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-3 font-semibold animate-pulse">Loading platform standard pricing models...</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          
          {/* Controls bar */}
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
              {filteredPricing.length} of {pricing.length} Platforms Displayed
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] text-slate-400 font-extrabold tracking-wider uppercase border-b border-slate-200">
                  <th className="px-5 py-4 w-1/3">Social Media Platform</th>
                  <th className="px-5 py-4 w-1/5">Advertiser Price (₦)</th>
                  <th className="px-5 py-4 w-1/5">Earner Reward (₦)</th>
                  <th className="px-5 py-4 w-1/5">Platform Markup (Commission)</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPricing.map(item => {
                  const isEditing = editingIds.has(item.id);
                  const editState = editStates[item.id] || { cost: item.costPerSlot, earning: item.earningPerSlot };
                  
                  const costVal = isEditing ? editState.cost : item.costPerSlot;
                  const earnVal = isEditing ? editState.earning : item.earningPerSlot;
                  const markup = costVal - earnVal;
                  const percent = costVal > 0 ? Math.round((markup / costVal) * 100) : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-all">
                      
                      {/* Platform Identity */}
                      <td className="px-5 py-4.5">
                        <div className="flex items-center gap-3">
                          <PlatformIcon platform={item.platform} size={15} showBg className="shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">{item.platform}</span>
                            <span className="text-[10px] text-slate-400 font-mono uppercase mt-0.5 block">Standard Engagement Rate</span>
                          </div>
                        </div>
                      </td>

                      {/* Advertiser Price */}
                      <td className="px-5 py-4.5 font-mono">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 text-xs font-sans">₦</span>
                            <input 
                              type="number"
                              min={1}
                              step="any"
                              value={editState.cost}
                              onChange={(e) => handleInputChange(item.id, "cost", e.target.value)}
                              className="w-24 rounded-lg border border-indigo-300 px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                            />
                          </div>
                        ) : (
                          <span className="font-extrabold text-slate-800 text-sm">₦{item.costPerSlot.toLocaleString()}</span>
                        )}
                      </td>

                      {/* Earner Reward */}
                      <td className="px-5 py-4.5 font-mono">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 text-xs font-sans">₦</span>
                            <input 
                              type="number"
                              min={1}
                              step="any"
                              value={editState.earning}
                              onChange={(e) => handleInputChange(item.id, "earning", e.target.value)}
                              className="w-24 rounded-lg border border-indigo-300 px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                            />
                          </div>
                        ) : (
                          <span className="font-extrabold text-slate-800 text-sm">₦{item.earningPerSlot.toLocaleString()}</span>
                        )}
                      </td>

                      {/* Platform markup */}
                      <td className="px-5 py-4.5 font-mono">
                        <span className={`inline-flex items-center gap-1.5 font-bold rounded-lg px-2.5 py-1 text-xs ${
                          markup > 0 ? "bg-blue-50 text-blue-700" : markup === 0 ? "bg-slate-50 text-slate-600" : "bg-red-50 text-red-700"
                        }`}>
                          ₦{markup.toLocaleString()} 
                          <span className="text-[10px] font-normal text-slate-400 font-sans">
                            ({percent}%)
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4.5 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveRow(item.id)}
                              disabled={saving}
                              className="rounded-lg bg-blue-500 hover:bg-blue-600 px-2.5 py-1.5 text-[10px] font-bold text-white transition-all cursor-pointer shadow-xs"
                            >
                              Apply
                            </button>
                            <button
                              onClick={() => toggleEdit(item.id, item)}
                              className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleEdit(item.id, item)}
                            className="rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Guide Widget */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex gap-3 text-xs leading-relaxed text-slate-500 shadow-3xs">
        <ShieldCheck className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Dynamic Task Pricing Integration:</strong> These configuration rules control the core tasks engine. Whenever an advertiser launches a campaign, the total cost deducted from their balance matches the **Advertiser Price** times total slots. When earners submit approved proof of work, they receive the **Earner Reward** in their wallet. The difference is captured instantly as system markup commission.
        </div>
      </div>

    </div>
  );
}
