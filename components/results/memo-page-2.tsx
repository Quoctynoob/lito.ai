interface CategoryDetail {
  score: number;
  max: number;
  [key: string]: unknown;
}

interface MemoData {
  categories: {
    team_equity: CategoryDetail & {
      founder_market_fit?: string[];
      concerns?: string[];
      red_flags?: string[];
      scoring_rationale?: Array<{ item: string; points: number }>;
    };
    traction_validation: CategoryDetail & {
      critical_alert?: string;
      claimed_in_deck?: string[];
      verified_findings?: string[];
      benchmark_comparison?: {
        baseline?: string;
        strong?: string;
        this_startup?: string;
      };
      red_flags?: string[];
      scoring_rationale?: Array<{ item: string; points: number }>;
    };
    market_vertical: CategoryDetail & {
      business_model_snapshot?: {
        problem?: string;
        solution?: string;
        revenue_model?: string;
        target_market?: string;
        differentiation?: string;
        differentiation_assessment?: string;
      };
      tam?: {
        claimed?: string;
        verified?: string;
        sources?: string[];
        assessment?: string;
      };
      risk_assessment?: {
        business_model_risk?: { level?: string; detail?: string };
        market_saturation?: { level?: string; bullets?: string[] };
        competitive_moat?: { level?: string; detail?: string };
      };
      competitive_landscape?: Array<{
        name?: string;
        scope?: string;
        model?: string;
        status?: string;
      }>;
      why_now?: string;
      red_flags?: string[];
      scoring_rationale?: Array<{ item: string; points: number }>;
    };
    capital_efficiency: CategoryDetail & {
      current_stage_notes?: string[];
      funding_plan?: {
        use_of_funds?: string;
        runway?: string;
        burn_rate?: string;
      };
      use_of_funds_analysis?: string;
      unit_economics?: {
        cac?: string;
        ltv?: string;
        gross_margin?: string;
        aov?: string;
        payback_period?: string;
      };
      benchmark_comparison?: {
        strong?: string;
        average?: string;
        this_startup?: string;
      };
      concern_note?: string;
      scoring_rationale?: Array<{ item: string; points: number }>;
    };
    cap_table_terms: CategoryDetail & {
      funding_terms?: {
        raise_amount?: string;
        valuation_cap?: string;
        dilution?: string;
        instrument?: string;
        discount?: string;
      };
      benchmark_comparison?: {
        median_valuation?: string;
        this_cap?: string;
        premium?: string;
        median_raise?: string;
        this_raise?: string;
        raise_premium?: string;
      };
      assessments?: Array<{
        color?: string;
        text?: string;
      }>;
      cap_table_structure?: {
        previous_raises?: string;
        safes_on_table?: string;
        convertible_notes?: string;
        founder_equity?: string;
      };
      safe_killswitch?: {
        triggered?: boolean;
        detail?: string;
      };
      scoring_rationale?: Array<{ item: string; points: number }>;
    };
  };
}

interface MemoPage2Props {
  memo: MemoData & {
    founders?: Array<string | { name: string; role?: string; background?: string }>
  };
}

import { CircleCheckBig, CircleX } from 'lucide-react';

