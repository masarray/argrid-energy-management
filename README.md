# ArGrid Energy Management

ArGrid is an open-source, frontend-only demonstration of an industrial energy intelligence and electrical operations platform. It combines live electrical monitoring, energy analytics, demand forecasting, opportunity management, verified savings, asset health, billing, sustainability, and data-quality workflows in one polished interface.

> **Important:** ArGrid currently uses deterministic simulated data. It does not communicate with field devices and must not be used to control real electrical equipment.

## Demo capabilities

- Multi-site industrial portfolio
- Live telemetry simulation with pause/resume
- Scenario engine: normal operation, peak demand, voltage dip, efficiency opportunity, and billing close
- Guided customer demo across the main value story
- Interactive electrical one-line workspace
- Energy trends, heatmaps, comparisons, and EnPI views
- Opportunity intelligence with cost, payback, confidence, and evidence
- Action workflow and verified savings ledger
- Demand forecasting and what-if load deferral
- Alarm and power-quality investigation
- Asset health and capacity outlook
- Tenant billing and invoice workflow
- Executive reports and data provenance
- Responsive desktop and tablet experience

## Technology

- React 19
- TypeScript
- Vite
- TanStack Router with hash history
- Tailwind CSS 4
- Recharts

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

## Project structure

```text
src/
├── components/       Application shell and reusable UI
├── lib/              Simulation runtime and demo domain data
├── routes/           File-based application workspaces
├── styles.css        ArGrid design system and Tailwind theme
├── main.tsx          Static SPA entry point
└── router.tsx        Hash-history router configuration
```

## Integration direction

The frontend uses domain-oriented mock data and a simulation context. A production integration should introduce a backend adapter for time-series data, topology, alarms, billing, and audit APIs. Browsers should not connect directly to protection relays, meters, PLCs, or RTUs.

Potential backend protocols through a secured gateway include Modbus TCP, OPC UA, MQTT, and IEC 61850 adapters.

## Safety and limitations

- All values, events, waveforms, invoices, and savings are simulated.
- “Control” interactions are presentation-only.
- The application is not revenue-grade metering or fiscal invoicing software.
- The application has not been certified against IEC 62443, ISO 50001, IEC 61000-4-30, or other industrial standards.
- Production deployments require cybersecurity review, audit controls, validated calculations, and jurisdiction-specific compliance.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Please report security concerns according to [SECURITY.md](SECURITY.md).

## License

Copyright © 2026 ArGrid contributors.

This project is licensed under the **GNU General Public License v3.0 only**. See [LICENSE](LICENSE).
