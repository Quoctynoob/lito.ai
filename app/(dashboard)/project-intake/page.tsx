'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const formSchema = z.object({
  startupName:              z.string().min(1, 'Startup name is required'),
  industry:                 z.string().min(1, 'Industry is required'),
  fundingStage:             z.string().min(1, 'Funding stage is required'),
  primaryGeography:         z.string().min(1, 'Primary geography is required'),
  targetCustomerProfile:    z.string().min(10, 'Please provide at least a brief ICP description'),
  coreProblemStatement:     z.string().min(10, 'Please describe the core problem'),
  proposedSolutionOverview: z.string().min(10, 'Please describe your proposed solution'),
  revenueModelStructure:    z.string().min(1, 'Revenue model is required'),
  businessModelExplanation: z.string().min(10, 'Please explain your business model'),
  knownCompetitors:           z.array(z.string()).optional(),
  competitiveDifferentiators: z.string().min(10, 'Please describe your competitive differentiators'),
  // Card 4 — only collected when fundingStage === 'Seed'
  monthlyRecurringRevenue:    z.string().optional(),
  activeCustomerCount:        z.string().optional(),
  monthOverMonthGrowth:       z.string().optional(),
  // Last card — always required
  evaluationTerms:            z.boolean().refine(val => val === true, {
    message: 'You must accept the evaluation terms to proceed',
  }),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Dropdown options ─────────────────────────────────────────────────────────

const INDUSTRIES = [
  'AI/Machine Learning',
  'Fintech',
  'HealthTech/BioTech',
  'Climate/Energy',
  'Enterprise Saas/B2B Tools',
  'Consumer/Marketplace',
  'Other',
];

const FUNDING_STAGES = [
  'Idea',
  'Pre-Seed',
  'Seed',
];

const GEOGRAPHIES = [
  'North America',
  'Latin America',
  'Europe',
  'Middle East & Africa',
  'South Asia',
  'East Asia',
  'Southeast Asia',
  'Oceania',
  'Global',
  'Other',
];

