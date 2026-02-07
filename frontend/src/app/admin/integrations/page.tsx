"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Plus, Trash2, Globe, Server, CheckCircle, XCircle } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  config: any;
}

interface Webhook {
  id: string;
  event_type: string;
  target_url: string;
  is_active: boolean;
}

export default function IntegrationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"integrations" | "webhooks">("integrations");
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple Form State for creation
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState("LMS");
  const [newItemUrl, setNewItemUrl] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const token = await user?.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const intRes = await fetch("http://localhost:8000/api/v1/integrations/", { headers });
        if (intRes.ok) setIntegrations(await intRes.json());

        const hookRes = await fetch("http://localhost:8000/api/v1/webhooks/", { headers });
        if (hookRes.ok) setWebhooks(await hookRes.json());
        
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadData();
  }, [user]);

  const handleCreate = async () => {
      // Stub for creation logic
      alert("Feature stub: This would POST to /api/v1/" + activeTab);
  };

  return (
    <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="ilmora-noise relative">
        <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
        <div className="relative z-10 p-6">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">System Integrations</h1>
              <p className="text-slate-500 dark:text-white/60">
                Connect Ilmora to external LMS and event listeners.
              </p>
            </div>
          </header>

      {/* Tabs */}
        <div className="mb-6 border-b border-slate-200 dark:border-white/10">
          <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("integrations")}
            className={`${activeTab === "integrations" ? "border-slate-900 text-slate-900 dark:border-white dark:text-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-white/60 dark:hover:text-white"} whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium`}
              >
                  LMS & Tools
              </button>
              <button
                onClick={() => setActiveTab("webhooks")}
            className={`${activeTab === "webhooks" ? "border-slate-900 text-slate-900 dark:border-white dark:text-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-white/60 dark:hover:text-white"} whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium`}
              >
                  Webhooks
              </button>
          </nav>
      </div>

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <h3 className="mb-4 text-lg font-medium">Add New {activeTab === "integrations" ? "Integration" : "Webhook"}</h3>
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
              <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-white/70">Type</label>
                  {activeTab === "integrations" ? (
                      <select 
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white/90 py-2 pl-3 pr-10 text-base focus:border-amber-300 focus:outline-none focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white sm:text-sm"
                        value={newItemType}
                        onChange={(e) => setNewItemType(e.target.value)}
                      >
                          <option value="LMS">Learning Management System</option>
                          <option value="PAYMENT">Payment Gateway</option>
                          <option value="SSO">Single Sign-On</option>
                      </select>
                  ) : (
                      <select 
                        className="mt-1 block w-full rounded-md border border-slate-200 bg-white/90 py-2 pl-3 pr-10 text-base focus:border-amber-300 focus:outline-none focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white sm:text-sm"
                        value={newItemType}
                        onChange={(e) => setNewItemType(e.target.value)}
                      >
                          <option value="pack.published">pack.published</option>
                          <option value="alert.raised">alert.raised</option>
                      </select>
                  )}
              </div>
              <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-white/70">
                      {activeTab === "integrations" ? "Name" : "Target URL"}
                  </label>
                  <input 
                    type="text" 
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white/90 px-3 py-2 shadow-sm focus:border-amber-300 focus:outline-none focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white sm:text-sm"
                    placeholder={activeTab === "integrations" ? "e.g. Canvas NUST" : "https://api.mysite.com/webhook"}
                    value={activeTab === "integrations" ? newItemName : newItemUrl}
                    onChange={(e) => activeTab === "integrations" ? setNewItemName(e.target.value) : setNewItemUrl(e.target.value)}
                  />
              </div>
              <div>
                  <button 
                    onClick={handleCreate}
                  className="inline-flex w-full justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                      <Plus className="h-5 w-5 mr-2" />
                      Create
                  </button>
              </div>
          </div>
      </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {activeTab === "integrations" && integrations.map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center">
                      <Server className="mr-3 h-6 w-6 text-slate-400 dark:text-white/40" />
                          <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-sm text-slate-500 dark:text-white/60">{item.type}</p>
                          </div>
                      </div>
                      <div className="flex items-center">
                      {item.is_active ? <CheckCircle className="mr-4 h-5 w-5 text-emerald-500" /> : <XCircle className="mr-4 h-5 w-5 text-slate-300 dark:text-white/20" />}
                      <button className="text-rose-600 hover:text-rose-700"><Trash2 className="h-5 w-5" /></button>
                      </div>
                  </li>
              ))}
              {activeTab === "webhooks" && webhooks.map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center">
                      <Globe className="mr-3 h-6 w-6 text-slate-400 dark:text-white/40" />
                          <div className="overflow-hidden">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{item.event_type}</p>
                        <p className="max-w-xs truncate text-sm text-slate-500 dark:text-white/60">{item.target_url}</p>
                          </div>
                      </div>
                      <div className="flex items-center">
                      {item.is_active ? <CheckCircle className="mr-4 h-5 w-5 text-emerald-500" /> : <XCircle className="mr-4 h-5 w-5 text-slate-300 dark:text-white/20" />}
                      <button className="text-rose-600 hover:text-rose-700"><Trash2 className="h-5 w-5" /></button>
                      </div>
                  </li>
              ))}
              {((activeTab === "integrations" && integrations.length === 0) || (activeTab === "webhooks" && webhooks.length === 0)) && (
                   <li className="px-6 py-8 text-center text-slate-500 dark:text-white/60">
                       No {activeTab} configured yet.
                   </li>
              )}
          </ul>
      </div>
            </div>
            </div>
          </div>
  );
}
