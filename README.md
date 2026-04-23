[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

[![Discord][discord-shield]][discord-url]

# Reverse Link Viewer — Kontent.ai Custom Element

A read-only Custom Element for [Kontent.ai](https://kontent.ai/) that displays all content items (Variants, Derivatives, etc.) that link back to the current **Core Snippet** via a specific Linked Items element.

Place this element on a **Core Snippet** content type and it will automatically query the Delivery Preview API for every item that references that snippet, then render them as a clickable list with workflow-status badges and direct deep-links into the Kontent.ai app.

---

## Features

- **Reverse-link discovery** — finds every content item that has linked to the current Core Snippet through a configurable Linked Items element.
- **Workflow status badges** — color-coded indicators (Draft, Review, Approved, Published, Scheduled, Archived) derived from each item's workflow step.
- **Deep-link navigation** — click any row to open that content item directly in the Kontent.ai editor in a new tab.
- **Dynamic height** — the iframe resizes to fit the list; no scrollbars inside the element.
- **Loading / empty / error states** — clear feedback in every scenario with a one-click retry on errors.
- **Refresh button** — re-fetches the list on demand without a full page reload.

---

## Screenshots

| State | Description |
|---|---|
| Loading spinner | Shown while the Delivery Preview API request is in-flight |
| Item list | Name · language · last-modified · workflow badge · open-in-editor icon |
| Empty state | Friendly message when no items link to the snippet |
| Error state | API error message with a **Try again** button |

---

## Getting Started

### 1. Install dependencies

```bash
npm ci
```

### 2. Run locally

```bash
npm run dev
```

The dev server starts at `https://localhost:5173` (self-signed SSL, required by the Custom Element iframe sandbox).

### 3. Build for deployment

```bash
npm run build
```

The production bundle is written to `dist/`. Deploy to any static host (GitHub Pages, Vercel, Netlify, Azure Static Web Apps, etc.) and use the hosted URL as the Custom Element URL in Kontent.ai.

---

## Configuration

When you add this element to a **Core Snippet** content type in Kontent.ai, supply the following JSON in the **Configuration** field:

```json
{
  "apiKey": "<your-preview-delivery-api-key>",
  "linkedItemsElementCodename": "<codename-of-the-linked-items-element>"
}
```

| Field | Type | Description |
|---|---|---|
| `apiKey` | `string` | **Preview Delivery API key** for your Kontent.ai environment. Found under *Project settings → API keys → Preview Delivery API*. |
| `linkedItemsElementCodename` | `string` | The codename of the **Linked Items** element on your Variant / Derivative content types that stores the reference to the Core Snippet. For example `core_snippet`. |

### Example configuration

Suppose your Variant content type has a Linked Items element whose codename is `core_snippet`. Your config would be:

```json
{
  "apiKey": "ey...",
  "linkedItemsElementCodename": "core_snippet"
}
```

The element will then query:

```
GET https://preview-deliver.kontent.ai/{projectId}/items
    ?elements.core_snippet[contains]={currentItemCodename}
    &depth=0
    &limit=100
```

---

## How it works

```
CustomElement.init()
      │
      ▼
 Reads projectId, item.codename from context
 Reads apiKey + linkedItemsElementCodename from config
      │
      ▼
 fetchRelatedItems() → Delivery Preview API
      │
      ▼
 Renders list of RelatedItem rows
 Each row: Name | Language | Last modified | WorkflowBadge | ↗ deep-link
```

### Deep-link URL format

```
https://app.kontent.ai/goto/edit-item/project/{projectId}/variant-codename/{languageCodename}/item/{itemId}
```

`languageCodename` and `itemId` come directly from the Delivery API response (`system.language` and `system.id`), so each row correctly links to its own language variant.

### Workflow badge colors

| Step codename(s) | Color | Label |
|---|---|---|
| `draft` | Gray | Draft |
| `review` | Orange | Review |
| `ready_to_publish`, `approved` | Blue | Approved |
| `published` | Green | Published |
| `scheduled` | Purple | Scheduled |
| `archived` | Red | Archived |
| *(anything else)* | Gray | *(step codename as-is)* |

---

## Project structure

```
src/
├── api/
│   └── deliveryApi.ts          # Delivery Preview API fetching + response types
├── customElement/
│   ├── config.ts               # Config type (apiKey, linkedItemsElementCodename)
│   ├── value.ts                # Value type (none — read-only element)
│   ├── CustomElementContext.tsx # React context & hooks wrapping the CE API
│   ├── EnsureKontentAsParent.tsx # Guard: errors if not inside Kontent.ai iframe
│   ├── selectors.ts            # promptToSelectItems / promptToSelectAssets helpers
│   └── types/
│       └── customElement.d.ts  # Global CustomElement type declarations
├── IntegrationApp.tsx          # Main Reverse Link Viewer component
├── index.css                   # Tailwind CSS v4 entry point
└── main.tsx                    # React entry — mounts the app
```

---

## Available hooks (from CustomElementContext)

| Hook | Returns | Description |
|---|---|---|
| `useConfig()` | `Config` | The element's configuration object (`apiKey`, `linkedItemsElementCodename`) |
| `useEnvironmentId()` | `string` | The Kontent.ai project / environment ID |
| `useItemInfo()` | `ItemInfo` | Current item's `id`, `codename`, `name`, `collection` |
| `useVariantInfo()` | `{ id, codename }` | Current language variant info |
| `useValue()` | `[Value\|null, setter]` | Element's stored value (unused — element is read-only) |
| `useIsDisabled()` | `boolean` | Whether the element is in a disabled/read-only state |

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines.

## License

Distributed under the MIT License. See [`LICENSE.md`](./LICENSE.md) for more information.

---

[contributors-shield]: https://img.shields.io/github/contributors/kontent-ai/custom-element-starter-react.svg?style=for-the-badge
[contributors-url]: https://github.com/kontent-ai/custom-element-starter-react/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/kontent-ai/custom-element-starter-react.svg?style=for-the-badge
[forks-url]: https://github.com/kontent-ai/custom-element-starter-react/network/members
[stars-shield]: https://img.shields.io/github/stars/kontent-ai/custom-element-starter-react.svg?style=for-the-badge
[stars-url]: https://github.com/kontent-ai/custom-element-starter-react/stargazers
[issues-shield]: https://img.shields.io/github/issues/kontent-ai/custom-element-starter-react.svg?style=for-the-badge
[issues-url]: https://github.com/kontent-ai/custom-element-starter-react/issues
[license-shield]: https://img.shields.io/github/license/kontent-ai/custom-element-starter-react.svg?style=for-the-badge
[license-url]: https://github.com/kontent-ai/custom-element-starter-react/blob/master/LICENSE.md
[discord-shield]: https://img.shields.io/discord/821885171984891914?color=%237289DA&label=Kontent.ai%20Discord&logo=discord&style=for-the-badge
[discord-url]: https://discord.com/invite/SKCxwPtevJ
