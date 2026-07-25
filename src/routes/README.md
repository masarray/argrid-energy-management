# Routes

ArGrid uses TanStack Router file-based routing. Each route file in this directory is discovered by the Vite router plugin and included in `src/routeTree.gen.ts`.

The production build uses hash history so every workspace is compatible with GitHub Pages project URLs.

| File | Workspace |
| --- | --- |
| `index.tsx` | Operational overview |
| `portfolio.tsx` | Enterprise portfolio |
| `opportunities.tsx` | Opportunity intelligence |
| `actions.tsx` | Actions and verified savings |
| `electrical.tsx` | Electrical one-line |
| `analytics.tsx` | Energy analytics |
| `demand.tsx` | Demand and cost |
| `alarms.tsx` | Alarms and power quality |
| `assets.tsx` | Asset and capacity intelligence |
| `billing.tsx` | Billing and cost allocation |
| `reports.tsx` | Reports and evidence |
| `sustainability.tsx` | Sustainability |
| `data-health.tsx` | Data health and provenance |

`routeTree.gen.ts` is generated code and should not be formatted or edited during normal development.
