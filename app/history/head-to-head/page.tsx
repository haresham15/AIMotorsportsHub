import Link from 'next/link';
import { getDrivers, getHeadToHead } from '@/lib/db';

export const metadata = {
  title: 'Driver Head-to-Head - Historical Data',
};

export default async function HeadToHeadPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Fix for Next.js 15: searchParams is a Promise
  const resolvedParams = await Promise.resolve(searchParams);
  
  const drivers = getDrivers() as { driverId: number; forename: string; surname: string; nationality: string }[];
  
  const d1Param = resolvedParams.d1 as string;
  const d2Param = resolvedParams.d2 as string;
  
  let d1Id = d1Param ? parseInt(d1Param, 10) : null;
  let d2Id = d2Param ? parseInt(d2Param, 10) : null;
  
  let comparisonData = null;
  let d1Info = null;
  let d2Info = null;

  if (d1Id && d2Id && !isNaN(d1Id) && !isNaN(d2Id)) {
    comparisonData = getHeadToHead(d1Id, d2Id) as any;
    d1Info = drivers.find(d => d.driverId === d1Id);
    d2Info = drivers.find(d => d.driverId === d2Id);
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <Link href="/history" className="text-blue-500 hover:underline">
          &larr; Back to History
        </Link>
        <h1 className="text-3xl font-bold">Driver Head-to-Head</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
        <form method="GET" action="/history/head-to-head" className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium mb-1">Driver 1</label>
            <select name="d1" defaultValue={d1Id || ""} className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700">
              <option value="" disabled>Select a driver</option>
              {drivers.map(d => (
                <option key={d.driverId} value={d.driverId}>{d.forename} {d.surname} ({d.nationality})</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center justify-center font-bold text-xl pb-2 px-2">VS</div>

          <div className="flex-1 w-full">
            <label className="block text-sm font-medium mb-1">Driver 2</label>
            <select name="d2" defaultValue={d2Id || ""} className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700">
              <option value="" disabled>Select a driver</option>
              {drivers.map(d => (
                <option key={d.driverId} value={d.driverId}>{d.forename} {d.surname} ({d.nationality})</option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors">
            Compare
          </button>
        </form>
      </div>

      {comparisonData && d1Info && d2Info && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold">{d1Info.forename} {d1Info.surname}</h2>
            </div>
            <div className="flex flex-col justify-center text-gray-500">
              <span className="text-sm uppercase tracking-wide">Races Together</span>
              <span className="text-3xl font-bold text-gray-800 dark:text-gray-200">{comparisonData.racesTogether}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{d2Info.forename} {d2Info.surname}</h2>
            </div>
          </div>

          <div className="grid grid-cols-3 text-center gap-4">
            {/* Finished Ahead */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex flex-col justify-center border border-blue-100 dark:border-blue-800">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{comparisonData.driver1.ahead}</span>
            </div>
            <div className="flex flex-col justify-center font-semibold text-gray-600 dark:text-gray-400">
              Finished Ahead
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex flex-col justify-center border border-red-100 dark:border-red-800">
              <span className="text-3xl font-bold text-red-600 dark:text-red-400">{comparisonData.driver2.ahead}</span>
            </div>

            {/* Total Points (in shared races) */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex flex-col justify-center border border-blue-100 dark:border-blue-800">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{comparisonData.driver1.points}</span>
            </div>
            <div className="flex flex-col justify-center font-semibold text-gray-600 dark:text-gray-400">
              Points Scored (Shared Races)
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex flex-col justify-center border border-red-100 dark:border-red-800">
              <span className="text-3xl font-bold text-red-600 dark:text-red-400">{comparisonData.driver2.points}</span>
            </div>

            {/* Shared Race Wins */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex flex-col justify-center border border-blue-100 dark:border-blue-800">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{comparisonData.driver1.wins}</span>
            </div>
            <div className="flex flex-col justify-center font-semibold text-gray-600 dark:text-gray-400">
              Shared Race Wins
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex flex-col justify-center border border-red-100 dark:border-red-800">
              <span className="text-3xl font-bold text-red-600 dark:text-red-400">{comparisonData.driver2.wins}</span>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Recent Shared Races</h3>
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
              <table className="min-w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Race</th>
                    <th className="px-4 py-3 text-center">{d1Info.surname} Pos</th>
                    <th className="px-4 py-3 text-center">{d2Info.surname} Pos</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.history.slice(0, 10).map((race: any, idx: number) => (
                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="px-4 py-3 font-semibold">{race.year}</td>
                      <td className="px-4 py-3">{race.raceName}</td>
                      <td className={`px-4 py-3 text-center font-mono ${race.d1_pos < race.d2_pos ? 'text-green-600 dark:text-green-400 font-bold' : ''}`}>
                        {race.d1_pos || 'DNF'}
                      </td>
                      <td className={`px-4 py-3 text-center font-mono ${race.d2_pos < race.d1_pos ? 'text-green-600 dark:text-green-400 font-bold' : ''}`}>
                        {race.d2_pos || 'DNF'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {comparisonData.history.length > 10 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Showing 10 most recent out of {comparisonData.history.length} races.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
