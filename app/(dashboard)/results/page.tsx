import { Suspense } from 'react';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { ddb, s3, DYNAMO_TABLE, S3_OUTPUT_BUCKET } from '@/lib/aws-clients';
import { MemoPagination } from '@/components/results/memo-pagination';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ResultsContent({ jobId }: { jobId: string }) {
  // Fetch job from DynamoDB
  const { Item: job } = await ddb.send(
    new GetCommand({ TableName: DYNAMO_TABLE, Key: { jobId } })
  );

  if (!job) {
    return <pre className="p-8 text-red-500">Job not found: {jobId}</pre>;
  }

  // Fetch memo JSON from S3 if available
  let memo: any = null;
  if (job.memoS3Key) {
    try {
      const s3Res = await s3.send(
        new GetObjectCommand({ Bucket: S3_OUTPUT_BUCKET, Key: job.memoS3Key })
      );
      const text = await s3Res.Body?.transformToString();
      if (text) memo = JSON.parse(text);
    } catch (e) {
      memo = { error: 'Failed to fetch memo from S3', detail: String(e) };
    }
  }

  // If no memo available, show raw data
  if (!memo || memo.error) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-2">DynamoDB — lito-jobs</h2>
          <pre className="bg-slate-950 text-green-400 text-xs p-6 rounded-xl overflow-auto">
            {JSON.stringify(job, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-2">S3 — memo.json</h2>
          <pre className="bg-slate-950 text-green-400 text-xs p-6 rounded-xl overflow-auto">
            {memo ? JSON.stringify(memo, null, 2) : 'No memo available yet'}
          </pre>
        </div>
      </div>
    );
  }

  // Display formatted memo with pagination
  return <MemoPagination memo={memo} jobId={jobId} companyName={job.companyName || memo.company_name || 'Unknown'} />;
}

export default async function ResultsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const jobId = typeof params.jobId === 'string' ? params.jobId : undefined;

  if (!jobId) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        No jobId provided.
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-sm">Loading…</div>}>
      <ResultsContent jobId={jobId} />
    </Suspense>
  );
}
