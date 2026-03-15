import { NextRequest, NextResponse } from "next/server";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, DYNAMO_TABLE } from "@/lib/aws-clients";

function userIdFromToken(req: NextRequest): string {
  const token = req.headers.get("authorization") ?? "";
  if (!token) return "anonymous";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? "anonymous";
  } catch {
    return "anonymous";
  }
}

// GET /api/job-status?jobId=xxx
// Returns: { jobId, status, currentStep, companyName, score, verdict, memoS3Key }
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  const userId = userIdFromToken(req);

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const { Item } = await ddb.send(
    new GetCommand({
      TableName: DYNAMO_TABLE,
      Key: { jobId },
    })
  );

  if (!Item) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Security: user can only see their own jobs
  if (Item.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({
    jobId: Item.jobId,
    status: Item.status,
    currentStep: Item.currentStep,
    companyName: Item.companyName,
    score: Item.score,
    verdict: Item.verdict,
    memoS3Key: Item.memoS3Key,
    createdAt: Item.createdAt,
    updatedAt: Item.updatedAt,
  });
}
