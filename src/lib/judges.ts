import rawJudges from '@/data/judges.json';
import { Judge } from './types';

// Load and type-cast the real CourtListener data
export const allJudges: Judge[] = (rawJudges as Judge[]).map(j => ({
  ...j,
  // Placeholder accountability score (seeded from available data)
  // Real scoring engine will use case outcomes, reversal rates, etc.
  accountabilityScore: generatePlaceholderScore(j),
}));

/**
 * Temporary placeholder score based on available metadata.
 * This will be replaced by the real scoring engine that uses:
 * - Reversal rates (from PACER appeals data)
 * - Sentencing vs guidelines (from USSC data)
 * - Recidivism impact (from DOJ data)
 * - Community reviews
 * 
 * For now, we show "Data Collection" status for judges without
 * enough case data to compute a meaningful score.
 */
function generatePlaceholderScore(judge: Judge): number | undefined {
  // We don't have real case data yet — return undefined
  // to show "Pending" in the UI instead of fake numbers
  return undefined;
}

// Get unique states from the dataset
export function getStates(): string[] {
  return [...new Set(allJudges.map(j => j.state))].sort();
}

// Get unique courts
export function getCourts(): string[] {
  return [...new Set(allJudges.map(j => j.court))].sort();
}

// Search and filter judges
export function searchJudges(opts: {
  query?: string;
  state?: string;
  party?: string;
  abaRating?: string;
  sortBy?: 'name' | 'years' | 'state' | 'court';
  limit?: number;
  offset?: number;
}): { judges: Judge[]; total: number } {
  let filtered = [...allJudges];

  if (opts.query) {
    const q = opts.query.toLowerCase();
    filtered = filtered.filter(j =>
      j.name.toLowerCase().includes(q) ||
      j.court.toLowerCase().includes(q) ||
      j.courtFull.toLowerCase().includes(q) ||
      j.state.toLowerCase().includes(q) ||
      (j.education && j.education.toLowerCase().includes(q)) ||
      (j.party && j.party.toLowerCase().includes(q))
    );
  }

  if (opts.state) filtered = filtered.filter(j => j.state === opts.state);
  if (opts.party) filtered = filtered.filter(j => j.party === opts.party);
  if (opts.abaRating) filtered = filtered.filter(j => j.abaRating === opts.abaRating);

  switch (opts.sortBy) {
    case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
    case 'state': filtered.sort((a, b) => a.state.localeCompare(b.state)); break;
    case 'court': filtered.sort((a, b) => a.court.localeCompare(b.court)); break;
    case 'years': default: filtered.sort((a, b) => b.yearsServing - a.yearsServing); break;
  }

  const total = filtered.length;
  const limit = opts.limit || 20;
  const offset = opts.offset || 0;

  return {
    judges: filtered.slice(offset, offset + limit),
    total,
  };
}
