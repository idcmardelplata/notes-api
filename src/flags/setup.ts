import { OpenFeature } from '@openfeature/server-sdk';
import { GoFeatureFlagProvider } from '@openfeature/go-feature-flag-provider';
import type { Client } from '@openfeature/server-sdk';

export async function setupFeatureFlags(): Promise<Client | null> {
  try {
    const endpoint = process.env.FLAG_ENDPOINT ?? 'http://localhost:1031';
    const goFeatureFlagProvider = new GoFeatureFlagProvider({
      endpoint,
      flagChangePollingIntervalMs: 1000,
    });

    await OpenFeature.setProviderAndWait(goFeatureFlagProvider);
    return OpenFeature.getClient();
  } catch (err) {
    console.warn('Feature flag provider unavailable, running without flags:', err);
    return null;
  }
}
