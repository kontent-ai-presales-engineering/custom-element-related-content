import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useConfig, useEnvironmentId, useItemInfo } from "./customElement/CustomElementContext";
import { fetchRelatedItems, RelatedItem } from "./api/deliveryApi";

// ─── Workflow step → badge appearance ────────────────────────────────────────

type BadgeStyle = { bg: string; ring: string; dot: string; label: string };

const WORKFLOW_BADGES: Record<string, BadgeStyle> = {
  draft: {
    bg: "bg-gray-100",
    ring: "ring-gray-200",
    dot: "bg-gray-400",
    label: "Draft",
  },
  review: {
    bg: "bg-orange-50",
    ring: "ring-orange-200",
    dot: "bg-orange-400",
    label: "Review",
  },
  ready_to_publish: {
    bg: "bg-blue-50",
    ring: "ring-blue-200",
    dot: "bg-blue-500",
    label: "Approved",
  },
  approved: {
    bg: "bg-blue-50",
    ring: "ring-blue-200",
    dot: "bg-blue-500",
    label: "Approved",
  },
  published: {
    bg: "bg-green-50",
    ring: "ring-green-200",
    dot: "bg-green-500",
    label: "Published",
  },
  scheduled: {
    bg: "bg-purple-50",
    ring: "ring-purple-200",
    dot: "bg-purple-500",
    label: "Scheduled",
  },
  archived: {
    bg: "bg-red-50",
    ring: "ring-red-200",
    dot: "bg-red-400",
    label: "Archived",
  },
};

const DEFAULT_BADGE: BadgeStyle = {
  bg: "bg-gray-100",
  ring: "ring-gray-200",
  dot: "bg-gray-400",
  label: "",
};

const getBadge = (step: string): BadgeStyle => {
  const key = step.toLowerCase().replace(/\s+/g, "_");
  const match = WORKFLOW_BADGES[key];
  return match ?? { ...DEFAULT_BADGE, label: step };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const deepLink = (projectId: string, languageCodename: string, itemId: string) =>
  `https://app.kontent.ai/goto/edit-item/project/${projectId}/variant-codename/${languageCodename}/item/${itemId}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ─── Sub-components ───────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-12">
    <svg
      className="h-8 w-8 animate-spin text-purple-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <span className="text-sm text-gray-400">Loading linked items…</span>
  </div>
);

const ErrorBanner = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4">
    <div className="flex items-start gap-3">
      <svg
        className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-red-800">Failed to load linked items</p>
        <p className="mt-1 break-words text-sm text-red-700">{message}</p>
      </div>
    </div>
    <button
      onClick={onRetry}
      className="mt-3 text-sm font-medium text-red-700 underline hover:text-red-900"
    >
      Try again
    </button>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <svg
      className="mb-3 h-12 w-12 text-gray-200"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
    <p className="text-sm text-gray-400">
      No variants or derivatives are currently linked to this core snippet.
    </p>
  </div>
);

const WorkflowBadge = ({ step }: { step: string }) => {
  const badge = getBadge(step);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${badge.bg} ${badge.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
      {badge.label}
    </span>
  );
};

const ItemRow = ({ item, projectId }: { item: RelatedItem; projectId: string }) => (
  <li>
    <a
      href={deepLink(projectId, item.language, item.id)}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
        <p className="mt-0.5 text-xs text-gray-400">
          {item.language} · {formatDate(item.lastModified)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <WorkflowBadge step={item.workflowStep} />
        <svg
          className="h-4 w-4 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </div>
    </a>
  </li>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const IntegrationApp = () => {
  const config = useConfig();
  const projectId = useEnvironmentId();
  const item = useItemInfo();

  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRelatedItems(
        projectId,
        config.apiKey,
        config.linkedItemsElementCodename,
        item.codename,
      );
      setRelatedItems(result.items);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [projectId, config.apiKey, config.linkedItemsElementCodename, item.codename]);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep the iframe height in sync with actual rendered content
  useLayoutEffect(() => {
    const height = Math.max(document.documentElement.offsetHeight, 100);
    CustomElement.setHeight(Math.ceil(height));
  }, [loading, error, relatedItems]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} onRetry={() => void load()} />;
  if (relatedItems.length === 0) return <EmptyState />;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-600">
          Linked Variants &amp; Derivatives
          <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
            {relatedItems.length}
            {totalCount > relatedItems.length ? ` of ${totalCount}+` : ""}
          </span>
        </h2>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Refresh"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Item list */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <ul className="divide-y divide-gray-100">
          {relatedItems.map(ri => (
            <ItemRow key={`${ri.id}-${ri.language}`} item={ri} projectId={projectId} />
          ))}
        </ul>
      </div>

      {/* Pagination notice */}
      {totalCount > relatedItems.length && (
        <p className="mt-3 text-center text-xs text-gray-400">
          Showing first {relatedItems.length} of {totalCount} items. Narrow your results using the
          Delivery API filters if needed.
        </p>
      )}
    </div>
  );
};

IntegrationApp.displayName = "IntegrationApp";
