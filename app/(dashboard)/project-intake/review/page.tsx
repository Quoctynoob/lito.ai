'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Check, X, Plus, Loader2 } from 'lucide-react';

// ─── Loading screen helpers ───────────────────────────────────────────────────

const PROGRESS_STAGES = [
  { max: 20, label: 'Parsing structured intake data' },
  { max: 40, label: 'Querying live web sources via You.com' },
  { max: 60, label: 'Cross-validating market signals' },
  { max: 80, label: 'Generating citation-backed research' },
  { max: 100, label: 'Computing Confidence Score' },
];

function getStageLabel(p: number) {
  return PROGRESS_STAGES.find(s => p < s.max)?.label ?? PROGRESS_STAGES[4].label;
}

function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-12">

      {/* Spinner */}
      <Loader2 className="w-12 h-12 text-dark-blue animate-spin mb-6" />

      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
        Synthesizing Market Intelligence
      </h2>

      {/* Subtitle */}
      <p className="text-sm text-slate-400 text-center max-w-md mb-8">
        Querying You.com APIs for real-time web data, validating structured signals,
        and generating citation-backed insights…
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-lg">
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-dark-blue rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Label + percentage */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">{getStageLabel(progress)}</span>
          <span className="text-slate-400 font-medium">{Math.round(progress)}%</span>
        </div>
      </div>

    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  startupName:              string;
  industry:                 string;
  fundingStage:             string;
  primaryGeography:         string;
  targetCustomerProfile:    string;
  coreProblemStatement:     string;
  proposedSolutionOverview: string;
  revenueModelStructure:    string;
  businessModelExplanation: string;
  knownCompetitors:         string[];
  competitiveDifferentiators: string;
  monthlyRecurringRevenue?:   string;
  activeCustomerCount?:       string;
  monthOverMonthGrowth?:      string;
  evaluationTerms:            boolean;
};

// ─── Dropdown options ─────────────────────────────────────────────────────────

const INDUSTRIES = [
  'AI/Machine Learning','Fintech','HealthTech/BioTech','Climate/Energy',
  'Enterprise Saas/B2B Tools','Consumer/Marketplace','Other',
];
const FUNDING_STAGES = ['Idea', 'Pre-Seed', 'Seed'];
const GEOGRAPHIES = [
  'North America','Latin America','Europe','Middle East & Africa',
  'South Asia','East Asia','Southeast Asia','Oceania','Global','Other',
];
const REVENUE_MODELS = [
  'SaaS / Subscription','Marketplace / Transaction Fee','Freemium','License',
  'Usage-Based / Pay-per-use','E-commerce / Direct Sales','Consulting / Services',
  'Advertising','Other',
];

// ─── Shared sub-components ────────────────────────────────────────────────────

function ReadField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value || <span className="text-slate-300 italic">—</span>}</p>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-slate-700 mb-1">{children}</p>;
}

