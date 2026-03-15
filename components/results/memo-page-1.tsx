import { CircleCheckBig } from 'lucide-react';

interface MemoData {
  company_name: string;
  stage: string;
  industry: string;
  raising: string;
  founders: string | Array<string | { name: string; role?: string; background?: string; red_flags?: string[] }>;
  one_liner: string;
  verdict: {
    score: number;
    tier: string;
    recommendation: string;
    ai_confidence: number;
    one_line_summary: string;
    gatekeeper_alert?: {
      triggered: boolean;
      message: string;
    };
    top_deal_killers: Array<{
      title: string;
      evidence: string;
      source: string;
    }>;
  };
  score_breakdown: {
    team_equity_weighted: number;
    traction_validation_weighted: number;
    market_vertical_weighted: number;
    capital_efficiency_weighted: number;
    cap_table_terms_weighted: number;
    weighted_subtotal: number;
    penalties: number;
    final_tfi_score: number;
  };
  verified_strengths: {
    items: string[];
    however_note?: string;
  };
  penalties?: {
    applied?: string[];
    total?: number;
  };
  categories?: {
    team_equity?: { score: number; max: number };
    traction_validation?: { score: number; max: number };
    market_vertical?: { score: number; max: number };
    capital_efficiency?: { score: number; max: number };
    cap_table_terms?: { score: number; max: number };
  };
}

interface MemoPage1Props {
  memo: MemoData;
}

