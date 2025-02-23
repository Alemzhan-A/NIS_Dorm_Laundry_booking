import { TimeTable } from "@/components/TimeTable";
import { Metadata } from 'next';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const floor = parseInt(slug);

  return {
    title: `${floor} қабат - Кір жууға жазылу`,
    description: 'NIS Semey жатақхана кір жуу жүйесі',
  };
}

interface PageProps {
  params: Params;
  searchParams: SearchParams;
}

export default async function FloorPage({ params }: PageProps) {
  const { slug } = await params;
  const floor = parseInt(slug);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-black dark:to-black relative">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          {floor} қабат - Кір жууға жазылу
        </h1>
        <div className="text-sm text-gray-400 text-center mb-8">
          Баг жайлы хабарлау: <a href="https://t.me/Worb1K" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@Worb1K</a>
        </div>
        <TimeTable floor={floor} />
      </main>
      <footer className="absolute bottom-0 w-full py-4 text-center text-sm text-gray-400">
        made by alemzhqn
      </footer>
    </div>
  );
}
