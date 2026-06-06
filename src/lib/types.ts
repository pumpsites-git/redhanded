export interface Judge {
  id: string;
  clId: number;
  name: string;
  slug: string;
  gender: string;
  court: string;
  courtFull: string;
  courtId: string;
  courtType: 'federal_district' | 'federal_appellate' | 'federal_other';
  jurisdiction: string;
  state: string;
  appointedBy: string | null;
  party: string | null;
  yearStarted: number | null;
  yearsServing: number;
  education: string | null;
  abaRating: string | null;
  isActive: boolean;
  confirmationVotesYes: number | null;
  confirmationVotesNo: number | null;
  race: string[];
  hasPhoto: boolean;
  photoUrl: string | null;
  // Computed fields (placeholder until real case data)
  accountabilityScore?: number;
  stats?: JudgeStats;
}

export interface JudgeStats {
  totalCases: number;
  sentencingRate: number;
  avgSentenceVsGuideline: number;
  reversalRate: number;
  bailDenialRate: number;
  recidivismRate?: number;
  caseloadPerYear: number;
  avgCaseResolutionDays: number;
}

export interface CommunityReview {
  id: string;
  judgeId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  role: 'attorney' | 'defendant' | 'victim' | 'juror' | 'observer';
  date: string;
  upvotes: number;
  downvotes: number;
  wouldReElect: boolean;
}