export function MemoPage1({ memo }: MemoPage1Props) {
  const scorePercentage = memo.verdict?.score || 0;

  return (
    <div className="space-y-6">
      {/* Main Content Box */}
      <div className="bg-memo-bg rounded-xl p-8 space-y-6">
        {/* Company Name */}
        <div>
          <h1 className="text-2xl font-medium text-black">Company Name: {memo.company_name}</h1>
        </div>

        {/* Separator Line */}
        <div className="border-t border-slate-300" />

        {/* Executive Summary Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">EXECUTIVE SUMMARY</h2>

          <div className="space-y-2">
            <div className="flex gap-2">
              <span className="text-sm text-slate-500">Stage:</span>
              <span className="text-sm text-black">{memo.stage}</span>
            </div>

            <div className="flex gap-2">
              <span className="text-sm text-slate-500">Industry:</span>
              <span className="text-sm text-black">{memo.industry}</span>
            </div>

            <div className="flex gap-2">
              <span className="text-sm text-slate-500">Raising:</span>
              <span className="text-sm text-black">{memo.raising}</span>
            </div>

            <div className="flex gap-2">
              <span className="text-sm text-slate-500">Founders:</span>
              <span className="text-sm text-black">
                {Array.isArray(memo.founders) && memo.founders.length > 0
                  ? memo.founders.map((f: any) => typeof f === 'object' ? f.name : f).filter(Boolean).join(', ')
                  : typeof memo.founders === 'string' && memo.founders.trim() !== ''
                  ? memo.founders
                  : 'Not disclosed'}
              </span>
            </div>

            <div className="flex gap-2">
              <span className="text-sm text-slate-500">One-liner:</span>
              <span className="text-sm text-black">{memo.one_liner}</span>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-slate-300" />

        {/* Section 1: The Verdict */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SECTION 1: THE VERDICT</h2>

          {/* Score Display - Left Aligned */}
          <div className="mb-2">
            <div className="text-5xl font-bold text-black">{memo.verdict?.score || 0}</div>
            <div className="text-sm text-slate-500">out of 100</div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-black rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-400 transition-all rounded-full"
              style={{ width: `${scorePercentage}%` }}
            />
          </div>

          {/* Tier, Recommendation, AI Confidence - One Line */}
          <div className="flex justify-between items-center pt-2">
            <div className="flex gap-2">
              <span className="text-sm text-slate-500">Tier:</span>
              <span className="text-sm text-black">{memo.verdict?.tier}</span>
            </div>

            <div className="flex gap-2">
              <span className="text-sm text-slate-500">Recommendation:</span>
              <span className="text-sm text-black">{memo.verdict?.recommendation}</span>
            </div>

            <div className="flex gap-2">
              <span className="text-sm text-slate-500">AI Confidence:</span>
              <span className="text-sm text-black">{memo.verdict?.ai_confidence || 0}%</span>
            </div>
          </div>
        </div>

        {/* Gatekeeper Alert */}
        {memo.verdict?.gatekeeper_alert?.triggered && (
          <div className="border border-black rounded-lg p-6">
            <p className="text-sm font-semibold text-black mb-2">Gatekeeper Alert</p>
            <p className="text-sm text-black leading-relaxed">{memo.verdict.gatekeeper_alert.message}</p>
          </div>
        )}

        {/* Top Deal Killers */}
        {memo.verdict?.top_deal_killers && memo.verdict.top_deal_killers.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">TOP DEAL KILLERS</h2>
            <ul className="space-y-2">
              {memo.verdict.top_deal_killers.map((killer, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-sm text-black">•</span>
                  <div className="flex-1">
                    <span className="text-sm text-black font-medium">{killer.title}:</span>{' '}
                    <span className="text-sm text-black">{killer.evidence}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 2: Score Breakdown */}
        <div className="bg-white rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SECTION 2: SCORE BREAKDOWN</h2>

          <div className="space-y-3">
            {[
              { 
                name: 'Team Equity', 
                score: memo.categories?.team_equity?.score ?? 0, 
                max: memo.categories?.team_equity?.max ?? 30 
              },
              {
                name: 'Traction Validation',
                score: memo.categories?.traction_validation?.score ?? 0,
                max: memo.categories?.traction_validation?.max ?? 15,
              },
              {
                name: 'Market Vertical',
                score: memo.categories?.market_vertical?.score ?? 0,
                max: memo.categories?.market_vertical?.max ?? 20,
              },
              {
                name: 'Capital Efficiency',
                score: memo.categories?.capital_efficiency?.score ?? 0,
                max: memo.categories?.capital_efficiency?.max ?? 25,
              },
              {
                name: 'Cap Table Terms',
                score: memo.categories?.cap_table_terms?.score ?? 0,
                max: memo.categories?.cap_table_terms?.max ?? 10,
              },
            ].map((cat) => {
              const safeMax = cat.max > 0 ? cat.max : 1;
              const percentage = (cat.score / safeMax) * 100;

              return (
                <div key={cat.name} className="flex items-center gap-4">
                  <p className="text-sm text-black w-40">{cat.name}</p>
                  <div className="flex-1 h-2 bg-slate-400 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                  <p className="text-sm text-black w-16 text-right">
                    {cat.score} / {cat.max}
                  </p>
                </div>
              );
            })}

            {/* Separator Line */}
            <div className="border-t border-slate-300 my-4" />

            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-black">Weighted Subtotal</p>
              <p className="text-sm text-black">{memo.score_breakdown?.weighted_subtotal ?? 0}</p>
            </div>

            {/* Penalties */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-black">Penalties</p>
              <p className="text-sm text-black">-{memo.penalties?.total ?? memo.score_breakdown?.penalties ?? 0}</p>
            </div>

            {/* Final Score */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-black">Final Score</p>
              <p className="text-lg font-bold text-black">{memo.score_breakdown?.final_tfi_score ?? memo.verdict?.score ?? 0}/100</p>
            </div>
          </div>
        </div>

        {/* Section 3: Verified Strengths */}
        {memo.verified_strengths && memo.verified_strengths.items && memo.verified_strengths.items.length > 0 && (
          <div className="bg-white rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SECTION 3: CONSOLIDATED SUMMARY</h2>

            <ul className="space-y-2">
              {memo.verified_strengths.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CircleCheckBig className="w-5 h-5 text-black shrink-0 mt-0.5" />
                  <p className="text-sm text-black leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>

            {/* Separator Line */}
            <div className="border-t border-slate-300" />

            {memo.verified_strengths.however_note && (
              <div className="border bg-memo-bg rounded-lg p-4">
                <p className="text-sm text-black">
                  <span className="font-semibold">However:</span><br /> {memo.verified_strengths.however_note}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}