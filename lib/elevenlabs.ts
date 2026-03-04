const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

export interface DubbingResponse {
  dubbing_id: string;
  expected_duration_sec: number;
}

export interface DubbingStatusResponse {
  dubbing_id: string;
  status: "dubbing" | "dubbed" | "failed";
  target_languages: string[];
}

/**
 * Start a dubbing job using ElevenLabs API.
 * Preserves voice characteristics and intonation.
 */
export async function startElevenLabsDubbing({
  videoUrl,
  targetLanguage,
  sourceLanguage = "auto",
}: {
  videoUrl: string;
  targetLanguage: string;
  sourceLanguage?: string;
}): Promise<DubbingResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");

  const formData = new FormData();
  formData.append("target_lang", targetLanguage);
  formData.append("source_lang", sourceLanguage);
  formData.append("source_url", videoUrl);
  // Preserve original speaker's voice timbre + intonation
  formData.append("num_speakers", "0"); // auto-detect
  formData.append("watermark", "true");
  formData.append("dubbing_studio", "false"); // faster non-studio mode

  const response = await fetch(`${ELEVENLABS_API_URL}/dubbing`, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs dubbing failed: ${err}`);
  }

  return response.json() as Promise<DubbingResponse>;
}

/**
 * Poll dubbing status until complete, then return dubbed audio URL.
 */
export async function waitForDubbingComplete(
  dubbingId: string,
  targetLanguage: string,
  maxWaitMs = 300_000,
  pollIntervalMs = 5_000
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");

  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${ELEVENLABS_API_URL}/dubbing/${dubbingId}`, {
      headers: { "xi-api-key": apiKey },
    });

    if (!res.ok) throw new Error(`Failed to get dubbing status: ${await res.text()}`);

    const status = (await res.json()) as DubbingStatusResponse;

    if (status.status === "dubbed") {
      // Return the audio download URL
      return `${ELEVENLABS_API_URL}/dubbing/${dubbingId}/audio/${targetLanguage}`;
    }

    if (status.status === "failed") {
      throw new Error(`ElevenLabs dubbing job ${dubbingId} failed`);
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  throw new Error(`ElevenLabs dubbing timed out after ${maxWaitMs}ms`);
}

/**
 * Download dubbed audio as ArrayBuffer.
 */
export async function downloadDubbedAudio(audioUrl: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");

  const res = await fetch(audioUrl, {
    headers: { "xi-api-key": apiKey },
  });

  if (!res.ok) throw new Error(`Failed to download dubbed audio: ${await res.text()}`);

  return res.arrayBuffer();
}
