"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";

const STEPS = [
  { key: "extract",   label: "Extracting PDF content",      agent: "Agent 1" },
  { key: "claims",    label: "Identifying key claims",       agent: "Agent 2" },
  { key: "factcheck", label: "Fact-checking with web search", agent: "Agent 3" },
  { key: "score",     label: "Scoring TFI metrics",          agent: "Agent 4" },
  { key: "memo",      label: "Generating investment memo",   agent: "Agent 5" },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  const { data, error } = useSWR(
    jobId ? `/api/job-status?jobId=${jobId}` : null,
    fetcher,
    {
      refreshInterval: (data) => {
        if (!data) return 2000;
        if (data.status === "COMPLETE" || data.status === "FAILED") return 0;
        return 2000;
      },
      onSuccess(data) {
        if (data?.status === "COMPLETE" && data?.memoS3Key) {
          router.push(`/results?jobId=${jobId}`);
        }
      },
    }
  );

  if (!jobId) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        No job ID provided.
      </div>
    );
  }

  const currentStep = data?.currentStep ?? null;
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
  const failed = data?.status === "FAILED" || !!error;

  return (
    <div className="max-w-lg mx-auto mt-20 px-4">
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">
        Analyzing your pitch deck
      </h1>
      <p className="text-sm text-slate-500 mb-10">
        {data?.companyName ?? "Your company"} · Job {jobId.slice(0, 8)}…
      </p>

      <ol className="space-y-4">
        {STEPS.map((step, i) => {
          const isDone = currentIndex > i || data?.status === "COMPLETE";
          const isActive = currentIndex === i;
          const isPending = currentIndex < i && data?.status !== "COMPLETE";

          return (
            <li key={step.key} className="flex items-start gap-4">
              {/* Status dot */}
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                    ✓
                  </span>
                ) : isActive ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                  </span>
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-300 text-xs">
                    {i + 1}
                  </span>
                )}
              </div>

              {/* Label */}
              <div>
                <p
                  className={`text-sm font-medium ${
                    isDone
                      ? "text-emerald-600"
                      : isActive
                      ? "text-blue-600"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-slate-400">{step.agent}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {failed && (
        <div className="mt-10 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          The pipeline failed. Please try uploading again or contact support.
        </div>
      )}

      {!data && !error && (
        <p className="mt-10 text-xs text-slate-400 animate-pulse">
          Connecting to pipeline…
        </p>
      )}
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
