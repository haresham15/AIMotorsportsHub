import Link from 'next/link';

export const metadata = {
  title: 'Historical Data - AIMotorsportsHub',
};

export default function HistoryPage() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-4xl font-bold mb-6">Historical Data & Statistics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/history/seasons" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-2">Past Seasons</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Explore final standings and race results from every season since 1950.
          </p>
        </Link>
        
        <Link href="/history/head-to-head" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-2">Driver Head-to-Head</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Compare any two drivers who raced against each other in the same Grand Prix.
          </p>
        </Link>
        
        <Link href="/history/tracks" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-2">Track Records</h2>
          <p className="text-gray-600 dark:text-gray-400">
            View statistics for every circuit that has hosted a Grand Prix.
          </p>
        </Link>
      </div>
    </div>
  );
}
