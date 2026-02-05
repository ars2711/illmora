"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Book, Clock, AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";

interface ProfileData {
  full_name: string;
  profile_completed: boolean;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("http://localhost:8000/api/v1/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.profile_completed) {
            router.push("/onboarding");
            return;
          }
          setProfile(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    checkProfile();
  }, [user, router]);

  if (loading) return <div className="p-6">Loading Ilmora...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name?.split(" ")[0] || "Scholar"}.
        </h1>
        <p className="text-gray-500">Ready to master your concepts today?</p>
      </header>

      {/* Weak Areas Summary */}
      <section className="mb-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900">
              Focus Area Detected
            </h3>
            <p className="text-sm text-amber-800 mt-1">
              You seem to be struggling with{" "}
              <span className="font-bold">Recursion</span> based on your last
              chat. Recommended: 15 min review.
            </p>
            <button className="mt-3 text-sm font-medium text-amber-700 hover:text-amber-900 underline">
              Start Review Session
            </button>
          </div>
        </div>
      </section>

      {/* Subjects Grid */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Subjects</h2>
          <Link
            href="/onboarding"
            className="text-sm text-indigo-600 font-medium"
          >
            Edit
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Example Cards - Phase 1 MVP Mock */}
          {["Data Structures", "Linear Algebra", "Psychology"].map(
            (subj, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Book className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium text-gray-900">{subj}</h3>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-gray-500">
                    3 notes • 85% mastery
                  </span>
                </div>
              </div>
            ),
          )}

          <Link
            href="/upload"
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
          >
            <Plus className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Add Material</span>
          </Link>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Chat Session: Linked Lists
              </p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Uploaded "Lecture_05.pdf"
              </p>
              <p className="text-xs text-gray-500">Yesterday</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
