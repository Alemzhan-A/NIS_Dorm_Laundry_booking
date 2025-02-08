"use client";

import { TimeTable } from "@/components/TimeTable";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-black dark:to-black">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Кір жууға жазылу
        </h1>
        <div className="text-xs text-gray-400 text-center mb-8">
          баг жайлы хабарлау: <a href="https://t.me/Worb1K" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@Worb1K</a>
        </div>
        <TimeTable />
      </main>
    </div>
  );
}
