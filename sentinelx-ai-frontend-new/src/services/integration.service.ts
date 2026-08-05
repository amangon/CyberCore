import { INTEGRATION_MOCK_DATA, INTEGRATION_SUMMARY } from "@/data/integrationMock";
import type { Integration, IntegrationSummary } from "@/types/integration";

export async function getIntegrationSummary(): Promise<IntegrationSummary> {
  return Promise.resolve(INTEGRATION_SUMMARY);
}

export async function getIntegrations(): Promise<Integration[]> {
  return Promise.resolve(INTEGRATION_MOCK_DATA);
}

export async function getIntegrationById(id: string): Promise<Integration | null> {
  return Promise.resolve(INTEGRATION_MOCK_DATA.find((integration) => integration.id === id) ?? null);
}

export async function toggleIntegration(id: string): Promise<Integration | null> {
  const integration = INTEGRATION_MOCK_DATA.find((item) => item.id === id);
  if (!integration) {
    return null;
  }

  return Promise.resolve({
    ...integration,
    isEnabled: !integration.isEnabled,
    status: integration.isEnabled ? "pending" : "active",
  });
}