function SectionHeader({
  title, editing, onEdit, onConfirm, onCancel,
}: {
  title: string;
  editing: boolean;
  onEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {!editing ? (
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={onConfirm}>
            <Check className="w-3.5 h-3.5 mr-1" /> Confirm
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const router = useRouter();
  const [data, setData] = useState<FormData | null>(null);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<FormData>>({});
  const [competitorInput, setCompetitorInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('litoAi_intake');
    if (stored) setData(JSON.parse(stored));
  }, []);

  // Simulate progress while the API call runs
  useEffect(() => {
    if (!isSubmitting) return;
    setProgress(0);
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev; // hold at 90% until API resolves
        const speed = prev < 40 ? 2.5 : prev < 70 ? 1.5 : 0.8;
        return Math.min(prev + speed, 90);
      });
    }, 350);
    return () => clearInterval(timer);
  }, [isSubmitting]);

  function startEdit(section: number) {
    setEditingSection(section);
    if (data) setDraft({ ...data });
  }

  function confirmEdit() {
    if (!data) return;
    const updated = { ...data, ...draft } as FormData;
    setData(updated);
    localStorage.setItem('litoAi_intake', JSON.stringify(updated));
    setEditingSection(null);
    setDraft({});
  }

  function cancelEdit() {
    setEditingSection(null);
    setDraft({});
    setCompetitorInput('');
  }

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setDraft(prev => ({ ...prev, [field]: value }));
  }

  function addCompetitor() {
    const trimmed = competitorInput.trim();
    if (!trimmed) return;
    const current = draft.knownCompetitors ?? [];
    if (current.includes(trimmed)) return;
    set('knownCompetitors', [...current, trimmed]);
    setCompetitorInput('');
  }

  function removeCompetitor(name: string) {
    set('knownCompetitors', (draft.knownCompetitors ?? []).filter(c => c !== name));
  }

  function handleSaveAndExit() {
    if (data) localStorage.setItem('litoAi_intake', JSON.stringify(data));
    router.push('/');
  }

  async function handleFinalSubmit() {
    if (!data) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Evaluation failed');

      // Quick-parse confidence + risk so the home page table can show them without re-parsing
      const confMatch = (result.riskScore?.text as string | undefined)?.match(/Confidence Score[^:*]*[:\*]+\s*\*?\*?(\d+)%/i);
      const confidence = confMatch ? parseInt(confMatch[1]) : 75;
      const riskMatch  = (result.riskScore?.text as string | undefined)?.match(/Risk Level[^:*]*[:\*]+\s*\*?\*?(Low|Medium|High)/i);
      const riskLevel  = riskMatch?.[1] ?? 'Medium';

      const id      = Date.now().toString();
      const session = { id, createdAt: new Date().toISOString(), intake: data, result, confidence, riskLevel };

      const existing: unknown[] = JSON.parse(localStorage.getItem('litoAi_sessions') ?? '[]');
      localStorage.setItem('litoAi_sessions', JSON.stringify([session, ...existing]));

      setProgress(100);
      await new Promise(r => setTimeout(r, 700));
      router.push(`/results?id=${id}`);
    } catch (err) {
      console.error('[handleFinalSubmit]', err);
      setIsSubmitting(false);
    }
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        No review data found. Please complete the intake form first.
      </div>
    );
  }

  if (isSubmitting) return <LoadingScreen progress={progress} />;

  const isEditing = (n: number) => editingSection === n;

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Review Your Submission</h1>
        <p className="mt-1 text-sm text-slate-400">Check each section and edit if needed before submitting.</p>
      </div>

      {/* ── Section 1: Startup Profile ───────────────────────────────────── */}
      <div className="bg-white rounded-l border border-slate-200 shadow-sm p-8">
        <SectionHeader
          title="1. Startup Profile"
          editing={isEditing(1)}
          onEdit={() => startEdit(1)}
          onConfirm={confirmEdit}
          onCancel={cancelEdit}
        />

        {isEditing(1) ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Startup Name</FieldLabel>
                <Input value={draft.startupName ?? ''} onChange={e => set('startupName', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Industry</FieldLabel>
                <Select value={draft.industry} onValueChange={v => set('industry', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Funding Stage</FieldLabel>
                <Select value={draft.fundingStage} onValueChange={v => set('fundingStage', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{FUNDING_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>Primary Geography</FieldLabel>
                <Select value={draft.primaryGeography} onValueChange={v => set('primaryGeography', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{GEOGRAPHIES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <FieldLabel>Target Customer Profile (ICP)</FieldLabel>
              <Textarea
                value={draft.targetCustomerProfile ?? ''}
                onChange={e => set('targetCustomerProfile', e.target.value)}
                className="min-h-24 resize-y"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-6">
              <ReadField label="Startup Name" value={data.startupName} />
              <ReadField label="Industry" value={data.industry} />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <ReadField label="Funding Stage" value={data.fundingStage} />
              <ReadField label="Primary Geography" value={data.primaryGeography} />
            </div>
            <ReadField label="Target Customer Profile (ICP)" value={data.targetCustomerProfile} />
          </div>
        )}
      </div>

      {/* ── Section 2: Problem & Solution ────────────────────────────────── */}
      <div className="bg-white rounded-l border border-slate-200 shadow-sm p-8">
        <SectionHeader
          title="2. Problem & Solution Definition"
          editing={isEditing(2)}
          onEdit={() => startEdit(2)}
          onConfirm={confirmEdit}
          onCancel={cancelEdit}
        />

        {isEditing(2) ? (
          <div className="space-y-5">
            <div>
              <FieldLabel>Core Problem Statement</FieldLabel>
              <Textarea
                value={draft.coreProblemStatement ?? ''}
                onChange={e => set('coreProblemStatement', e.target.value)}
                className="min-h-24 resize-y"
              />
            </div>
            <div>
              <FieldLabel>Proposed Solution Overview</FieldLabel>
              <Textarea
                value={draft.proposedSolutionOverview ?? ''}
                onChange={e => set('proposedSolutionOverview', e.target.value)}
                className="min-h-24 resize-y"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <ReadField label="Core Problem Statement" value={data.coreProblemStatement} />
            <ReadField label="Proposed Solution Overview" value={data.proposedSolutionOverview} />
          </div>
        )}
      </div>

      {/* ── Section 3: Business Model ─────────────────────────────────────── */}
      <div className="bg-white rounded-l border border-slate-200 shadow-sm p-8">
        <SectionHeader
          title="3. Business Model & Positioning"
          editing={isEditing(3)}
          onEdit={() => startEdit(3)}
          onConfirm={confirmEdit}
          onCancel={cancelEdit}
        />

        {isEditing(3) ? (
          <div className="space-y-5">
            <div>
              <FieldLabel>Revenue Model Structure</FieldLabel>
              <Select value={draft.revenueModelStructure} onValueChange={v => set('revenueModelStructure', v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{REVENUE_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>Business Model Explanation</FieldLabel>
              <Textarea
                value={draft.businessModelExplanation ?? ''}
                onChange={e => set('businessModelExplanation', e.target.value)}
                className="min-h-24 resize-y"
              />
            </div>
            <div>
              <FieldLabel>Known Competitors</FieldLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Salesforce"
                  value={competitorInput}
                  onChange={e => setCompetitorInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCompetitor(); } }}
                />
                <Button type="button" variant="outline" onClick={addCompetitor} className="shrink-0">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              {(draft.knownCompetitors ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {(draft.knownCompetitors ?? []).map(name => (
                    <span key={name} className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1 rounded-full">
                      {name}
                      <button type="button" onClick={() => removeCompetitor(name)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <FieldLabel>Competitive Differentiators</FieldLabel>
              <Textarea
                value={draft.competitiveDifferentiators ?? ''}
                onChange={e => set('competitiveDifferentiators', e.target.value)}
                className="min-h-24 resize-y"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <ReadField label="Revenue Model Structure" value={data.revenueModelStructure} />
            <ReadField label="Business Model Explanation" value={data.businessModelExplanation} />
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Known Competitors</p>
              {data.knownCompetitors?.length ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.knownCompetitors.map(name => (
                    <span key={name} className="bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1 rounded-sm">
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-slate-300 italic">—</p>
              )}
            </div>
            <ReadField label="Competitive Differentiators" value={data.competitiveDifferentiators} />
          </div>
        )}
      </div>

      {/* ── Section 4: Traction Signals (only for Seed) ──────────────────── */}
      {data.fundingStage === 'Seed' && (
        <div className="bg-white rounded-l border border-slate-200 shadow-sm p-8">
          <SectionHeader
            title="4. Traction Signals"
            editing={isEditing(4)}
            onEdit={() => startEdit(4)}
            onConfirm={confirmEdit}
            onCancel={cancelEdit}
          />

          {isEditing(4) ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Monthly Recurring Revenue (MRR)</FieldLabel>
                  <Input value={draft.monthlyRecurringRevenue ?? ''} onChange={e => set('monthlyRecurringRevenue', e.target.value)} placeholder="e.g. $120,000" />
                </div>
                <div>
                  <FieldLabel>Active Customer Count</FieldLabel>
                  <Input value={draft.activeCustomerCount ?? ''} onChange={e => set('activeCustomerCount', e.target.value)} placeholder="e.g. 42" />
                </div>
              </div>
              <div>
                <FieldLabel>Month-Over-Month Growth (%)</FieldLabel>
                <Input value={draft.monthOverMonthGrowth ?? ''} onChange={e => set('monthOverMonthGrowth', e.target.value)} placeholder="e.g. 18%" />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-6">
                <ReadField label="Monthly Recurring Revenue (MRR)" value={data.monthlyRecurringRevenue} />
                <ReadField label="Active Customer Count" value={data.activeCustomerCount} />
              </div>
              <ReadField label="Month-Over-Month Growth (%)" value={data.monthOverMonthGrowth} />
            </div>
          )}
        </div>
      )}

      {/* ── Evaluation Terms — read-only confirmation ─────────────────────── */}
      <div className="bg-white rounded-l border border-slate-200 shadow-sm p-8">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 ${data.evaluationTerms ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
            {data.evaluationTerms && <Check className="w-3 h-3 text-white" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Evaluation Terms & Confidentiality Confirmation</p>
            <p className="mt-1 text-sm text-slate-400">
              Founder accepts non-confidential evaluation terms and acknowledges that synthesis results are for internal assessment only.
            </p>
          </div>
        </div>
      </div>

      {/* ── Final Submit ──────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" className="rounded-sm border-blue-500 border text-blue-500" onClick={handleSaveAndExit}>Save & Exit</Button>
        <Button size="sm" className="rounded-sm" onClick={handleFinalSubmit} disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Evaluating…</> : 'Submit'}
        </Button>
      </div>

    </div>
  );
}
