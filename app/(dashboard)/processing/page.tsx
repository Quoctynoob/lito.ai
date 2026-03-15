"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { fetchAuthSession } from "aws-amplify/auth";

// Map DynamoDB currentStep strings to step indices
// Each entry is a substring to match against the currentStep value
const STEPS = [
  { match: "Researching",         label: "Researching company background", agent: "Agent 0" },
  { match: "Extracting content",  label: "Extracting PDF content",          agent: "Agent 1" },
  { match: "Extracting VC",       label: "Identifying key claims",          agent: "Agent 2" },
  { match: "Fact-checking",       label: "Fact-checking with web search",   agent: "Agent 3" },
  { match: "Fundability",         label: "Scoring TFI metrics",             agent: "Agent 4" },
  { match: "Generating",          label: "Generating investment memo",      agent: "Agent 5" },
  { match: "Writing memo",        label: "Generating investment memo",      agent: "Agent 5" },
  { match: "Memo generated",      label: "Generating investment memo",      agent: "Agent 5" },
];

const DISPLAY_STEPS = [
  { label: "Researching company background", agent: "Agent 0" },
  { label: "Extracting PDF content",          agent: "Agent 1" },
  { label: "Identifying key claims",          agent: "Agent 2" },
  { label: "Fact-checking with web search",   agent: "Agent 3" },
  { label: "Scoring TFI metrics",             agent: "Agent 4" },
  { label: "Generating investment memo",      agent: "Agent 5" },
];

function getStepIndex(currentStep: string | null, status: string): number {
  if (!currentStep) return -1;
  if (status === "COMPLETE") return DISPLAY_STEPS.length; // all done

  const step = STEPS.find((s) =>
    currentStep.toLowerCase().includes(s.match.toLowerCase())
  );
  if (!step) return 0;

  // Map back to display steps index
  return DISPLAY_STEPS.findIndex((d) => d.label === step.label);
}

function useAuthToken() {
  const [token, setToken] = useState<string>("");
  useEffect(() => {
    fetchAuthSession()
      .then((s) => setToken(s.tokens?.accessToken?.toString() ?? ""))
      .catch(() => setToken(""));
  }, []);
  return token;
}

function JobProgressCard({ jobId, token }: { jobId: string; token: string }) {
  const router = useRouter();

  const { data, error } = useSWR(
    token ? [`/api/job-status?jobId=${jobId}`, token] : null,
    ([url, tok]) =>
      fetch(url, { headers: { Authorization: tok } }).then((r) => r.json()),
    { refreshInterval: 3000 }
  );

  const status = data?.status ?? "PROCESSING";
  const currentStep = data?.currentStep ?? null;
  const currentIndex = getStepIndex(currentStep, status);
  const failed = status === "FAILED" || !!error;
  const complete = status === "COMPLETE";

  return (
    <div className="border border-slate-200 rounded-lg p-6 bg-white">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900">
          {data?.companyName ?? "Processing..."}
        </h3>
        <p className="text-xs text-slate-500 mt-1">Job {jobId.slice(0, 8)}…</p>
        {currentStep && (
          <p className="text-xs text-blue-500 mt-1 truncate">{currentStep}</p>
        )}
      </div>

      {/* Progress Steps */}
      <ol className="space-y-3">
        {DISPLAY_STEPS.map((step, i) => {
          const isDone = currentIndex > i || complete;
          const isActive = currentIndex === i && !complete && !failed;

          return (
            <li key={step.label} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                    ✓
                  </span>
                ) : isActive ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  </span>
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-300 text-[10px]">
                    {i + 1}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-xs font-medium ${
                    isDone
                      ? "text-emerald-600"
                      : isActive
                      ? "text-blue-600"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-slate-400">{step.agent}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Status Messages */}
      {failed && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          Pipeline failed. Please try again or contact support.
        </div>
      )}

      {complete && (
        <div className="mt-4">
          <Button
            size="sm"
            className="w-full"
            onClick={() =>
              (window.location.href = `/results?jobId=${jobId}&page=1`)
            }
          >
            View Results
          </Button>
        </div>
      )}

      {!data && !error && (
        <p className="mt-4 text-xs text-slate-400 animate-pulse">
          Connecting to pipeline…
        </p>
      )}
    </div>
  );
}

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAuthToken();

  const singleJobId = searchParams.get("jobId");
  const multipleJobIds = searchParams.get("jobIds");

  const jobIds = multipleJobIds
    ? multipleJobIds.split(",").filter(Boolean)
    : singleJobId
    ? [singleJobId]
    : [];

  if (jobIds.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        No job IDs provided.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Analyzing{" "}
          {jobIds.length > 1 ? `${jobIds.length} pitch decks` : "your pitch deck"}
        </h1>
        <p className="text-sm text-slate-500">
          You can navigate away from this page anytime. Your analyses will
          continue running in the background.
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push("/")}>
          View Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobIds.map((jobId) => (
          <JobProgressCard key={jobId} jobId={jobId} token={token} />
        ))}
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense>
      <ProcessingContent />
    </Suspense>
  );
}