const REVENUE_MODELS = [
  'SaaS / Subscription',
  'Marketplace / Transaction Fee',
  'Freemium',
  'License',
  'Usage-Based / Pay-per-use',
  'E-commerce / Direct Sales',
  'Consulting / Services',
  'Advertising',
  'Other',
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectIntake() {
  const router = useRouter();
  const [competitorInput, setCompetitorInput] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startupName:              '',
      industry:                 '',
      fundingStage:             '',
      primaryGeography:         '',
      targetCustomerProfile:    '',
      coreProblemStatement:     '',
      proposedSolutionOverview: '',
      revenueModelStructure:    '',
      businessModelExplanation: '',
      knownCompetitors:           [],
      competitiveDifferentiators: '',
      monthlyRecurringRevenue:    '',
      activeCustomerCount:        '',
      monthOverMonthGrowth:       '',
      evaluationTerms:            false,
    },
  });

  function addCompetitor() {
    const trimmed = competitorInput.trim();
    if (!trimmed) return;
    const current = form.getValues('knownCompetitors') ?? [];
    if (current.includes(trimmed)) return;
    form.setValue('knownCompetitors', [...current, trimmed]);
    setCompetitorInput('');
  }

  function removeCompetitor(name: string) {
    const current = form.getValues('knownCompetitors') ?? [];
    form.setValue('knownCompetitors', current.filter((c) => c !== name));
  }

  const fundingStage = form.watch('fundingStage');

  function onSubmit(values: FormValues) {
    localStorage.setItem('litoAi_intake', JSON.stringify(values));
    router.push('/project-intake/review');
  }

  function saveAndExit() {
    localStorage.setItem('litoAi_intake', JSON.stringify(form.getValues()));
    router.push('/');
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h1 className='text-2xl font-semibold'>New Project Intake Summary</h1>

        {/* ── Card 1: Startup Profile ─────────────────────────────────────── */}
        <div className="bg-white rounded-l border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-900">1. Startup Profile</h2>
          <p className="mt-1 mb-6 text-sm text-slate-400">Required Fields <span className="text-red-500">*</span></p>

          <div className="space-y-5">

            {/* Startup Name + Industry — side by side */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startupName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Startup Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. VentureScope" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Funding Stage + Primary Geography — side by side */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fundingStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Stage <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a funding stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FUNDING_STAGES.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primaryGeography"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Geography <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GEOGRAPHIES.map((geo) => (
                          <SelectItem key={geo} value={geo}>
                            {geo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Target Customer Profile / ICP */}
            <FormField
              control={form.control}
              name="targetCustomerProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Customer Profile (ICP) <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the ideal customer company size, industry, and decision-maker roles..."
                      className="min-h-32 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>
        </div>

        {/* ── Card 2: Problem & Solution Definition ───────────────────────── */}
        <div className="bg-white rounded-l border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-900">2. Problem & Solution Definition</h2>
          <p className="mt-1 mb-6 text-sm text-slate-400">Required Fields <span className="text-red-500">*</span></p>

          <div className="space-y-5">

            {/* Core Problem Statement */}
            <FormField
              control={form.control}
              name="coreProblemStatement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Core Problem Statement <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the core market inefficiency or pain point being addressed..."
                      className="min-h-32 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Proposed Solution Overview */}
            <FormField
              control={form.control}
              name="proposedSolutionOverview"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposed Solution Overview <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the product or service and its primary value proposition..."
                      className="min-h-32 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>
        </div>

        {/* ── Card 3: Business Model & Positioning ────────────────────────── */}
        <div className="bg-white rounded-l border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-900">3. Business Model & Positioning</h2>
          <p className="mt-1 mb-6 text-sm text-slate-400">Required Fields <span className="text-red-500">*</span></p>

          <div className="space-y-5">

            {/* Revenue Model Structure */}
            <FormField
              control={form.control}
              name="revenueModelStructure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revenue Model Structure <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a revenue model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REVENUE_MODELS.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Business Model Explanation */}
            <FormField
              control={form.control}
              name="businessModelExplanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Model Explanation <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe how the company generates revenue, pricing tiers, and scalability..."
                      className="min-h-32 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Known Competitors — dynamic tag list */}
            <FormItem>
              <FormLabel>Known Competitors</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Planful"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCompetitor(); } }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCompetitor}
                  className="shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              {/* Competitor chips */}
              {(() => {
                const competitors = form.watch('knownCompetitors') ?? [];
                return competitors.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {competitors.map((name) => (
                      <span
                        key={name}
                        className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1 rounded-sm"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => removeCompetitor(name)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null;
              })()}
            </FormItem>

            {/* Competitive Differentiators */}
            <FormField
              control={form.control}
              name="competitiveDifferentiators"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competitive Differentiators <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the unique techincal edge or strategic advantage..."
                      className="min-h-32 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>
        </div>

        {/* ── Card 4: Traction Signals — only shown when Seed is selected ── */}
        {fundingStage === 'Seed' && (
          <div className="bg-white rounded-l border border-slate-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-900">4. Traction Signals</h2>
            <p className="mt-1 mb-6 text-sm text-slate-400">Shown because you selected Seed stage</p>

            <div className="space-y-5">

              {/* MRR + Active Customer Count — side by side */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthlyRecurringRevenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Recurring Revenue (MRR)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. $120,000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activeCustomerCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Active Customer Count</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 42" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Month-Over-Month Growth */}
              <FormField
                control={form.control}
                name="monthOverMonthGrowth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month-Over-Month Growth (%)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 18%" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
          </div>
        )}

        {/* ── Last Card: Evaluation Terms ──────────────────────────────────── */}
        <div className="bg-white rounded-l border border-slate-200 shadow-sm p-8">

          <FormField
            control={form.control}
            name="evaluationTerms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="text-sm font-semibold text-slate-800 cursor-pointer">
                      Evaluation Terms & Confidentiality Confirmation <span className="text-red-500">*</span>
                    </FormLabel>
                    <p className="mt-1 text-sm text-slate-400">
                      Founder accepts non-confidential evaluation terms and acknowledges that synthesis results are for internal assessment only.
                    </p>
                  </div>
                </div>
                <FormMessage className="mt-2" />
              </FormItem>
            )}
          />
        </div>

        {/* ── Submit — outside all cards ───────────────────────────────────── */}
        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="outline" className="rounded-sm border-blue-500 border text-blue-500" onClick={saveAndExit}>Save & Exit</Button>
          <Button type="submit" size="sm" className="bg-blue-500 rounded-sm">Review Fields</Button>
        </div>

      </form>
    </Form>
  );
}
