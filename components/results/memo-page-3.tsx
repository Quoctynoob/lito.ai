interface MemoData {
  unverified_claims?: Array<{
    claim: string;
    reason_unverified: string;
  }>;
  unverified_why_it_matters?: string;
  penalties?: {
    applied?: string[];
    total?: number;
  };
  next_steps?: {
    what_to_request?: {
      [key: string]: string[];
    };
    interview_questions?: {
      [key: string]: string[];
    };
  };
  recommendation_rationale?: string;
  claim_verifications?: {
    verified_count?: number;
    disputed_count?: number;
    unverified_count?: number;
    claims?: Array<{
      claimed_in_deck?: string;
      verified_via_search?: string;
      verdict?: string;
      source?: string;
      source_url?: string;
      vs_benchmark?: string;
    }>;
  };
  confidence_score?: {
    score?: number;
    formula_breakdown?: {
      [key: string]: number;
    };
  };
}

interface MemoPage3Props {
  memo: MemoData;
}

export function MemoPage3({ memo }: MemoPage3Props) {
  return (
    <div className="space-y-6">
      {/* Section 9: Claim Verifications */}
      {memo.claim_verifications && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SECTION 9: CLAIM VERIFICATIONS</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-black">{memo.claim_verifications.verified_count ?? 0}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Verified</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-black">{memo.claim_verifications.unverified_count ?? 0}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Unverified</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-black">{memo.claim_verifications.disputed_count ?? 0}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Disputed</p>
            </div>
          </div>

          {/* Claims Table */}
          {memo.claim_verifications.claims && memo.claim_verifications.claims.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-black">Claim</th>
                    <th className="px-4 py-3 text-left font-semibold text-black w-24">Verdict</th>
                    <th className="px-4 py-3 text-left font-semibold text-black">Finding / Benchmark Context</th>
                    <th className="px-4 py-3 text-left font-semibold text-black w-20">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {memo.claim_verifications.claims.map((claim, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-black leading-relaxed max-w-md">{claim.claimed_in_deck}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${claim.verdict === 'VERIFIED' ? 'text-green-600' : claim.verdict === 'DISPUTED' ? 'text-red-600' : 'text-slate-500'}`}>
                          {claim.verdict}
                        </span>
                      </td>
                      {/* FIX: Using vs_benchmark from Agent 5 mapping instead of verified_via_search */}
                      <td className="px-4 py-3 text-black leading-relaxed">
                        {claim.vs_benchmark || claim.verified_via_search || "No benchmark context."}
                      </td>
                      {/* FIX: Using source from Agent 5 mapping instead of source_url */}
                      <td className="px-4 py-3">
                        {claim.source && claim.source !== 'None' ? (
                          <a
                            href={claim.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Link
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Section 10: Unverified Claims */}
      {memo.unverified_claims && memo.unverified_claims.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SECTION 10: UNVERIFIED CLAIMS</h2>

          {memo.unverified_why_it_matters && (
            <div className="p-4 border border-slate-400 rounded-lg bg-slate-50">
              <p className="text-xs font-semibold text-black uppercase tracking-wider mb-2">Why It Matters</p>
              <p className="text-sm text-black leading-relaxed">{memo.unverified_why_it_matters}</p>
            </div>
          )}
        </div>
      )}

      {/* Section 11: Penalties */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SECTION 11: PENALTIES</h2>
          <div className="text-lg font-bold text-black">-{memo.penalties?.total ?? 0}</div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Applied</p>
          {memo.penalties?.applied && memo.penalties.applied.length > 0 ? (
            <ul className="space-y-2">
              {memo.penalties.applied.map((penalty, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-black shrink-0 mt-0.5">•</span>
                  <span className="text-black">{penalty}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No penalties applied to the score.</p>
          )}
        </div>
      </div>

      {/* Section 12: Next Steps */}
      {memo.next_steps && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SECTION 12: NEXT STEPS</h2>

          {/* What to Request */}
          {memo.next_steps.what_to_request && Object.keys(memo.next_steps.what_to_request).length > 0 && (
            <div>
              <p className="text-sm font-semibold text-black mb-3">Documents to Request</p>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(memo.next_steps.what_to_request).map(([category, items]) =>
                  items && items.length > 0 ? (
                    <div key={category} className="border border-slate-200 rounded-lg p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        {category.replace(/_/g, ' ')}
                      </p>
                      <ul className="space-y-1.5">
                        {items.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-black shrink-0 mt-0.5">•</span>
                            <span className="text-black">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}

          {/* Interview Questions */}
          {memo.next_steps.interview_questions && Object.keys(memo.next_steps.interview_questions).length > 0 && (
            <div>
              <p className="text-sm font-semibold text-black mb-3">Interview Questions</p>
              <div className="space-y-3">
                {Object.entries(memo.next_steps.interview_questions).map(([category, questions]) =>
                  questions && questions.length > 0 ? (
                    <div key={category} className="border border-slate-200 rounded-lg p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        {category.replace(/_/g, ' ')}
                      </p>
                      <ul className="space-y-1.5">
                        {questions.map((q: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-black shrink-0">Q{i + 1}:</span>
                            <span className="text-black">{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section 13: Recommendation Rationale */}
      {memo.recommendation_rationale && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SECTION 13: FINAL RECOMMENDATION</h2>
          <p className="text-sm text-black leading-relaxed">{memo.recommendation_rationale}</p>
        </div>
      )}

      {/* Section 14: Confidence Score Breakdown */}
      {memo.confidence_score && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SECTION 14: AI CONFIDENCE SCORE BREAKDOWN</h2>
            <div className="text-2xl font-bold text-black">{memo.confidence_score.score ?? 0}%</div>
          </div>

          {memo.confidence_score.formula_breakdown && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Formula Components</p>
              {Object.entries(memo.confidence_score.formula_breakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <p className="text-sm text-black">{key.replace(/_/g, ' ')}</p>
                  <p className={`text-sm font-semibold ${typeof value === 'number' && value < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {typeof value === 'number' && value > 0 ? '+' : ''}
                    {typeof value === 'number' ? (value * 100).toFixed(0) : value}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}