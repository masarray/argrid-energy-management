# ArGrid Engineering Audit

**Audit target:** open-source GitHub Pages demonstration  
**Release target:** v1.0.0 demo  
**License:** GPL-3.0-only

## Executive result

The original repository had a strong visual concept but was not yet a portable open-source product. It depended on a proprietary builder configuration and a server-rendered application stack, contained a third-party builder favicon, exposed only a subset of the product workspaces, and relied heavily on static presentation data.

The repository is now a standalone Vite single-page application designed for static GitHub Pages deployment. It includes a deterministic live simulation, thirteen connected product workspaces, a guided customer story, responsive application shell, GPL licensing, contributor and security documentation, and automated deployment and project-audit workflows.

## Findings and remediation

| Area | Original risk | Remediation | Status |
|---|---|---|---|
| Build ownership | Proprietary builder package and configuration | Replaced with standard Vite, React and TypeScript configuration | Resolved |
| Static hosting | Server-rendered runtime unsuitable for simple Pages hosting | Rebuilt as a static SPA with hash history and relative assets | Resolved |
| Branding | Third-party builder icon and project metadata | Added original ArGrid mark, favicon and product metadata | Resolved |
| Licensing | No explicit open-source license | Added full GPL v3 text and package metadata | Resolved |
| Deployment | No GitHub Pages release workflow | Added build, audit, artifact upload and Pages deployment workflow | Resolved |
| Product coverage | Only a partial screen set | Added Portfolio, Actions & Savings, Demand & Cost, Assets, Reports and Data Health | Resolved |
| Demo behavior | Mostly static values and inactive controls | Added live simulation, five operational scenarios and guided demo sequencing | Resolved |
| Customer value | Monitoring-heavy narrative | Added opportunity value, action conversion, verified savings, demand exposure and billing traceability | Resolved |
| Electrical credibility | Static network presentation | Added selectable feeders, operating layers, scenario-driven states and contextual detail | Resolved for demo |
| Responsive layout | Desktop-only grid assumptions | Added compact rail, mobile drawer, adaptive grids and contextual panels | Resolved for demo |
| Data trust | Data quality was not first-class | Added source health, completeness, stale/estimated states and billing blockers | Resolved for demo |
| Open-source operations | No contributor or security guidance | Added README, contributing guide, security policy and internal audit command | Resolved |
| Dependency weight | Large unused component and form stack | Reduced runtime dependencies to the packages used by the application | Resolved |

## Demo capability audit

The demo now supports:

- Three believable operating contexts: manufacturing, data center and commercial campus.
- Live values that move every second and can be paused.
- Normal, peak-demand, voltage-dip, efficiency and billing scenarios.
- A guided six-step customer presentation.
- Executive overview with live energy flow and financial context.
- Portfolio comparison and site intervention ranking.
- Opportunity intelligence with confidence, evidence, payback and next action.
- Action conversion and verified savings ledger.
- Interactive electrical network with multiple engineering layers.
- Demand prediction, contribution analysis and what-if load deferral.
- Alarm and power-quality event investigation.
- Asset health and capacity outlook.
- Billing period, tenant invoice and utility bill validation workflows.
- Sustainability, ISO 50001 readiness and data-health workspaces.

## Validation completed in this environment

- All TypeScript and TSX source files passed syntax transpilation.
- A strict stub-based TypeScript validation passed for local project code.
- All thirteen route modules are registered in the route tree.
- The internal `npm run audit` check passes.
- No proprietary builder, server-start or Nitro runtime reference remains in application, package or deployment files.
- Runtime import inventory matches the reduced dependency list.
- GitHub Pages, GPL and open-source policy files are present.

## Validation limitation

A complete dependency installation and browser production build could not be executed in the current sandbox because the available npm registry repeatedly returned service-unavailable responses and network timeouts. The GitHub Actions workflows are configured to perform the real dependency installation, TypeScript check, lint, project audit and Vite production build after the repository is pushed.

For a reproducible public release, generate and commit `package-lock.json` after the first successful local `npm install`, then change CI installation from `npm install` to `npm ci`.

## Remaining gaps before a real industrial deployment

These are deliberately outside the frontend demonstration scope:

### P0 — Required before any pilot using real operational data

- Backend API and WebSocket contracts separated from the simulation provider.
- Identity, SSO, MFA and site-scoped role-based authorization.
- Industrial gateway architecture for OPC UA, Modbus TCP, MQTT and IEC 61850 adapters.
- Time-series historian, event storage, retention and data-repair procedures.
- Immutable audit log for configuration, acknowledgement, billing and commands.
- Calculation validation for tariffs, baselines, M&V and data substitution.
- Secrets management, network zoning and OT cybersecurity review.
- Explicit read-only pilot mode; no browser-to-field-device communication.

### P1 — Required for a credible customer pilot

- API error, reconnect and offline-cache behavior against a real backend.
- User-managed hierarchy, meter mapping and electrical topology editor.
- Real work-order or CMMS integration.
- Invoice PDF generation, email delivery and ERP/accounting export.
- Localization for language, timezone, currency, number format and tariff rules.
- Automated unit, integration, accessibility and end-to-end tests.
- Browser and tablet validation on target hardware.
- Performance testing with large topology and multi-year interval data.

### P2 — Required for a commercial product

- Multi-tenant isolation and deployment administration.
- Revenue-grade metering and jurisdiction-specific fiscal compliance.
- Certified or independently validated power-quality calculations.
- Alarm lifecycle governance and rationalization tooling.
- Model governance for anomaly detection and recommendation confidence.
- Backup, disaster recovery, observability, SLA and incident procedures.
- Software bill of materials, dependency policy and signed releases.

## Release recommendation

The current repository is suitable as a polished, transparent **frontend demonstration and product vision**. It must continue to identify all telemetry, events, invoices, waveforms and savings as simulated. It should not be marketed as a production SCADA, revenue meter, protection system or field-control application until the P0 production gaps are implemented and independently reviewed.
