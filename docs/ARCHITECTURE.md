# ArGrid Demo Architecture

## Current static demo

```text
GitHub Pages
    ↓
Vite static application
    ↓
TanStack Router with hash history
    ↓
React domain workspaces
    ↓
Simulation provider
    ├── deterministic scenarios
    ├── live telemetry tick
    ├── site context
    └── generated history and events
```

The public demo is intentionally frontend-only. It stores no credentials and does not connect to operational technology.

## Recommended production boundary

```text
Field devices and existing systems
    ↓
Industrial integration gateway
    ├── OPC UA
    ├── Modbus TCP
    ├── MQTT
    └── IEC 61850 adapter
    ↓
Message ingestion and validation
    ↓
Historian + relational configuration store
    ↓
Domain services
    ├── topology
    ├── measurements
    ├── alarms and events
    ├── opportunities and actions
    ├── M&V and savings
    ├── tariffs and billing
    └── reporting and audit
    ↓
Authenticated REST/WebSocket API
    ↓
ArGrid web frontend
```

## Frontend migration path

The simulation provider should eventually be placed behind typed domain interfaces:

- `MeasurementRepository`
- `TopologyRepository`
- `AlarmRepository`
- `OpportunityRepository`
- `BillingRepository`
- `ReportRepository`

A mock adapter can continue to power the public demo while a production adapter consumes secured APIs. The browser must not connect directly to relays, PLCs, RTUs or revenue meters.
