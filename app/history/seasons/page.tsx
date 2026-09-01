import Link from 'next/link';
import { getSeasons } from '@/lib/db';

export const metadata = {
  title: 'Seasons - Historical Data',
};

export default function SeasonsPage() {
  const seasons = getSeasons() as { year: number, url: string }[];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <Link href="/history" className="text-blue-500 hover:underline">
          &larr; Back to History
        </Link>
        <h1 className="text-3xl font-bold">Past Seasons</h1>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {seasons.map((season) => (
          <Link
            key={season.year}
            href={`/history/seasons/${season.year}`}
            className="block text-center py-4 px-2 bg-white dark:bg-gray-800 rounded shadow hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border dark:border-gray-700 font-semibold text-lg"
          >
            {season.year}
          </Link>
        ))}
      </div>
    </div>
  );
}
