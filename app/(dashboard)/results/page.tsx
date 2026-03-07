'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { FileDown, Info, SquareArrowOutUpRight, X, TrendingUp, DollarSign, AlertTriangle, RotateCcw, Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Section    = { text: string; citations: unknown[] };
type EvalResult = {
  industryNews:    Section;
  competitorLinks: Section;
  synthesis:       Section;
  tamData:         Section;
  riskScore:       Section;
};
type IntakeData = { startupName: string; industry: string; fundingStage: string };
type RiskLevel  = 'Low' | 'Medium' | 'High';
type NewsArticle = { number: number; title: string; sourceUrl: string; sourceDomain: string; summary: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseRiskScore(text: string) {
  const confidenceMatch = text.match(/Confidence Score[^:*]*[:\*]+\s*\*?\*?(\d+)%/i);
  const confidence      = confidenceMatch ? parseInt(confidenceMatch[1]) : 75;

  const riskMatch = text.match(/Risk Level[^:*]*[:\*]+\s*\*?\*?(Low|Medium|High)/i);
  const riskLevel = (riskMatch?.[1] ?? 'Medium') as RiskLevel;

  const justMatch    = text.match(/[Jj]ustification[:\*\s]+([^\n]+)/);
  const justification = justMatch ? justMatch[1].replace(/\*/g, '').trim() : '';

  const rationaleMatch = text.match(/[Rr]ationale[:\*\s]+([\s\S]+?)(?=\n---|\n###)/);
  const rationale      = rationaleMatch ? rationaleMatch[1].replace(/[-*]/g, '').replace(/\s+/g, ' ').trim() : '';

  return { confidence, riskLevel, justification, rationale };
}

function splitTamData(text: string) {
  const idx = text.search(/###\s+\d*\.?\s*[Rr]egion.{0,20}[Rr]isk/);
  if (idx === -1) return { main: text, risks: '' };
  return { main: text.slice(0, idx).trim(), risks: text.slice(idx).trim() };
}

function parseTamStats(text: string): { tam: string | null; cagr: string | null; year: string | null } {
  const rangeMatch = text.match(/\$(\d+\.?\d*)[–\-](\d+\.?\d*)\s*(?:billion|B)/i);
  const singleMatch = !rangeMatch ? text.match(/\$(\d+\.?\d*)\s*(?:billion|B)/i) : null;
  const tam  = rangeMatch  ? `$${rangeMatch[1]}–${rangeMatch[2]}B` : singleMatch ? `$${singleMatch[1]}B` : null;
  const cagr = text.match(/(\d+\.?\d*)%\s*(?:CAGR|cagr)/)?.[1] ? `${text.match(/(\d+\.?\d*)%\s*(?:CAGR|cagr)/)![1]}%` : null;
  const year = text.match(/through\s+(\d{4})/i)?.[1] ?? text.match(/by\s+(\d{4})/i)?.[1] ?? null;
  return { tam, cagr, year };
}

function parseRiskItems(text: string): { title: string; body: string }[] {
  return [...text.matchAll(/^-\s+\*\*([^*]+)\*\*[:\s]*(.*)/gm)].map(m => ({
    title: m[1].replace(/:$/, '').trim(),
    body:  m[2].trim(),
  }));
}

function parseNewsArticles(text: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const sections = [...text.matchAll(/###\s+(\d+)\.\s+\*\*([^*\n]+)\*\*/g)];

  for (let i = 0; i < sections.length; i++) {
    const match    = sections[i];
    const start    = match.index!;
    const end      = sections[i + 1]?.index ?? text.length;
    const body     = text.slice(start, end);

    const urlMatch     = body.match(/Source URL[^[]*\[([^\]]+)\]\(([^)\s#]+)/);
    const summaryMatch = body.match(/\*\*Summary[:\*]+\s*([^\n\[]+)/);

    const rawUrl = urlMatch?.[2]?.trim() ?? '';
    let domain   = rawUrl;
    try { domain = new URL(rawUrl).hostname.replace('www.', ''); } catch { /* keep raw */ }

    articles.push({
      number:      i + 1,
      title:       match[2].trim(),
      sourceUrl:   rawUrl,
      sourceDomain: domain,
      summary:     summaryMatch?.[1]?.trim() ?? '',
    });
  }
  return articles;
}

// ─── Shared Markdown renderer ─────────────────────────────────────────────────

function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-xl font-bold text-slate-900 mt-5 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold text-slate-800 mt-4 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-800 mt-3 mb-1.5">{children}</h3>,
        p:  ({ children }) => <p  className="text-sm text-slate-700 leading-relaxed mb-3">{children}</p>,
        a:  ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{children}</a>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-sm text-slate-700">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm text-slate-700">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-dark-blue bg-blue-50 px-4 py-3 my-4 rounded-r-lg text-sm text-slate-700 italic">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse border border-slate-200">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
        th:    ({ children }) => <th className="border border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">{children}</th>,
        td:    ({ children }) => <td className="border border-slate-200 px-3 py-2 text-slate-600">{children}</td>,
        hr:    ()             => <hr className="border-slate-200 my-4" />,
        strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

// ─── Risk styles ──────────────────────────────────────────────────────────────

const RISK_STYLES: Record<RiskLevel, { badge: string; dot: string; label: string }> = {
  Low:    { badge: 'bg-green-50 border-green-200 text-green-800', dot: 'bg-green-500', label: 'Low Risk'    },
  Medium: { badge: 'bg-amber-50 border-amber-200 text-amber-800', dot: 'bg-amber-500', label: 'Medium Risk' },
  High:   { badge: 'bg-red-50 border-red-200 text-red-800',       dot: 'bg-red-500',   label: 'High Risk'   },
};

// ─── Section label (shared heading style) ─────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
      <span className="w-1 h-5 bg-dark-blue rounded-full inline-block" />
      {children}
    </h2>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ResultsContent() {
  const searchParams  = useSearchParams();
  const id            = searchParams.get('id');

  const [result,        setResult]        = useState<EvalResult | null>(null);
  const [intake,        setIntake]        = useState<IntakeData | null>(null);
  const [generatedAt,   setGeneratedAt]   = useState('');
  const [expandedRow,   setExpandedRow]   = useState<number | null>(null);
  const [isGenerating,  setIsGenerating]  = useState(false);

  useEffect(() => {
    const sessions: { id: string; createdAt: string; intake: IntakeData; result: EvalResult }[] =
      JSON.parse(localStorage.getItem('litoAi_sessions') ?? '[]');
    const session = id ? sessions.find(s => s.id === id) : sessions[0];
    if (session) {
      setResult(session.result);
      setIntake(session.intake);
      setGeneratedAt(new Date(session.createdAt).toLocaleString());
    }
  }, [id]);

  async function handleGeneratePdf() {
    if (!intake || !result || isGenerating) return;
    setIsGenerating(true);

    try {
      // 1. Get the session for the Startup Name
      const sessions: { id: string; intake: Record<string, unknown> }[] =
        JSON.parse(localStorage.getItem('litoAi_sessions') ?? '[]');
      const session = id ? sessions.find(s => s.id === id) : sessions[0];
      const fullIntake = session?.intake ?? intake;

      // 2. Parse the clean summary data
      const { confidence, riskLevel } = parseRiskScore(result.riskScore.text);

      // 3. Create the simplified data object
      const pdfData = {
        startupName:     fullIntake.startupName,
        riskLevel:       riskLevel,
        confidenceScore: `${confidence}%`,
        synthesisText:   result.synthesis.text,
        // Cleaning up citations: joins them into a readable string or "No citations available"
        citations:       result.synthesis.citations?.length 
                           ? result.synthesis.citations.join(', ') 
                           : "Sources available upon request."
      };

      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfData), 
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? 'PDF generation failed');
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${intake.startupName}_Validation_Memo.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[handleGeneratePdf] Error:', err);
    } finally {
      setIsGenerating(false);
    }
  }

  if (!result || !intake) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        No results found. Please complete the evaluation first.
      </div>
    );
  }

  const { confidence, riskLevel, justification, rationale } = parseRiskScore(result.riskScore.text);
  const riskStyle   = RISK_STYLES[riskLevel] ?? RISK_STYLES.Medium;
  const { main: tamMain, risks: tamRisks } = splitTamData(result.tamData.text);
  const { tam, cagr, year } = parseTamStats(result.tamData.text);
  const riskItems   = parseRiskItems(tamRisks);
  const newsArticles = parseNewsArticles(result.industryNews.text);

  return (
    <div className="space-y-8">

      {/* ── 1. Dashboard Header ───────────────────────────────────────────── */}
      <div className="top-0 z-10 bg-white -mx-7 px-7 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">
              Validation Memo: {intake.startupName}
            </h1>
            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
              {intake.industry}
            </span>
            <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
              {intake.fundingStage}
            </span>
          </div>
          <Button size="sm" variant="outline" className="rounded-sm shrink-0" onClick={handleGeneratePdf} disabled={isGenerating}>
            {isGenerating
              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating…</>
              : <><FileDown className="w-3.5 h-3.5 mr-1.5" />Generate Secured Memo</>}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-slate-400">Last Updated: {generatedAt}</p>
          <button className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700 transition-colors">
            Regenerate Memo
          </button>
        </div>
      </div>

      {/* ── 2. Startup Overview ───────────────────────────────────────────── */}
      <div>
        <SectionLabel>Startup Overview</SectionLabel>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 relative overflow-hidden">
          <div className="grid grid-cols-3 gap-x-8 gap-y-4 relative z-10">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Name</p>
              <p className="text-sm font-medium text-slate-800">{intake.startupName}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Industry</p>
              <p className="text-sm font-medium text-slate-800">{intake.industry}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Stage</p>
              <p className="text-sm font-medium text-slate-800">{intake.fundingStage}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <p className="text-sm font-medium text-slate-800">Active</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Generated</p>
              <p className="text-sm font-medium text-slate-800">{generatedAt}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Watermark</p>
              <p className="text-sm font-medium text-slate-800">Validation Memo — Confidential</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Executive Verdict ──────────────────────────────────────────── */}
      <div>
        <SectionLabel>Executive Verdict</SectionLabel>
        <div className="grid grid-cols-3 gap-4">

          {/* Card A: AI Research Confidence Score */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-5 bg-dark-blue rounded-full inline-block" />
              <p className="text-sm font-bold text-slate-700">AI Research Confidence Score</p>
            </div>
            <p className="text-5xl font-semibold text-slate-900">{confidence}%</p>
            <p className="text-xs text-slate-400 mt-2">Aggregated confidence score</p>
          </div>

          {/* Card B: Risk Level */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex flex-col justify-center items-center gap-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Risk Level</p>
            <div className={`flex items-center gap-2 border rounded-full px-4 py-2 ${riskStyle.badge}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${riskStyle.dot}`} />
              <span className="text-lg font-bold">{riskStyle.label}</span>
            </div>
            {justification && (
              <p className="text-xs text-slate-500 text-center leading-relaxed">{justification}</p>
            )}
          </div>

          {/* Card C: TL;DR */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1 h-5 bg-dark-blue rounded-full inline-block" />
              <p className="text-sm font-bold text-slate-700">TL;DR</p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{rationale || justification}</p>
          </div>

        </div>
      </div>

      {/* ── 4. AI Research Synthesis ──────────────────────────────────────── */}
      <div>
        <SectionLabel>AI Research Synthesis</SectionLabel>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8">
          <Markdown>{result.synthesis.text}</Markdown>
        </div>
      </div>

      {/* ── 5. Market Sizing & Economics ─────────────────────────────────── */}
      <div>
        <SectionLabel>Market Sizing & Economics</SectionLabel>
        <div className="grid grid-cols-5 gap-6">

          {/* Left (3/5): Market Opportunity */}
          <div className="col-span-3 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Market Opportunity</p>
            </div>
            {/* Key stat highlights */}
            {(tam || cagr || year) && (
              <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                {tam && (
                  <div className="px-6 py-4 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-dark-blue">
                      <DollarSign className="w-3.5 h-3.5" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider">TAM (2025)</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{tam}</p>
                  </div>
                )}
                {cagr && (
                  <div className="px-6 py-4 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-dark-blue">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider">CAGR</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{cagr}</p>
                  </div>
                )}
                {year && (
                  <div className="px-6 py-4 flex flex-col gap-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Projected Through</p>
                    <p className="text-2xl font-bold text-slate-900">{year}</p>
                  </div>
                )}
              </div>
            )}
            <div className="px-6 py-5">
              <Markdown>{tamMain}</Markdown>
            </div>
          </div>

          {/* Right (2/5): Region-Specific Risks */}
          <div className="col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Region-Specific Risks</p>
            </div>
            <div className="divide-y divide-slate-100">
              {riskItems.length > 0 ? riskItems.map((risk, i) => (
                <div key={i} className="px-6 py-4 flex gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-red-500">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{risk.title}</p>
                    {risk.body && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{risk.body}</p>}
                  </div>
                </div>
              )) : (
                <div className="px-6 py-5">
                  <Markdown>{tamRisks || '_No risks extracted._'}</Markdown>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── 6. Live Market Signals — Industry News ───────────────────────── */}
      <div>
        <SectionLabel>Live Market Signals</SectionLabel>

        {/* Industry News table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Industry News</p>
          </div>
          {newsArticles.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-8">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">Summary</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">Link</th>
                </tr>
              </thead>
              <tbody>
                {newsArticles.map((article) => (
                  <React.Fragment key={article.number}>
                    <tr
                      className={`border-t border-slate-100 transition-colors ${expandedRow === article.number ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-6 py-3 text-slate-400 text-xs">{article.number}</td>
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-slate-800 leading-snug">{article.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{article.sourceDomain}</p>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">2025–2026</td>
                      <td className="px-6 py-3 text-center">
                        {article.summary && (
                          <button
                            onClick={() => setExpandedRow(expandedRow === article.number ? null : article.number)}
                            className="text-slate-400 hover:text-dark-blue transition-colors"
                          >
                            {expandedRow === article.number
                              ? <X className="w-4 h-4" />
                              : <Info className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {article.sourceUrl && (
                          <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex text-slate-400 hover:text-blue-600 transition-colors">
                            <SquareArrowOutUpRight className="w-4 h-4" />
                          </a>
                        )}
                      </td>
                    </tr>
                    {expandedRow === article.number && (
                      <tr key={`${article.number}-expanded`} className="bg-blue-50 border-t border-blue-100">
                        <td colSpan={5} className="px-6 py-4">
                          <p className="text-sm text-slate-700 leading-relaxed">{article.summary}</p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">No news articles found.</div>
          )}
        </div>

        {/* Competitor Intelligence */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <p className="text-sm font-semibold text-slate-700 mb-4">Competitor Intelligence</p>
          <Markdown>{result.competitorLinks.text}</Markdown>
        </div>
      </div>

      {/* ── 7. Research Confidence footer card ───────────────────────────── */}
      <div className="bg-slate-200 rounded-lg px-6 py-5">
        <p className="text-sm font-semibold text-slate-700">Research Confidence: {confidence}%</p>
        <p className="text-xs text-slate-500 mt-1">
          Confidence is generated from You.com API core analysis engine.
        </p>
      </div>

    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading…</div>}>
      <ResultsContent />
    </Suspense>
  );
}
