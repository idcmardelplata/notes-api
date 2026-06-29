import { OpenFeature } from '@openfeature/server-sdk';
import { GoFeatureFlagProvider } from '@openfeature/go-feature-flag-provider';

export async function setupFeatureFlags() {
  const goFeatureFlagProvider = new GoFeatureFlagProvider({
    endpoint: 'http://localhost:1031',
  });

  await OpenFeature.setProviderAndWait(goFeatureFlagProvider);

  return OpenFeature.getClient();
}


