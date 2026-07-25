# Changelog

All notable changes to ArGrid will be documented in this file.

## 1.2.0 — 2026-07-25

### Added

- Pure deterministic Simulation Engine v2.
- Independent manufacturing, data-center, and commercial-campus site profiles.
- Live 1× and Demo 60× clock modes, pause, five-minute stepping, and deterministic reset.
- Site operating schedules, feeder models, daylight-bounded solar, transformer loss, and source/load balance.
- Unified 24-hour historian shared across operational workspaces.
- Physically integrated daily energy, tariff cost, and grid-emission calculations.
- Contractual 15- or 30-minute demand intervals, forward forecast, intervention threshold, and charge exposure.
- Scenario state machines for peak demand, voltage dip, efficiency drift, and billing close.
- Measurement-driven alarm lifecycle with active, returned, and acknowledged states.
- Tariff and allocation-based tenant billing plus utility-invoice discrepancy validation.
- Simulation architecture and calculation-boundary documentation.

### Changed

- Premium Overview now uses reconciled engine data instead of independent visual datasets.
- Electrical Network now derives feeder power, voltage, current, loading, PF, THD, transformer loading, and selected-feeder history from one snapshot.
- Demand & Cost preserves actual interval history while selected responses modify only the forecast.
- Alarms & Power Quality no longer fabricates normal standing alarms.
- Portfolio uses independently calculated site profiles rather than scaled static rows.
- Analytics provides site-specific heatmaps, live energy split, and historian-linked EnPI or PUE proxy.
- Assets derives loading, spare capacity, loss, and scenario condition from the current electrical model.
- Billing uses a shared tariff, interval, allocation, and source-quality engine.
- Sustainability derives emissions from integrated grid energy and prevents solar double counting.
- Data Health separates telemetry quality from electrical power quality and blocks billing only for measurement-quality exceptions.
- Verified savings remains stable until a future verified action workflow changes it.

### Preserved

- Static GitHub Pages deployment.
- Browser-only public demo boundary.
- GPL-3.0-only licensing.
- No Lovable runtime, SSR, Bun, or external simulation service.

## 1.1.0 — 2026-07-25

### Added

- Browser-native PDF engine with lazy-loaded runtime dependencies.
- Searchable executive report PDFs with metrics, findings, trend visualization, evidence, document metadata, and simulation disclaimers.
- Structured energy-allocation statement generation with charge breakdown, meter quality, tariff basis, and calculation trace.
- Branded multi-page dashboard snapshot generation.
- Reusable export control with progress, completion, and failure feedback.
- PDF engine capability and delivery information in the Reports workspace.
- Local jsPDF compatibility typing for strict TypeScript validation.

### Changed

- Reports now generate real downloadable PDF documents instead of presentation-only preview actions.
- Project documentation now describes privacy boundaries and production limitations for document generation.

### Preserved

- Static Vite and GitHub Pages architecture.
- GPL-3.0-only licensing.
- No Lovable, Bun, SSR, hosted builder runtime, or external document-conversion service.

## 1.0.0 — 2026-07-25

### Added

- Static Vite and React application architecture for GitHub Pages.
- Hash-history navigation across thirteen industrial product workspaces.
- Three-site deterministic simulation with live and paused operation.
- Normal, peak-demand, voltage-dip, efficiency and billing scenarios.
- Six-step guided customer demonstration.
- Responsive premium industrial application shell.
- Portfolio, opportunity, action, savings, demand, asset, report and data-health workspaces.
- Interactive electrical network and power-quality investigation.
- Billing validation, invoice preview and traceability workflow.
- Original ArGrid visual identity and favicon.
- GitHub Pages and quality-check workflows.
- GPL-3.0-only license, contribution guide, security policy and architecture documentation.
- Automated repository audit command.

### Changed

- Converted the project from a server-rendered builder-specific stack to a portable static SPA.
- Reduced dependencies to the packages actively used by the demo.
- Reworked static dashboard values into coherent, scenario-driven telemetry.
- Improved responsive layouts, accessibility states and reduced-motion behavior.

### Removed

- Proprietary builder configuration and metadata.
- Server-start and server runtime files.
- Unused component-library, form and utility dependencies.
- Third-party builder branding and favicon.
