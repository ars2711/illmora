"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Lock, Star, BookOpen, ShoppingBag } from "lucide-react";

interface StudyPack {
  id: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  author_name: string;
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const [packs, setPacks] = useState<StudyPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPacks() {
      try {
        const token = await user?.getIdToken();
        const res = await fetch("http://localhost:8000/api/v1/marketplace/packs?scope=institution", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            setPacks(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadPacks();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
                <p className="text-sm text-gray-500">Premium Notes & Study Packs from Top Students</p>
            </div>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium">
                Create Study Pack
            </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading ? (
            <div className="text-center py-20 text-gray-400">Loading Marketplace...</div>
        ) : packs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg shadow">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No packs available yet</h3>
                <p className="mt-1 text-sm text-gray-500">Be the first to publish your notes!</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packs.map((pack) => (
                    <div key={pack.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                                    <BookOpen className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            {pack.author_name}
                                        </dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">{pack.title}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-5 py-3">
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">{pack.description}</p>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center text-yellow-500">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="ml-1 text-sm text-gray-600 font-medium">{pack.rating > 0 ? pack.rating : 'New'}</span>
                                </div>
                                <div className="text-indigo-600 font-bold">
                                    {pack.price > 0 ? `PKR ${pack.price}` : 'Free'}
                                </div>
                            </div>
                            <button className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
