export interface RelatedItem {
  id: string;
  name: string;
  codename: string;
  language: string;
  workflowStep: string;
  contentType: string;
  lastModified: string;
}

interface DeliverySystem {
  id: string;
  name: string;
  codename: string;
  language: string;
  type: string;
  workflow: string;
  workflow_step: string;
  last_modified: string;
}

interface DeliveryResponseItem {
  system: DeliverySystem;
  elements: Record<string, unknown>;
}

interface DeliveryApiResponse {
  items: DeliveryResponseItem[];
  pagination: {
    skip: number;
    limit: number;
    count: number;
    total_count: number;
    next_page: string;
  };
}

export const fetchRelatedItems = async (
  projectId: string,
  apiKey: string,
  elementCodename: string,
  itemCodename: string,
): Promise<{ items: RelatedItem[]; totalCount: number }> => {
  // Manually build query to avoid bracket-encoding that some API proxies reject
  const query = [
    `elements.${elementCodename}[contains]=${encodeURIComponent(itemCodename)}`,
    `depth=0`,
    `limit=100`,
  ].join("&");

  const response = await fetch(
    `https://preview-deliver.kontent.ai/${projectId}/items?${query}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Delivery API responded with ${response.status} ${response.statusText}${body ? `: ${body}` : ""}`,
    );
  }

  const data: DeliveryApiResponse = await response.json();

  return {
    items: data.items.map(item => ({
      id: item.system.id,
      name: item.system.name,
      codename: item.system.codename,
      language: item.system.language,
      workflowStep: item.system.workflow_step,
      contentType: item.system.type,
      lastModified: item.system.last_modified,
    })),
    totalCount: data.pagination.total_count ?? data.items.length,
  };
};
