import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

interface QuestionBankPageProps {
  params: { slug: string[] };
}

// ISR: Revalidate question bank pages every 60 seconds
// Pre-rendered on edge, beats competitor load speeds
export const revalidate = 60;

// Generate static paths for the most popular subjects
export async function generateStaticParams() {
  const subjects = ["mathematics", "physics", "chemistry", "english", "iq"];
  return subjects.map((subject) => ({ slug: [subject] }));
}

export async function generateMetadata({
  params,
}: QuestionBankPageProps): Promise<Metadata> {
  const subject = params.slug[0] ?? "Question Bank";
  const formattedSubject = subject.charAt(0).toUpperCase() + subject.slice(1);

  return {
    title: `${formattedSubject} - NUST NET Question Bank | Illmora`,
    description: `Practice ${formattedSubject} MCQs for NUST NET with adaptive learning and spaced repetition. Outperform with Illmora.`,
  };
}

export default async function QuestionBankPage({
  params,
}: QuestionBankPageProps) {
  const subject = params.slug[0] ?? "";
  const chapter = params.slug[1];
  const formattedSubject = subject.charAt(0).toUpperCase() + subject.slice(1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 dark:text-gray-500">
          <Link
            href="/dashboard"
            className="hover:text-slate-700 dark:hover:text-gray-300"
          >
            Dashboard
          </Link>
          <span>/</span>
          <Link
            href="/question-bank"
            className="hover:text-slate-700 dark:hover:text-gray-300"
          >
            Question Bank
          </Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-white font-medium capitalize">
            {subject}
          </span>
          {chapter && (
            <>
              <span>/</span>
              <span className="text-slate-800 dark:text-white font-medium capitalize">
                {chapter.replace(/-/g, " ")}
              </span>
            </>
          )}
        </nav>

        <h1 className="text-3xl font-bold mb-2 capitalize">
          {formattedSubject} Question Bank
        </h1>
        <p className="text-slate-500 mb-8 dark:text-gray-500">
          Practice MCQs with adaptive difficulty. Questions you get wrong will
          appear in your Daily Mix.
        </p>

        {/* Question cards placeholder — in production, fetched from API at ISR time */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-6 dark:bg-gray-900 dark:border-gray-800"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                      {formattedSubject}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                      {i <= 2 ? "Easy" : i <= 4 ? "Medium" : "Hard"}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-gray-300 mb-4">
                    Sample question #{i} for {formattedSubject}. This will be
                    populated from your backend API with ISR caching.
                  </p>

                  {/* Optimized image for question diagrams */}
                  {i === 1 && (
                    <div className="relative w-full max-w-md aspect-video mb-4 bg-slate-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 dark:text-gray-600">
                        Question diagram placeholder (Next/Image optimized)
                      </div>
                    </div>
                  )}

                  {/* MCQ Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {["A", "B", "C", "D"].map((option) => (
                      <button
                        key={option}
                        className="text-left px-4 py-3 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-500/30"
                      >
                        <span className="font-medium mr-2">{option}.</span>
                        Option {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
