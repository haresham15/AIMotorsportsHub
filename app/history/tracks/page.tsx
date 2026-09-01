import Link from 'next/link';
import { getTrackRecords } from '@/lib/db';

export const metadata = {
  title: 'Track Records - Historical Data',
};

export default function TracksPage() {
  const tracks = getTrackRecords() as { circuitId: number; name: string; country: string; racesHosted: number }[];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <Link href="/history" className="text-blue-500 hover:underline">
          &larr; Back to History
        </Link>
        <h1 className="text-3xl font-bold">Track Records</h1>
      </div>
      
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
        <table className="min-w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3">Circuit Name</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3 text-right">Races Hosted</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((t) => (
              <tr key={t.circuitId} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-4 py-3 font-semibold">{t.name}</td>
                <td className="px-4 py-3">{t.country}</td>
                <td className="px-4 py-3 text-right font-mono">{t.racesHosted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
