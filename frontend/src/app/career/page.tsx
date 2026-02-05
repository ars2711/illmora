"use client";

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import ReactMarkdown from "react-markdown"; // Assuming installed or will be
import { Target, Map, ArrowRight, Loader } from "lucide-react";

interface RoadmapResponse {
  roadmap_content: string;
  suggested_modules: string[];
  estimated_time: string;
}

export default function CareerPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [customGoal, setCustomGoal] = useState("");

  const generateRoadmap = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("http://localhost:8000/api/v1/career/roadmap", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            target_role: customGoal || undefined
        }),
      });
      
      if (res.ok) {
        setRoadmap(await res.json());
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate roadmap.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-indigo-700 pb-32">
        <header className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white">Career Intelligence</h1>
            <p className="mt-2 text-indigo-100">AI-driven strategy to bridge your degree with industry needs.</p>
          </div>
        </header>
      </div>

      <main className="-mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          
          {/* Controls */}
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Target Role (Optional override)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Target className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3" 
                            placeholder="e.g. Full Stack Developer, Data Scientist..." 
                            value={customGoal}
                            onChange={(e) => setCustomGoal(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <button 
                        onClick={generateRoadmap}
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                Analyzing Syllabus...
                            </>
                        ) : (
                            <>
                                <Map className="-ml-1 mr-2 h-5 w-5" />
                                Generate Roadmap
                            </>
                        )}
                    </button>
                </div>
            </div>
          </div>

          {/* Results */}
          {roadmap && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Personalized Strategy
                      </h3>
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Est. Time: {roadmap.estimated_time}
                      </span>
                  </div>
                  <div className="px-6 py-8 prose prose-indigo max-w-none">
                       <ReactMarkdown>{roadmap.roadmap_content}</ReactMarkdown>
                  </div>
              </div>
          )}
        </div>
      </main>
    </div>
  );
}
