'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from 'aws-amplify/auth/server';
import { QueryCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { runWithAmplifyServerContext } from '@/lib/amplify-server-utils';
import { ddb, s3, DYNAMO_TABLE, S3_INPUT_BUCKET, S3_OUTPUT_BUCKET } from '@/lib/aws-clients';
import { type Session } from '@/types';

async function getCurrentUserId(): Promise<string | null> {
  try {
    const user = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (ctx) => getCurrentUser(ctx),
    }) as { userId: string };
    return user.userId;
  } catch {
    return null;
  }
}

// Map DynamoDB item to Session type using only DynamoDB fields
// No S3 fetch — DynamoDB has everything we need for the table
function toSession(item: Record<string, unknown>): Session {
  const status = item.status as string;
  const verdict = item.verdict as string | undefined;
  const score = typeof item.score === 'number' ? item.score : 0;
  const companyName = (item.companyName as string) || 'Processing...';

  // Map verdict to risk level
  const riskLevel = verdict
    ? verdict === 'ACCEPT' ? 'STRONG'
    : verdict === 'INTERVIEW' ? 'AVERAGE'
    : verdict === 'REJECT' ? 'HIGH RISK'
    : verdict === 'PENDING' ? 'AVERAGE'
    : 'Pending'
    : status === 'COMPLETE' ? 'Unknown' : 'Pending';

  return {
    id:        item.jobId as string,
    createdAt: item.createdAt as string,
    intake: {
      company:       companyName,
      industry:      (item.industry as string) || '—',
      fundingStage:  (item.stage as string) || '—',
      primaryRegion: (item.primaryRegion as string) || undefined,
      revenueModel:  (item.revenueModel as string) || undefined,
      decision:      verdict || undefined,
      status:        status,
    },
    confidence: score,
    riskLevel:  riskLevel,
    result:     (item.result as Session['result']) || {} as Session['result'],
  };
}

export async function getSessions(): Promise<Session[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { Items = [] } = await ddb.send(new QueryCommand({
    TableName: DYNAMO_TABLE,
    IndexName: 'userId-createdAt-index',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    ScanIndexForward: false,
  }));

  return Items.map(toSession);
}

export async function getSessionById(id: string): Promise<Session | null> {
  const sessions = await getSessions();
  return sessions.find(s => s.id === id) || null;
}

export async function deleteSessions(jobIds: string[]) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, deleted: 0, error: 'Not authenticated' };
  }

  let deleted = 0;

  for (const jobId of jobIds) {
    try {
      const { Item: job } = await ddb.send(
        new GetCommand({ TableName: DYNAMO_TABLE, Key: { jobId } })
      );

      if (!job) continue;

      if (job.userId !== userId) {
        console.warn(`User ${userId} attempted to delete job ${jobId} owned by ${job.userId}`);
        continue;
      }

      await ddb.send(new DeleteCommand({ TableName: DYNAMO_TABLE, Key: { jobId } }));

      if (job.inputS3Key) {
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: S3_INPUT_BUCKET, Key: job.inputS3Key as string }));
        } catch (err) {
          console.error(`Failed to delete input S3 object:`, err);
        }
      }

      if (job.memoS3Key) {
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: S3_OUTPUT_BUCKET, Key: job.memoS3Key as string }));
        } catch (err) {
          console.error(`Failed to delete memo S3 object:`, err);
        }
      }

      deleted++;
    } catch (err) {
      console.error(`Failed to delete job ${jobId}:`, err);
    }
  }

  revalidatePath('/');
  return { success: true, deleted };
}

export async function upsertSession(_session: Session) { return _session; }
export async function deleteAllSessions() { return { success: true }; }