# ArGrid Simulation Engine v2

ArGrid v1.2 replaces independent dashboard animations with a deterministic industrial simulation model. The engine remains a public demonstration and is not a validated field calculation system, but its values now follow a consistent causal chain.

## Architecture

```text
Simulation clock
  → site operating schedule
  → feeder and asset models
  → solar and electrical balance
  → measurements and historian
  → interval demand and tariff cost
  → alarm rules, billing, emissions, and UI workspaces
```

The pure calculation layer is implemented in `src/lib/simulation-engine.ts`. React state, clock controls, scenario commands, acknowledgement, and selected demand responses are contained in `src/lib/simulation.tsx`.

## Clock modes

- **Live 1×** advances one simulated second per real second.
- **Demo 60×** advances one simulated minute per real second.
- **Paused** freezes the clock and all derived values.
- **Step +5 min** advances the deterministic clock by five minutes.
- **Reset** restores the fixed initial timestamp, normal scenario, acknowledgements, and selected responses.

The active scale and scenario phase are always visible in the application shell. Accelerated demonstration time is never presented as field real time.

## Site profiles

The three public demo sites are independent models, not scaled copies:

### Cikarang Manufacturing Complex

- two-shift process profile;
- process, chiller, compressor, boiler, utility, warehouse, and office feeders;
- 30-minute industrial demand interval;
- industrial time-of-use tariff;
- 1.6 MW rooftop solar model.

### Batam Edge Data Center

- stable IT base load;
- cooling follows daily environmental demand;
- UPS conversion and critical auxiliary loads;
- 15-minute capacity-demand interval;
- data-center tariff and allocation model.

### Surabaya Commercial Campus

- occupancy-driven HVAC and tenant loads;
- lighting and EV schedules;
- weekday and weekend differentiation;
- 30-minute commercial demand interval;
- tenant and shared-service allocation.

## Electrical and energy invariants

The engine maintains these relationships:

```text
Plant load = sum of feeder active power
Grid import + solar = plant load + transformer/distribution loss
Energy kWh = integral of power kW over elapsed hours
Cost = integral of grid-energy intervals × active tariff rate
Emissions = integrated grid energy × site emission factor
```

Solar output is zero outside the configured sunrise and sunset window. Cloud variation is deterministic and capacity-limited.

The Overview and Electrical Network expose the balance error so inconsistencies are visible rather than hidden.

## Demand model

Demand is an interval average, not instantaneous plant power.

The engine calculates:

- elapsed interval average;
- remaining interval time;
- deterministic forward forecast;
- contractual and intervention thresholds;
- demand-charge exposure;
- contributor ranking;
- approved flexible-load response.

Peak-demand scenarios include future scheduled starts. These affect only the forecast portion; actual historian values are never rewritten. Selecting a flexible response lowers the forward projection by the modeled available reduction.

## Scenario state machines

Scenarios progress through explicit phases.

### Peak demand

```text
precondition → ramp → analysis/intervention
```

### Voltage dip

```text
precondition → 82% Un event → recovery → evidence analysis
```

### Efficiency drift

```text
baseline → accumulating deviation → validated opportunity
```

### Billing close

```text
meter validation → tariff/allocation calculation → approval ready
```

The same scenario state is used by Overview, Demand, Electrical Network, Alarms, Billing, Assets, and Data Health.

## Alarm lifecycle

Alarms originate from current measurements or scenario evidence, not a static list. Supported demo rules include:

- projected interval demand above 97% or above contract;
- deterministic voltage sag event and returned state;
- utility specific-energy deviation;
- low power factor;
- telemetry quality below billing threshold.

Alarm records retain severity, source, cause, required response, acknowledgement, and active/returned state. Electrical power quality and telemetry data quality are separate domains.

## Data quality

A voltage dip does not automatically reduce data health. Telemetry quality changes only when the simulation creates a communication, completeness, freshness, or estimation condition.

Measured and estimated billing data are visually distinct. Estimated intervals block invoice approval until reviewed.

## Billing and carbon

Tenant statements are generated from:

```text
site monthly energy
→ allocation share
→ interval demand allocation
→ tariff version
→ tax/service rules
→ source-quality state
```

Utility invoice validation compares energy, peak demand, and calculated totals using the same tariff configuration.

Carbon results use integrated grid import, not total plant consumption, preventing rooftop solar from being double-counted.

## Determinism

The public engine uses a fixed seed and fixed initial timestamp. Resetting and replaying the same site, scenario, clock mode, and response selections produces the same result.

## Production boundary

Simulation Engine v2 is a deterministic customer-demonstration model. Production deployment still requires validated field adapters, revenue-grade metering where applicable, historian services, authenticated audit logs, calculation governance, cybersecurity review, and jurisdiction-specific billing compliance.