export function MemoPage2({ memo }: MemoPage2Props) {
  const { team_equity, traction_validation, market_vertical, capital_efficiency, cap_table_terms } = memo.categories;

  return (
    <div className="space-y-6">
      {/* Section 4: Team Equity */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SECTION 4: TEAM & EQUITY</h2>

        {/* Founder-Market Fit */}
        <div>
          <h3 className="text-sm font-semibold text-black mb-2">Founder-Market Fit</h3>
          <ul className="space-y-2">
            {(() => {
              // Use founder_market_fit if available, otherwise fall back to founders from memo root
              const foundersList = (team_equity.founder_market_fit && team_equity.founder_market_fit.length > 0)
                ? team_equity.founder_market_fit
                : null;

              const rootFounders = (memo as any).founders as Array<any> | undefined;

              if (foundersList) {
                return foundersList.map((item: any, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <CircleCheckBig className="w-5 h-5 text-black shrink-0 mt-0.5" />
                    <p className="text-sm text-black leading-relaxed">
                      {typeof item === 'object'
                        ? `${item.name}${item.role ? ': ' + item.role : ''}${item.background ? ' (' + item.background + ')' : ''}`
                        : item}
                    </p>
                  </li>
                ));
              }

              if (rootFounders && rootFounders.length > 0) {
                return rootFounders.map((f: any, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <CircleCheckBig className="w-5 h-5 text-black shrink-0 mt-0.5" />
                    <p className="text-sm text-black leading-relaxed">
                      {typeof f === 'object'
                        ? `${f.name}${f.role ? ': ' + f.role : ''}${f.background ? ' (' + f.background + ')' : ''}`
                        : f}
                    </p>
                  </li>
                ));
              }

              return (
                <li className="flex items-start gap-3">
                  <CircleCheckBig className="w-5 h-5 text-black shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-400 leading-relaxed">No founder data available</p>
                </li>
              );
            })()}
          </ul>
        </div>

        {/* Concerns */}
        <div>
          <h3 className="text-sm font-semibold text-black mb-2">Concerns</h3>
          <ul className="space-y-2">
            {team_equity.concerns && team_equity.concerns.length > 0 ? (
              team_equity.concerns.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-sm text-black">•</span>
                  <p className="text-sm text-black leading-relaxed">{item}</p>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-3">
                <span className="text-sm text-black">•</span>
                <p className="text-sm text-slate-400 leading-relaxed">No data available</p>
              </li>
            )}
          </ul>
        </div>

        {/* Red Flags */}
        <div>
          <h3 className="text-sm font-semibold text-black mb-2">Red Flags</h3>
          <ul className="space-y-2">
            {team_equity.red_flags && team_equity.red_flags.length > 0 ? (
              team_equity.red_flags.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-sm text-black">•</span>
                  <p className="text-sm text-black leading-relaxed">{item}</p>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-3">
                <span className="text-sm text-black">•</span>
                <p className="text-sm text-slate-400 leading-relaxed">No data available</p>
              </li>
            )}
          </ul>
        </div>

        {/* Scoring Rationale */}
        <div>
          <h3 className="text-sm font-semibold text-black mb-2">Scoring Rationale</h3>
          <ul className="space-y-2">
            {team_equity.scoring_rationale && team_equity.scoring_rationale.length > 0 ? (
              team_equity.scoring_rationale.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-sm text-black">•</span>
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-sm text-black leading-relaxed">{item.item}</p>
                    <p className="text-sm text-black ml-4">{item.points >= 0 ? '+' : ''}{item.points}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-3">
                <span className="text-sm text-black">•</span>
                <p className="text-sm text-slate-400 leading-relaxed">No data available</p>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Section 5: Traction Validation */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SECTION 5: TRACTION & VALIDATION</h2>

        {/* Claimed in Deck */}
        <div>
          <h3 className="text-sm font-semibold text-black mb-2">Claimed in Deck</h3>
          <ul className="space-y-2">
            {traction_validation.claimed_in_deck && traction_validation.claimed_in_deck.length > 0 ? (
              traction_validation.claimed_in_deck.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-sm text-black">•</span>
                  <p className="text-sm text-black leading-relaxed">{item}</p>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-3">
                <span className="text-sm text-black">•</span>
                <p className="text-sm text-slate-400 leading-relaxed">No data available</p>
              </li>
            )}
          </ul>
        </div>

        {/* Verified Findings */}
        <div>
          <h3 className="text-sm font-semibold text-black mb-2">Verified Findings</h3>
          <ul className="space-y-2">
            {traction_validation.verified_findings && traction_validation.verified_findings.length > 0 ? (
              traction_validation.verified_findings.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CircleX className="w-5 h-5 text-black shrink-0 mt-0.5" />
                  <p className="text-sm text-black leading-relaxed">{item}</p>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-3">
                <CircleX className="w-5 h-5 text-black shrink-0 mt-0.5" />
                <p className="text-sm text-slate-400 leading-relaxed">No data available</p>
              </li>
            )}
          </ul>
        </div>

        {/* Benchmark Comparison */}
        {traction_validation.benchmark_comparison && (
          <div>
            <h3 className="text-sm font-semibold text-black mb-2">Benchmark Comparison</h3>
            <div className="space-y-2 text-sm">
              {traction_validation.benchmark_comparison.baseline && (
                <div>
                  <span className="font-semibold text-black">Baseline: </span>
                  <span className="text-black">{traction_validation.benchmark_comparison.baseline}</span>
                </div>
              )}
              {traction_validation.benchmark_comparison.strong && (
                <div>
                  <span className="font-semibold text-black">Strong: </span>
                  <span className="text-black">{traction_validation.benchmark_comparison.strong}</span>
                </div>
              )}
              {traction_validation.benchmark_comparison.this_startup && (
                <div>
                  <span className="font-semibold text-black">This Startup: </span>
                  <span className="text-black">{traction_validation.benchmark_comparison.this_startup}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Red Flags */}
        <div>
          <h3 className="text-sm font-semibold text-black mb-2">Red Flags</h3>
          <ul className="space-y-2">
            {traction_validation.red_flags && traction_validation.red_flags.length > 0 ? (
              traction_validation.red_flags.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-sm text-black">•</span>
                  <p className="text-sm text-black leading-relaxed">{item}</p>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-3">
                <span className="text-sm text-black">•</span>
                <p className="text-sm text-slate-400 leading-relaxed">No data available</p>
              </li>
            )}
          </ul>
        </div>

        {/* Scoring Rationale */}
        <div>
          <h3 className="text-sm font-semibold text-black mb-2">Scoring Rationale</h3>
          <ul className="space-y-2">
            {traction_validation.scoring_rationale && traction_validation.scoring_rationale.length > 0 ? (
              traction_validation.scoring_rationale.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-sm text-black">•</span>
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-sm text-black leading-relaxed">{item.item}</p>
                    <p className="text-sm text-black ml-4">{item.points >= 0 ? '+' : ''}{item.points}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-3">
                <span className="text-sm text-black">•</span>
                <p className="text-sm text-slate-400 leading-relaxed">No data available</p>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Section 6: Market & Vertical */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SECTION 6: MARKET & VERTICAL</h2>

        {/* Business Model Snapshot */}
        {market_vertical.business_model_snapshot && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black">Business Model Snapshot</h3>

            {market_vertical.business_model_snapshot.problem && (
              <div>
                <p className="text-sm font-semibold text-black">Problem:</p>
                <p className="text-sm text-black mt-1">{market_vertical.business_model_snapshot.problem}</p>
              </div>
            )}

            {market_vertical.business_model_snapshot.solution && (
              <div>
                <p className="text-sm font-semibold text-black">Solution:</p>
                <p className="text-sm text-black mt-1">{market_vertical.business_model_snapshot.solution}</p>
              </div>
            )}

            {market_vertical.business_model_snapshot.revenue_model && (
              <div>
                <p className="text-sm font-semibold text-black">Revenue Model:</p>
                <p className="text-sm text-black mt-1">{market_vertical.business_model_snapshot.revenue_model}</p>
              </div>
            )}

            {market_vertical.business_model_snapshot.target_market && (
              <div>
                <p className="text-sm font-semibold text-black">Target Market:</p>
                <p className="text-sm text-black mt-1">{market_vertical.business_model_snapshot.target_market}</p>
              </div>
            )}

            {market_vertical.business_model_snapshot.differentiation && (
              <div>
                <p className="text-sm font-semibold text-black">Differentiation:</p>
                <p className="text-sm text-black mt-1">{market_vertical.business_model_snapshot.differentiation}</p>
                {market_vertical.business_model_snapshot.differentiation_assessment && (
                  <p className="text-sm text-black mt-1">Verified: {market_vertical.business_model_snapshot.differentiation_assessment}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Separator Line */}
        <div className="border-t border-slate-300" />

        {/* Market & Risk Assessment */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-black">Market & Risk Assessment</h3>

          {/* TAM */}
          {market_vertical.tam && (
            <div>
              <h4 className="text-sm font-semibold text-black mb-2">Total Addressable Market</h4>
              <div className="space-y-2 text-sm">
                {market_vertical.tam.claimed && (
                  <div>
                    <span className="font-semibold text-black">Claimed: </span>
                    <span className="text-black">{market_vertical.tam.claimed}</span>
                  </div>
                )}
                {market_vertical.tam.verified && (
                  <div>
                    <span className="font-semibold text-black">Verified: </span>
                    <span className="text-black">{market_vertical.tam.verified}</span>
                  </div>
                )}
                {market_vertical.tam.assessment && (
                  <div>
                    <span className="font-semibold text-black">Assessment: </span>
                    <span className="text-black">{market_vertical.tam.assessment}</span>
                  </div>
                )}
                {market_vertical.tam.sources && market_vertical.tam.sources.length > 0 && (
                  <div className="pt-2">
                    <p className="text-sm font-semibold text-black mb-1">Sources:</p>
                    {market_vertical.tam.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline block"
                      >
                        {src}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Risk Assessments */}
          {market_vertical.risk_assessment && (
            <div className="space-y-3">
              {market_vertical.risk_assessment.business_model_risk && (
                <div>
                  <h4 className="text-sm font-semibold text-black mb-2">
                    Business Model Risk: {market_vertical.risk_assessment.business_model_risk.level}
                  </h4>
                  {market_vertical.risk_assessment.business_model_risk.detail && (
                    <ul className="space-y-1">
                      <li className="flex items-start gap-3">
                        <span className="text-sm text-black">•</span>
                        <p className="text-sm text-black">{market_vertical.risk_assessment.business_model_risk.detail}</p>
                      </li>
                    </ul>
                  )}
                </div>
              )}

              {market_vertical.risk_assessment.market_saturation && (
                <div>
                  <h4 className="text-sm font-semibold text-black mb-2">
                    Market Saturation: {market_vertical.risk_assessment.market_saturation.level}
                  </h4>
                  {market_vertical.risk_assessment.market_saturation.bullets && (
                    <ul className="space-y-1">
                      {market_vertical.risk_assessment.market_saturation.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="text-sm text-black">•</span>
                          <p className="text-sm text-black">{b}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {market_vertical.risk_assessment.competitive_moat && (
                <div>
                  <h4 className="text-sm font-semibold text-black mb-2">
                    Competitive Moat: {market_vertical.risk_assessment.competitive_moat.level}
                  </h4>
                  {market_vertical.risk_assessment.competitive_moat.detail && (
                    <ul className="space-y-1">
                      <li className="flex items-start gap-3">
                        <span className="text-sm text-black">•</span>
                        <p className="text-sm text-black">{market_vertical.risk_assessment.competitive_moat.detail}</p>
                      </li>
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Competitive Landscape */}
          {market_vertical.competitive_landscape && market_vertical.competitive_landscape.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-black mb-2">Competitive Landscape</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-black">Competitor</th>
                      <th className="px-3 py-2 text-left font-semibold text-black">Scope</th>
                      <th className="px-3 py-2 text-left font-semibold text-black">Model</th>
                      <th className="px-3 py-2 text-left font-semibold text-black">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {market_vertical.competitive_landscape.map((comp, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-black">{comp.name}</td>
                        <td className="px-3 py-2 text-black">{comp.scope}</td>
                        <td className="px-3 py-2 text-black">{comp.model}</td>
                        <td className="px-3 py-2 text-black">{comp.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Scoring Rationale */}
        <div>
          <h3 className="text-sm font-semibold text-black mb-2">Scoring Rationale</h3>
          <ul className="space-y-2">
            {market_vertical.scoring_rationale && market_vertical.scoring_rationale.length > 0 ? (
              market_vertical.scoring_rationale.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-sm text-black">•</span>
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-sm text-black leading-relaxed">{item.item}</p>
                    <p className="text-sm text-black ml-4">{item.points >= 0 ? '+' : ''}{item.points}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-3">
                <span className="text-sm text-black">•</span>
                <p className="text-sm text-slate-400 leading-relaxed">No data available</p>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Section 7: Capital Efficiency */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SECTION 7: CAPITAL EFFICIENCY</h2>

        {/* Current Stage Notes */}
        {capital_efficiency.current_stage_notes && capital_efficiency.current_stage_notes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-black mb-2">Current Stage Notes</h3>
            <ul className="space-y-2">
              {capital_efficiency.current_stage_notes.map((note, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-sm text-black">•</span>
                  <p className="text-sm text-black leading-relaxed">{note}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Funding Plan */}
        {capital_efficiency.funding_plan && (
          <div>
            <h3 className="text-sm font-semibold text-black mb-2">Funding Plan</h3>
            <div className="space-y-2 text-sm">
              {capital_efficiency.funding_plan.use_of_funds && (
                <div>
                  <span className="font-semibold text-black">Use of Funds: </span>
                  <span className="text-black">{capital_efficiency.funding_plan.use_of_funds}</span>
                </div>
              )}
              {capital_efficiency.funding_plan.runway && (
                <div>
                  <span className="font-semibold text-black">Runway: </span>
                  <span className="text-black">{capital_efficiency.funding_plan.runway}</span>
                </div>
              )}
              {capital_efficiency.funding_plan.burn_rate && (
                <div>
                  <span className="font-semibold text-black">Burn Rate: </span>
                  <span className="text-black">{capital_efficiency.funding_plan.burn_rate}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Unit Economics */}
        {capital_efficiency.unit_economics && (
          <div>
            <h3 className="text-sm font-semibold text-black mb-2">Unit Economics</h3>
            <div className="space-y-2 text-sm">
              {capital_efficiency.unit_economics.cac && (
                <div>
                  <span className="font-semibold text-black">CAC: </span>
                  <span className="text-black">{capital_efficiency.unit_economics.cac}</span>
                </div>
              )}
              {capital_efficiency.unit_economics.ltv && (
                <div>
                  <span className="font-semibold text-black">LTV: </span>
                  <span className="text-black">{capital_efficiency.unit_economics.ltv}</span>
                </div>
              )}
              {capital_efficiency.unit_economics.gross_margin && (
                <div>
                  <span className="font-semibold text-black">Gross Margin: </span>
                  <span className="text-black">{capital_efficiency.unit_economics.gross_margin}</span>
                </div>
              )}
              {capital_efficiency.unit_economics.payback_period && (
                <div>
                  <span className="font-semibold text-black">Payback Period: </span>
                  <span className="text-black">{capital_efficiency.unit_economics.payback_period}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Concern Note */}
        {capital_efficiency.concern_note && (
          <div className="border border-slate-400 rounded-lg p-4">
            <p className="text-sm text-black">{capital_efficiency.concern_note}</p>
          </div>
        )}

        {/* Scoring Rationale */}
        <div>
          <h3 className="text-sm font-semibold text-black mb-2">Scoring Rationale</h3>
          <ul className="space-y-2">
            {capital_efficiency.scoring_rationale && capital_efficiency.scoring_rationale.length > 0 ? (
              capital_efficiency.scoring_rationale.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-sm text-black">•</span>
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-sm text-black leading-relaxed">{item.item}</p>
                    <p className="text-sm text-black ml-4">{item.points >= 0 ? '+' : ''}{item.points}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-3">
                <span className="text-sm text-black">•</span>
                <p className="text-sm text-slate-400 leading-relaxed">No data available</p>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Section 8: Cap Table & Terms */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SECTION 8: CAP TABLE & TERMS</h2>

        {/* Funding Terms */}
        {cap_table_terms.funding_terms && (
          <div>
            <h3 className="text-sm font-semibold text-black mb-2">Funding Terms</h3>
            <div className="space-y-2 text-sm">
              {cap_table_terms.funding_terms.raise_amount && (
                <div>
                  <span className="font-semibold text-black">Raise Amount: </span>
                  <span className="text-black">{cap_table_terms.funding_terms.raise_amount}</span>
                </div>
              )}
              {cap_table_terms.funding_terms.valuation_cap && (
                <div>
                  <span className="font-semibold text-black">Valuation Cap: </span>
                  <span className="text-black">{cap_table_terms.funding_terms.valuation_cap}</span>
                </div>
              )}
              {cap_table_terms.funding_terms.instrument && (
                <div>
                  <span className="font-semibold text-black">Instrument: </span>
                  <span className="text-black">{cap_table_terms.funding_terms.instrument}</span>
                </div>
              )}
              {cap_table_terms.funding_terms.discount && (
                <div>
                  <span className="font-semibold text-black">Discount: </span>
                  <span className="text-black">{cap_table_terms.funding_terms.discount}</span>
                </div>
              )}
              {cap_table_terms.funding_terms.dilution && (
                <div>
                  <span className="font-semibold text-black">Dilution: </span>
                  <span className="text-black">{cap_table_terms.funding_terms.dilution}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assessments */}
        {cap_table_terms.assessments && cap_table_terms.assessments.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-black mb-2">Assessments</h3>
            <ul className="space-y-2">
              {cap_table_terms.assessments.map((assessment, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-sm text-black">•</span>
                  <p className="text-sm text-black leading-relaxed">{assessment.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cap Table Structure */}
        {cap_table_terms.cap_table_structure && (
          <div>
            <h3 className="text-sm font-semibold text-black mb-2">Cap Table Structure</h3>
            <div className="space-y-2 text-sm">
              {cap_table_terms.cap_table_structure.previous_raises && (
                <div>
                  <span className="font-semibold text-black">Previous Raises: </span>
                  <span className="text-black">{cap_table_terms.cap_table_structure.previous_raises}</span>
                </div>
              )}
              {cap_table_terms.cap_table_structure.safes_on_table && (
                <div>
                  <span className="font-semibold text-black">SAFEs on Table: </span>
                  <span className="text-black">{cap_table_terms.cap_table_structure.safes_on_table}</span>
                </div>
              )}
              {cap_table_terms.cap_table_structure.convertible_notes && (
                <div>
                  <span className="font-semibold text-black">Convertible Notes: </span>
                  <span className="text-black">{cap_table_terms.cap_table_structure.convertible_notes}</span>
                </div>
              )}
              {cap_table_terms.cap_table_structure.founder_equity && (
                <div>
                  <span className="font-semibold text-black">Founder Equity: </span>
                  <span className="text-black">{cap_table_terms.cap_table_structure.founder_equity}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SAFE Killswitch */}
        {cap_table_terms.safe_killswitch && cap_table_terms.safe_killswitch.triggered && (
          <div className="border border-slate-400 rounded-lg p-4">
            <p className="text-sm font-semibold text-black mb-1">SAFE Killswitch Triggered</p>
            <p className="text-sm text-black">{cap_table_terms.safe_killswitch.detail}</p>
          </div>
        )}

        {/* Scoring Rationale */}
        <div>
          <h3 className="text-sm font-semibold text-black mb-2">Scoring Rationale</h3>
          <ul className="space-y-2">
            {cap_table_terms.scoring_rationale && cap_table_terms.scoring_rationale.length > 0 ? (
              cap_table_terms.scoring_rationale.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-sm text-black">•</span>
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-sm text-black leading-relaxed">{item.item}</p>
                    <p className="text-sm text-black ml-4">{item.points >= 0 ? '+' : ''}{item.points}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-3">
                <span className="text-sm text-black">•</span>
                <p className="text-sm text-slate-400 leading-relaxed">No data available</p>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
