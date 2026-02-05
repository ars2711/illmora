"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, logOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logOut();
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-indigo-900 via-blue-900 to-black text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30 text-black dark:text-white">
          Ilmora &nbsp;
          <code className="font-mono font-bold">Phase 2: Authentication</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-emerald-400">
                Logged in as {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-6 py-3 text-sm font-medium text-indigo-900 bg-white rounded-md hover:bg-gray-100"
            >
              Sign In / Register
            </Link>
          )}
        </div>
      </div>

      <div className="relative flex flex-col place-items-center mb-10 text-center mt-10">
        <h1 className="text-6xl font-bold tracking-tighter mb-4">ILMORA</h1>
        <p className="text-xl text-gray-300 max-w-2xl">
          The world's most powerful ethical AI learning operating system.
          <br />
          Student-first. Offline-ready. Secure.
        </p>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left gap-4">
        <Link
          href="/chat"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Enter Chat{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Secure, offline-first chat. Requires Login.
          </p>
        </Link>

        <Link
          href="/graph"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>Knowledge Graph</h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Visualize your personalized concept tree. Requires Login.
          </p>
        </Link>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors border-neutral-700 bg-neutral-800/20">
          <h2 className={`mb-3 text-2xl font-semibold`}>Analytics</h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            View long-term memory growth (Coming Phase 1).
          </p>
        </div>
      </div>
    </main>
  );
}
