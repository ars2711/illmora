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
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">System Integrations</h1>
            <p className="text-gray-500">Connect Ilmora to external LMS and Event Listeners</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("integrations")}
                className={`${activeTab === "integrations" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                  LMS & Tools
              </button>
              <button
                onClick={() => setActiveTab("webhooks")}
                className={`${activeTab === "webhooks" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                  Webhooks
              </button>
          </nav>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Add New {activeTab === "integrations" ? "Integration" : "Webhook"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  {activeTab === "integrations" ? (
                      <select 
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        value={newItemType}
                        onChange={(e) => setNewItemType(e.target.value)}
                      >
                          <option value="LMS">Learning Management System</option>
                          <option value="PAYMENT">Payment Gateway</option>
                          <option value="SSO">Single Sign-On</option>
                      </select>
                  ) : (
                      <select 
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        value={newItemType}
                        onChange={(e) => setNewItemType(e.target.value)}
                      >
                          <option value="pack.published">pack.published</option>
                          <option value="alert.raised">alert.raised</option>
                      </select>
                  )}
              </div>
              <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                      {activeTab === "integrations" ? "Name" : "Target URL"}
                  </label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder={activeTab === "integrations" ? "e.g. Canvas NUST" : "https://api.mysite.com/webhook"}
                    value={activeTab === "integrations" ? newItemName : newItemUrl}
                    onChange={(e) => activeTab === "integrations" ? setNewItemName(e.target.value) : setNewItemUrl(e.target.value)}
                  />
              </div>
              <div>
                  <button 
                    onClick={handleCreate}
                    className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                  >
                      <Plus className="h-5 w-5 mr-2" />
                      Create
                  </button>
              </div>
          </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
              {activeTab === "integrations" && integrations.map((item) => (
                  <li key={item.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                          <Server className="h-6 w-6 text-gray-400 mr-3" />
                          <div>
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-500">{item.type}</p>
                          </div>
                      </div>
                      <div className="flex items-center">
                          {item.is_active ? <CheckCircle className="h-5 w-5 text-green-500 mr-4" /> : <XCircle className="h-5 w-5 text-gray-300 mr-4" />}
                          <button className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5" /></button>
                      </div>
                  </li>
              ))}
              {activeTab === "webhooks" && webhooks.map((item) => (
                  <li key={item.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                          <Globe className="h-6 w-6 text-gray-400 mr-3" />
                          <div className="overflow-hidden">
                              <p className="text-sm font-medium text-gray-900">{item.event_type}</p>
                              <p className="text-sm text-gray-500 truncate max-w-xs">{item.target_url}</p>
                          </div>
                      </div>
                      <div className="flex items-center">
                          {item.is_active ? <CheckCircle className="h-5 w-5 text-green-500 mr-4" /> : <XCircle className="h-5 w-5 text-gray-300 mr-4" />}
                          <button className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5" /></button>
                      </div>
                  </li>
              ))}
              {((activeTab === "integrations" && integrations.length === 0) || (activeTab === "webhooks" && webhooks.length === 0)) && (
                   <li className="px-6 py-8 text-center text-gray-500">
                       No {activeTab} configured yet.
                   </li>
              )}
          </ul>
      </div>
    </div>
  );
}
