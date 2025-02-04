"use client";

import { TimeTable } from "@/components/TimeTable";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Кір жууға жазылу
        </h1>
        <TimeTable />
      </main>
    </div>
  );
}
