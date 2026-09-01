import Link from 'next/link';
import { getSeasonDetails } from '@/lib/db';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { year: string } }) {
  // Fix for Next.js 15: params is now a Promise
  const resolvedParams = await Promise.resolve(params);
  return {
    title: `${resolvedParams.year} Season - Historical Data`,
  };
}

export default async function SeasonDetailsPage({ params }: { params: { year: string } }) {
  // Fix for Next.js 15: params is now a Promise
  const resolvedParams = await Promise.resolve(params);
  const year = parseInt(resolvedParams.year, 10);
  
  if (isNaN(year)) {
    notFound();
  }

  const { races, standings } = getSeasonDetails(year) as {
    races: any[];
    standings: any[];
  };

  if (races.length === 0) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex items-center space-x-4 mb-4">
        <Link href="/history/seasons" className="text-blue-500 hover:underline">
          &larr; Back to Seasons
        </Link>
        <h1 className="text-3xl font-bold">{year} Formula 1 Season</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Final Championship Standings</h2>
          {standings.length > 0 ? (
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
              <table className="min-w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3">Pos</th>
                    <th className="px-4 py-3">Driver</th>
                    <th className="px-4 py-3">Constructor</th>
                    <th className="px-4 py-3 text-right">Pts</th>
                    <th className="px-4 py-3 text-right">Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, idx) => (
                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="px-4 py-3 font-semibold">{s.position}</td>
                      <td className="px-4 py-3">{s.forename} {s.surname}</td>
                      <td className="px-4 py-3">{s.constructorName || '-'}</td>
                      <td className="px-4 py-3 text-right font-mono">{s.points}</td>
                      <td className="px-4 py-3 text-right font-mono">{s.wins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">Standings data not available for this season.</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Race Calendar</h2>
          <div className="space-y-3">
            {races.map((r) => (
              <div key={r.raceId} className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded shadow border dark:border-gray-700">
                <div>
                  <span className="text-sm font-semibold text-gray-500 block">Round {r.round}</span>
                  <span className="text-lg font-bold">{r.raceName}</span>
                  <span className="block text-sm text-gray-600 dark:text-gray-400">{r.circuitName}, {r.country}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm">{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
