import type { Metadata } from 'next';
import DrillDownMap from '@/components/DrillDownMap';

export const metadata: Metadata = {
  title: 'Interactive Sentencing Map — RedHanded',
  description:
    'Drill down from US states to Florida counties to individual judges. Explore sentencing leniency across every jurisdiction with our interactive map.',
  openGraph: {
    title: 'Interactive Sentencing Map — RedHanded',
    description:
      'Drill down from the US map to Florida counties to individual judges. Explore who is actually being soft on crime.',
  },
};

export default function MapPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🗺️</span>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Interactive Sentencing Map
          </h1>
        </div>
        <p className="text-gray-400 text-base max-w-2xl">
          Drill into US states, then counties, then individual judges. See who is tough on
          crime — and who keeps letting violent offenders walk.
        </p>
        <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-400">Click any state to explore</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-400">Green = stricter sentencing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-400">Red = more lenient</span>
          </div>
        </div>
      </div>

      {/* Map panel */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4 md:p-6 shadow-2xl">
        <DrillDownMap />
      </div>

      {/* Info footer */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-black text-white mb-1">66</div>
          <div className="text-gray-400">Florida counties analyzed</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-black text-white mb-1">657+</div>
          <div className="text-gray-400">Individual judges profiled</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-black text-white mb-1">3.6M+</div>
          <div className="text-gray-400">Sentencing records reviewed</div>
        </div>
      </div>
    </main>
  );
}
