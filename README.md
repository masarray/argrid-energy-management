# ArGrid Energy Management

ArGrid is an open-source, frontend-only demonstration of an industrial energy intelligence and electrical operations platform. It combines live electrical monitoring, energy analytics, demand forecasting, opportunity management, verified savings, asset health, billing, sustainability, and data-quality workflows in one polished interface.

> **Important:** ArGrid currently uses deterministic simulated data. It does not communicate with field devices and must not be used to control real electrical equipment.

## Demo capabilities

- Multi-site industrial portfolio with independent manufacturing, data-center, and commercial-campus models
- Deterministic simulation clock with Live 1×, Demo 60×, pause, step, and reset
- Scenario state machines: normal operation, peak demand, voltage dip, efficiency opportunity, and billing close
- Unified historian shared by Overview, Demand, Electrical Network, Analytics, Assets, Billing, Sustainability, and Data Health
- Source/load/loss electrical reconciliation and daylight-bounded solar generation
- Physically integrated energy, tariff cost, grid emissions, and contractual interval demand
- Measurement-driven alarm lifecycle with active, returned, and acknowledged states
- Guided customer demo across the main value story
- Interactive electrical one-line workspace
- Energy trends, heatmaps, comparisons, and site-specific EnPI views
- Opportunity intelligence with cost, payback, confidence, and evidence
- Action workflow and stable verified savings ledger
- Demand forecasting and what-if load deferral without rewriting actual history
- Alarm and power-quality investigation
- Asset health and capacity outlook
- Tenant billing and invoice workflow
- Executive reports and data provenance
- Browser-native PDF generation for reports, invoices, and paginated workspace snapshots
- Responsive desktop and tablet experience

## Simulation Engine v2

ArGrid v1.2 uses a pure deterministic calculation layer rather than independent animated dashboard values.

The causal chain is:

```text
simulation clock
→ site schedule and feeder models
→ electrical balance and solar
→ measurements and historian
→ interval demand and tariff cost
→ alarms, billing, emissions, and UI workspaces
```

Core invariants include:

```text
plant load = sum of feeder power
grid import + solar = plant load + modeled loss
energy = integral of power over elapsed time
cost = interval grid energy × active tariff
emissions = integrated grid energy × site factor
```

Peak-demand scenarios add deterministic scheduled future starts to the forecast while preserving actual interval history. Data quality remains independent from electrical power quality. Verified savings do not increment as a live counter.

See [Simulation Engine v2](docs/SIMULATION-ENGINE.md) for the architecture, site profiles, scenario lifecycle, calculation boundaries, and production limitations.

## PDF engine

ArGrid includes a client-side document engine that is loaded only when an export is requested. Operational and billing data remain inside the browser; the demo does not upload content to an external document-conversion service.

Supported outputs:

- Searchable executive reports with metrics, findings, trend graphics, source evidence, metadata, page numbering, and simulation disclaimers
- Structured energy-allocation statements with charge breakdown, meter quality, tariff basis, and calculation trace
- Branded multi-page snapshots of live ArGrid workspaces
- Progress and completion feedback for long exports

The PDF engine is designed as a frontend demonstration boundary. Production fiscal invoices, digital signatures, archival guarantees, and scheduled server-side delivery require validated backend services.

## Technology

- React 19
- TypeScript
- Vite
- TanStack Router with hash history
- Tailwind CSS 4
- Recharts
- jsPDF
- html2canvas-pro

Hash-based routing and relative build assets allow the same static build to work on GitHub Pages project sites and custom domains.

## Local development

Requirements: Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Production validation:

```bash
npm run typecheck
npm run audit
npm run lint
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to the `main` branch or run the **Deploy ArGrid to GitHub Pages** workflow manually.

The included workflow builds `dist/` and deploys it using GitHub Pages Actions. No repository-name-specific `base` setting is required.

## Documentation

- [Engineering audit](AUDIT.md)
- [Guided customer demo](docs/DEMO-SCRIPT.md)
- [Architecture and production boundary](docs/ARCHITECTURE.md)
- [Simulation Engine v2](docs/SIMULATION-ENGINE.md)

## Project structure

```text
src/
├── components/             Application shell and reusable UI
├── lib/
│   ├── simulation-engine.ts Pure deterministic industrial calculations
│   ├── simulation.tsx       React clock, commands, and state provider
│   ├── simulation-calibration.ts Forecast calibration and local-time labels
│   ├── pdf-engine.ts        Client-side report and invoice generation
│   └── ...                  Domain data and supporting utilities
├── routes/                 File-based application workspaces
├── styles.css              ArGrid design system and Tailwind theme
├── main.tsx                Static SPA entry point
└── router.tsx              Hash-history router configuration
```

## Integration direction

The frontend uses a deterministic simulation adapter. A production integration should replace that adapter with secured APIs for time-series data, topology, alarms, billing, and audit services. Browsers should not connect directly to protection relays, meters, PLCs, or RTUs.

Potential backend protocols through a secured gateway include Modbus TCP, OPC UA, MQTT, and IEC 61850 adapters.

## Safety and limitations

- All values, events, waveforms, invoices, and savings are simulated.
- “Control” interactions are presentation-only.
- The application is not revenue-grade metering or fiscal invoicing software.
- The deterministic model is designed for customer demonstration, not certified electrical studies or protection decisions.
- PDF outputs are demonstration documents and do not carry digital signatures or certified archival guarantees.
- The application has not been certified against IEC 62443, ISO 50001, IEC 61000-4-30, or other industrial standards.
- Production deployments require cybersecurity review, audit controls, validated calculations, and jurisdiction-specific compliance.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Please report security concerns according to [SECURITY.md](SECURITY.md).

## License

Copyright © 2026 ArGrid contributors.

This project is licensed under the **GNU General Public License v3.0 only**. See [LICENSE](LICENSE).
