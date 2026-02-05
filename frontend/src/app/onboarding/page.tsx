"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [curricula, setCurricula] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    curriculum_id: "",
    degree: "",
    semester: "",
    subjects: "",
    preferred_language: "English",
    career_goals: "",
  });

  useEffect(() => {
    async function getCurricula() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/curriculum/");
        if (res.ok) {
          const data = await res.json();
          setCurricula(data);
          // Seed if empty (dev quality of life)
          if (data.length === 0) {
            const seedRes = await fetch(
              "http://localhost:8000/api/v1/curriculum/seed",
              { method: "POST" },
            );
            if (seedRes.ok) setCurricula(await seedRes.json());
          }
        }
      } catch (e) {
        console.error("Failed to load curricula", e);
      }
    }
    getCurricula();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await user?.getIdToken();
      const subjectsArray = formData.subjects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      
      const careerArray = formData.career_goals
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("http://localhost:8000/api/v1/users/me/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          subjects: subjectsArray,
          career_goals: careerArray
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      // Success
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome to Ilmora
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Let's tailor the experience to your academic needs.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Curriculum Selection */}
            <div>
              <label
                htmlFor="curriculum_id"
                className="block text-sm font-medium text-gray-700"
              >
                Curriculum / Board
              </label>
              <div className="mt-1">
                <select
                  id="curriculum_id"
                  name="curriculum_id"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.curriculum_id}
                  onChange={handleChange}
                >
                  <option value="" disabled>
                    Select your curriculum...
                  </option>
                  {curricula.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  This tailors your learning path and assessment style.
                </p>
              </div>
            </div>

            {/* Degree */}
            <div>
              <label
                htmlFor="degree"
                className="block text-sm font-medium text-gray-700"
              >
                Degree Program
              </label>
              <div className="mt-1">
                <input
                  id="degree"
                  name="degree"
                  type="text"
                  placeholder="e.g. BS Computer Science"
                  required
                  value={formData.degree}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Semester */}
            <div>
              <label
                htmlFor="semester"
                className="block text-sm font-medium text-gray-700"
              >
                Current Semester
              </label>
              <div className="mt-1">
                <select
                  id="semester"
                  name="semester"
                  required
                  value={formData.semester}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={`${n}th Semester`}>
                      {n}th Semester
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subjects */}
            <div>
              <label
                htmlFor="subjects"
                className="block text-sm font-medium text-gray-700"
              >
                Current Subjects
              </label>
              <p className="text-xs text-gray-500 mb-1">Comma separated</p>
              <div className="mt-1">
                <input
                  id="subjects"
                  name="subjects"
                  type="text"
                  placeholder="e.g. DSA, Linear Algebra, Psychology"
                  required
                  value={formData.subjects}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Language */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Language
              </span>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="preferred_language"
                    value="English"
                    checked={formData.preferred_language === "English"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  English
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="preferred_language"
                    value="Urdu"
                    checked={formData.preferred_language === "Urdu"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Urdu
                </label>
              </div>
            </div>

            {/* Learning Style */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">
                Learning Style
              </span>
              <div className="flex flex-col gap-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="learning_style"
                    value="Visual"
                    checked={formData.learning_style === "Visual"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm">Visual (Diagrams, Graphs)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="learning_style"
                    value="Socratic"
                    checked={formData.learning_style === "Socratic"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm">Socratic (Ask me questions)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="learning_style"
                    value="Explain Like I'm 5"
                    checked={formData.learning_style === "Explain Like I'm 5"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm">ELI5 (Simple Analogies)</span>
                </label>
              </div>
            </div>

            {/* Career Goals */}
            <div>
              <label
                htmlFor="career_goals"
                className="block text-sm font-medium text-gray-700"
              >
                Dream Career (Comma separated)
              </label>
              <div className="mt-1">
                <input
                  id="career_goals"
                  name="career_goals"
                  type="text"
                  placeholder="e.g. AI Architect, Civil Engineer, Product Manager"
                  value={formData.career_goals}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? "Saving Profile..." : "Start Learning"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
