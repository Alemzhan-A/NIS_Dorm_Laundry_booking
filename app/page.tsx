"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-black dark:to-black relative">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Кір жууға жазылу
        </h1>
        <div className="text-sm text-gray-400 text-center mb-8">
          Баг жайлы хабарлау: <a href="https://t.me/Worb1K" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@Worb1K</a>
        </div>

        <div className="max-w-md mx-auto grid grid-cols-3 gap-4">
          {[1, 2, 3].map((floor) => (
            <Link
              key={floor}
              href={`/${floor}`}
              className="flex items-center justify-center h-32 bg-white dark:bg-zinc-900 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <span className="text-2xl font-semibold">{floor} қабат</span>
            </Link>
          ))}
        </div>
      </main>
      <footer className="absolute bottom-0 w-full py-4 text-center text-sm text-gray-400">
        made by alemzhqn
      </footer>
    </div>
  );
}
