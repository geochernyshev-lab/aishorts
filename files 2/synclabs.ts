const SYNCLABS_API_URL = "https://api.sync.so/v2";

export interface SyncLabsJobResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  outputUrl?: string;
  error?: string;
}

/**
 * Submit a lip-sync job to SyncLabs.
 * Combines original video visuals with dubbed audio.
 */
export async function submitSyncLabsJob({
  videoUrl,
  audioUrl,
  webhookUrl,
}: {
  videoUrl: string;
  audioUrl: string;
  webhookUrl: string;
}): Promise<SyncLabsJobResponse> {
  const apiKey = process.env.SYNCLABS_API_KEY;
  if (!apiKey) throw new Error("Missing SYNCLABS_API_KEY");

  const response = await fetch(`${SYNCLABS_API_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      videoUrl,
      audioUrl,
      synergize: true,    // enhanced lip movement quality
      webhookUrl,
      model: "sync-1.9.0-beta", // latest available model
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`SyncLabs job submission failed: ${err}`);
  }

  return response.json() as Promise<SyncLabsJobResponse>;
}

/**
 * Get the status of a SyncLabs lip-sync job.
 */
export async function getSyncLabsJobStatus(
  jobId: string
): Promise<SyncLabsJobResponse> {
  const apiKey = process.env.SYNCLABS_API_KEY;
  if (!apiKey) throw new Error("Missing SYNCLABS_API_KEY");

  const response = await fetch(`${SYNCLABS_API_URL}/generate/${jobId}`, {
    headers: { "x-api-key": apiKey },
  });

  if (!response.ok) {
    throw new Error(`Failed to get SyncLabs job status: ${await response.text()}`);
  }

  return response.json() as Promise<SyncLabsJobResponse>;
}
