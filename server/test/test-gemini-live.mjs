import '../src/config/env.js';
import { env } from '../src/config/env.js';
import { generatePost, classifyGeminiError } from '../src/services/ai.service.js';

async function runLiveGeminiOptInTest() {
  console.log('====================================================');
  console.log('LOOPLY — OPT-IN LIVE GOOGLE GEMINI TEST');
  console.log('====================================================\n');

  // 1. Enforce strict opt-in environment flag
  if (process.env.RUN_LIVE_GEMINI_TESTS !== 'true') {
    console.error('❌ LIVE GEMINI TEST BLOCKED: Opt-in flag required.');
    console.error('To run live Gemini tests, explicitly set: RUN_LIVE_GEMINI_TESTS=true');
    console.error('Example (PowerShell): $env:RUN_LIVE_GEMINI_TESTS="true"; npm run test:gemini-live\n');
    process.exit(1);
  }

  // 2. Validate API key presence without ever printing it
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ CONFIGURATION ERROR: GEMINI_API_KEY is not configured in server/.env.');
    process.exit(1);
  }

  const configuredModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  console.log(`Target Model: ${configuredModel}`);
  console.log('Dispatching exactly ONE real API request to Google Gemini...\n');

  const startTime = Date.now();
  try {
    // Exactly ONE live call — no automated retries
    const result = await generatePost({
      topic: 'Looply platform launch',
      context: 'A community welcome for developers and creators',
      tone: 'casual',
      length: 'short'
    });

    const latencyMs = Date.now() - startTime;
    console.log('====================================================');
    console.log('GEMINI LIVE TEST RESULT: SUCCESS (HTTP 200)');
    console.log('====================================================');
    console.log(`Status: ACTIVE`);
    console.log(`Model: ${result.model || configuredModel}`);
    console.log(`Provider: ${result.provider}`);
    console.log(`Latency: ${latencyMs} ms`);
    console.log(`Generated Text Preview: "${result.generatedContent.slice(0, 100)}..."`);
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const classified = classifyGeminiError(err, configuredModel);

    console.log('====================================================');
    console.log(`GEMINI LIVE TEST RESULT: FAILED (HTTP ${classified.status})`);
    console.log('====================================================');
    console.log(`Status: ${classified.status}`);
    console.log(`Code: ${classified.code}`);
    console.log(`Category: ${classified.category}`);
    console.log(`Model: ${classified.model}`);
    console.log(`Latency: ${latencyMs} ms`);
    console.log(`Message: ${classified.message}`);
    if (classified.retryAfter) {
      console.log(`Retry-After: ${classified.retryAfter} seconds`);
    }

    if (classified.status === 429) {
      console.log('\n[Explanation] Google Gemini API was reached successfully, but the configured key has reached its request/quota limit on Google AI Studio.');
      console.log('No automated retries were executed. Live tests will resume once the quota window resets.');
    } else if (classified.status === 402) {
      console.log('\n[Explanation] Google Gemini API returned HTTP 402 Payment Required: Prepaid credits depleted or billing project disabled.');
    } else if (classified.status === 403) {
      console.log('\n[Explanation] Google Gemini API returned HTTP 403 Forbidden: Project permissions or billing restriction.');
    }
    console.log('====================================================\n');

    process.exit(1);
  }
}

runLiveGeminiOptInTest();

