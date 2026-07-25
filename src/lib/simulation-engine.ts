export type ScenarioId = "normal" | "peak-demand" | "voltage-dip" | "efficiency" | "billing";
export type DemoSiteId = "cikarang" | "batam-dc" | "surabaya-campus";
export type MeasurementQuality = "GOOD" | "UNCERTAIN" | "STALE" | "BAD" | "ESTIMATED";
export type AlarmSeverity = "Critical" | "Warning" | "Info";
export type AlarmState = "active" | "returned" | "cleared";
export type ScenarioPhase = "stable" | "precondition" | "ramp" | "event" | "recovery" | "analysis" | "validation" | "approval";
export type TimeScale = 1 | 60;

export type FeederKind =
  | "process"
  | "cooling"
  | "compressed-air"
  | "utility"
  | "building"
  | "it-load"
  | "lighting"
  | "ev"
  | "other";

export type FeederModel = {
  id: string;
  name: string;
  kind: FeederKind;
  ratedKw: number;
  baseFraction: number;
  flexible: boolean;
  powerFactor: number;
};

export type TariffProfile = {
  offPeakRateIdrPerKwh: number;
  peakRateIdrPerKwh: number;
  peakStartHour: number;
  peakEndHour: number;
  demandRateIdrPerKw: number;
  demandIntervalMinutes: 15 | 30;
  label: string;
};

export type BillingAllocation = {
  id: string;
  name: string;
  meter: string;
  share: number;
  demandShare: number;
};

export type SiteProfile = {
  id: DemoSiteId;
  name: string;
  region: string;
  shortName: string;
  type: "Manufacturing" | "Data Center" | "Commercial Campus";
  multiplier: number;
  timezoneOffsetMinutes: number;
  demandLimitMw: number;
  transformerCapacityMva: number;
  solarCapacityKw: number;
  sunriseHour: number;
  sunsetHour: number;
  verifiedSavingsIdr: number;
  monthlyEnergyKwh: number;
  monthlyPeakKw: number;
  emissionFactorKgPerKwh: number;
  tariff: TariffProfile;
  feeders: FeederModel[];
  billingAllocations: BillingAllocation[];
};

export type ScenarioState = {
  id: ScenarioId;
  phase: ScenarioPhase;
  label: string;
  progress: number;
  elapsedSeconds: number;
  eventActive: boolean;
};

export type FeederSnapshot = FeederModel & {
  kw: number;
  load: number;
  status: "normal" | "warning" | "critical";
  voltageV: number;
  currentA: number;
  thdV: number;
  quality: MeasurementQuality;
  contributionPercent: number;
};

export type HistorianPoint = {
  timestamp: string;
  t: string;
  loadMw: number;
  gridMw: number;
  solarMw: number;
  demandMw: number;
  tariffRate: number;
};

export type DemandForecastPoint = {
  minute: number;
  label: string;
  actual: number | null;
  forecast: number | null;
  limit: number;
  warning: number;
};

export type DemandContributor = {
  id: string;
  name: string;
  kw: number;
  share: number;
  deferrable: boolean;
  availableReductionKw: number;
};

export type AlarmSnapshot = {
  id: string;
  ts: string;
  severity: AlarmSeverity;
  source: string;
  message: string;
  ack: boolean;
  state: AlarmState;
  cause: string;
  requiredResponse: string;
};

export type PowerQualityEvent = {
  id: number;
  duration: number;
  magnitude: number;
  type: "sag" | "swell" | "normal";
};

export type BillingTenant = {
  id: string;
  name: string;
  meter: string;
  kwh: number;
  demand: number;
  amount: number;
  status: "Draft" | "Approved" | "Sent" | "Overdue";
  quality: "Measured" | "Estimated";
  energyCharge: number;
  demandCharge: number;
  taxAndServices: number;
};

export type UtilityBillValidation = {
  internalEnergyKwh: number;
  internalPeakKw: number;
  utilityEnergyKwh: number;
  utilityPeakKw: number;
  internalTotalIdr: number;
  utilityTotalIdr: number;
  discrepancyIdr: number;
};

export type LiveMetrics = {
  currentPower: number;
  gridPower: number;
  todayEnergy: number;
  todayCost: number;
  currentDemand: number;
  projectedDemand: number;
  demandLimit: number;
  demandChargeExposure: number;
  intervalRemainingSeconds: number;
  powerFactor: number;
  solarPower: number;
  transformerLossKw: number;
  balanceErrorPercent: number;
  dataHealth: number;
  criticalAlarms: number;
  activeAlarms: number;
  verifiedSavings: number;
  renewableShare: number;
  co2TodayTonnes: number;
  tariffPeriod: string;
  tariffRateIdrPerKwh: number;
};

export type SimulationSnapshot = {
  metrics: LiveMetrics;
  scenarioState: ScenarioState;
  feeders: FeederSnapshot[];
  historian24h: HistorianPoint[];
  demandForecast: DemandForecastPoint[];
  demandContributors: DemandContributor[];
  alarms: AlarmSnapshot[];
  powerQualityEvents: PowerQualityEvent[];
  billingTenants: BillingTenant[];
  utilityBillValidation: UtilityBillValidation;
};

export const DEMO_START_MS = Date.UTC(2026, 6, 25, 1, 45, 0);

export const scenarioOptions: Array<{ id: ScenarioId; label: string; description: string }> = [
  { id: "normal", label: "Normal operation", description: "Stable utility supply and balanced operating schedule." },
  { id: "peak-demand", label: "Peak-demand risk", description: "Flexible process loads converge near the contractual interval limit." },
  { id: "voltage-dip", label: "Voltage-dip event", description: "A deterministic 82% Un dip progresses through event, recovery, and analysis." },
  { id: "efficiency", label: "Efficiency opportunity", description: "A utility asset deviates from its normalized operating baseline." },
  { id: "billing", label: "Billing close", description: "Meter validation, calculation, and invoice approval progress in sequence." },
];

const manufacturingFeeders: FeederModel[] = [
  { id: "F-01", name: "Production Line 1", kind: "process", ratedKw: 1_620, baseFraction: 0.74, flexible: false, powerFactor: 0.94 },
  { id: "F-02", name: "Production Line 2", kind: "process", ratedKw: 1_470, baseFraction: 0.69, flexible: true, powerFactor: 0.93 },
  { id: "F-03", name: "Chiller Plant", kind: "cooling", ratedKw: 1_240, baseFraction: 0.55, flexible: true, powerFactor: 0.95 },
  { id: "F-04", name: "Compressor House", kind: "compressed-air", ratedKw: 860, baseFraction: 0.64, flexible: true, powerFactor: 0.9 },
  { id: "F-05", name: "Boiler Auxiliaries", kind: "utility", ratedKw: 590, baseFraction: 0.46, flexible: false, powerFactor: 0.91 },
  { id: "F-06", name: "Warehouse", kind: "building", ratedKw: 440, baseFraction: 0.37, flexible: true, powerFactor: 0.95 },
  { id: "F-07", name: "Utility & Aux", kind: "utility", ratedKw: 520, baseFraction: 0.5, flexible: false, powerFactor: 0.9 },
  { id: "F-08", name: "Office & Facilities", kind: "building", ratedKw: 310, baseFraction: 0.43, flexible: true, powerFactor: 0.96 },
];

const dataCenterFeeders: FeederModel[] = [
  { id: "F-01", name: "IT Hall A", kind: "it-load", ratedKw: 1_500, baseFraction: 0.72, flexible: false, powerFactor: 0.98 },
  { id: "F-02", name: "IT Hall B", kind: "it-load", ratedKw: 1_500, baseFraction: 0.65, flexible: false, powerFactor: 0.98 },
  { id: "F-03", name: "Cooling Train A", kind: "cooling", ratedKw: 780, baseFraction: 0.54, flexible: true, powerFactor: 0.96 },
  { id: "F-04", name: "Cooling Train B", kind: "cooling", ratedKw: 780, baseFraction: 0.42, flexible: true, powerFactor: 0.96 },
  { id: "F-05", name: "UPS Conversion Loss", kind: "utility", ratedKw: 320, baseFraction: 0.48, flexible: false, powerFactor: 0.99 },
  { id: "F-06", name: "Battery Chargers", kind: "utility", ratedKw: 250, baseFraction: 0.36, flexible: true, powerFactor: 0.97 },
  { id: "F-07", name: "Critical Auxiliaries", kind: "utility", ratedKw: 380, baseFraction: 0.52, flexible: false, powerFactor: 0.96 },
  { id: "F-08", name: "Security & Offices", kind: "building", ratedKw: 180, baseFraction: 0.38, flexible: true, powerFactor: 0.95 },
];

const campusFeeders: FeederModel[] = [
  { id: "F-01", name: "Tower A HVAC", kind: "cooling", ratedKw: 740, baseFraction: 0.52, flexible: true, powerFactor: 0.95 },
  { id: "F-02", name: "Tower B HVAC", kind: "cooling", ratedKw: 650, baseFraction: 0.48, flexible: true, powerFactor: 0.95 },
  { id: "F-03", name: "Retail Tenants", kind: "building", ratedKw: 580, baseFraction: 0.46, flexible: false, powerFactor: 0.94 },
  { id: "F-04", name: "Office Tenants", kind: "building", ratedKw: 620, baseFraction: 0.44, flexible: false, powerFactor: 0.95 },
  { id: "F-05", name: "Common Lighting", kind: "lighting", ratedKw: 270, baseFraction: 0.4, flexible: true, powerFactor: 0.96 },
  { id: "F-06", name: "EV Charging", kind: "ev", ratedKw: 420, baseFraction: 0.28, flexible: true, powerFactor: 0.98 },
  { id: "F-07", name: "Water & Fire Pumps", kind: "utility", ratedKw: 260, baseFraction: 0.24, flexible: false, powerFactor: 0.91 },
  { id: "F-08", name: "Campus Services", kind: "other", ratedKw: 250, baseFraction: 0.38, flexible: true, powerFactor: 0.94 },
];

export const demoSites: Record<DemoSiteId, SiteProfile> = {
  cikarang: {
    id: "cikarang",
    name: "Cikarang Manufacturing Complex",
    region: "West Java Industrial Region",
    shortName: "Cikarang Plant",
    type: "Manufacturing",
    multiplier: 1,
    timezoneOffsetMinutes: 420,
    demandLimitMw: 6,
    transformerCapacityMva: 7.5,
    solarCapacityKw: 1_600,
    sunriseHour: 5.7,
    sunsetHour: 17.8,
    verifiedSavingsIdr: 1_146_000_000,
    monthlyEnergyKwh: 2_014_820,
    monthlyPeakKw: 5_740,
    emissionFactorKgPerKwh: 0.82,
    tariff: { offPeakRateIdrPerKwh: 1_120, peakRateIdrPerKwh: 1_750, peakStartHour: 17, peakEndHour: 22, demandRateIdrPerKw: 355_000, demandIntervalMinutes: 30, label: "Industrial TOU 2026" },
    feeders: manufacturingFeeders,
    billingAllocations: [
      { id: "T-001", name: "Tenant A · Plastics Line", meter: "MTR-T01", share: 0.235, demandShare: 0.22 },
      { id: "T-002", name: "Tenant B · Metal Fabrication", meter: "MTR-T02", share: 0.155, demandShare: 0.15 },
      { id: "T-003", name: "Tenant C · Cold Storage", meter: "MTR-T03", share: 0.26, demandShare: 0.25 },
      { id: "T-004", name: "Tenant D · Packaging", meter: "MTR-T04", share: 0.13, demandShare: 0.12 },
      { id: "T-005", name: "Tenant E · Assembly", meter: "MTR-T05", share: 0.22, demandShare: 0.26 },
    ],
  },
  "batam-dc": {
    id: "batam-dc",
    name: "Batam Edge Data Center",
    region: "Riau Islands Digital Zone",
    shortName: "Batam DC",
    type: "Data Center",
    multiplier: 0.72,
    timezoneOffsetMinutes: 420,
    demandLimitMw: 4.5,
    transformerCapacityMva: 6.3,
    solarCapacityKw: 520,
    sunriseHour: 5.8,
    sunsetHour: 18,
    verifiedSavingsIdr: 786_000_000,
    monthlyEnergyKwh: 2_380_000,
    monthlyPeakKw: 4_020,
    emissionFactorKgPerKwh: 0.78,
    tariff: { offPeakRateIdrPerKwh: 1_280, peakRateIdrPerKwh: 1_520, peakStartHour: 18, peakEndHour: 22, demandRateIdrPerKw: 320_000, demandIntervalMinutes: 15, label: "Data-center capacity tariff" },
    feeders: dataCenterFeeders,
    billingAllocations: [
      { id: "T-001", name: "Colocation Hall A", meter: "MTR-DC-A", share: 0.34, demandShare: 0.34 },
      { id: "T-002", name: "Colocation Hall B", meter: "MTR-DC-B", share: 0.31, demandShare: 0.31 },
      { id: "T-003", name: "Cooling Services", meter: "MTR-DC-C", share: 0.2, demandShare: 0.19 },
      { id: "T-004", name: "Shared Infrastructure", meter: "MTR-DC-S", share: 0.1, demandShare: 0.11 },
      { id: "T-005", name: "Office Services", meter: "MTR-DC-O", share: 0.05, demandShare: 0.05 },
    ],
  },
  "surabaya-campus": {
    id: "surabaya-campus",
    name: "Surabaya Commercial Campus",
    region: "East Java Metropolitan Area",
    shortName: "Surabaya Campus",
    type: "Commercial Campus",
    multiplier: 0.46,
    timezoneOffsetMinutes: 420,
    demandLimitMw: 2.8,
    transformerCapacityMva: 4,
    solarCapacityKw: 920,
    sunriseHour: 5.6,
    sunsetHour: 17.7,
    verifiedSavingsIdr: 428_000_000,
    monthlyEnergyKwh: 1_080_000,
    monthlyPeakKw: 2_420,
    emissionFactorKgPerKwh: 0.82,
    tariff: { offPeakRateIdrPerKwh: 1_180, peakRateIdrPerKwh: 1_640, peakStartHour: 17, peakEndHour: 22, demandRateIdrPerKw: 290_000, demandIntervalMinutes: 30, label: "Commercial campus TOU" },
    feeders: campusFeeders,
    billingAllocations: [
      { id: "T-001", name: "Tower A", meter: "MTR-CAM-A", share: 0.26, demandShare: 0.25 },
      { id: "T-002", name: "Tower B", meter: "MTR-CAM-B", share: 0.23, demandShare: 0.22 },
      { id: "T-003", name: "Retail Arcade", meter: "MTR-CAM-R", share: 0.21, demandShare: 0.2 },
      { id: "T-004", name: "Common Services", meter: "MTR-CAM-S", share: 0.18, demandShare: 0.2 },
      { id: "T-005", name: "EV Charging Operator", meter: "MTR-CAM-EV", share: 0.12, demandShare: 0.13 },
    ],
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function deterministicNoise(seed: number, bucket: number, channel: number) {
  const value = Math.sin(seed * 12.9898 + bucket * 78.233 + channel * 37.719) * 43_758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function localDateParts(date: Date, offsetMinutes: number) {
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  return {
    hour: shifted.getUTCHours() + shifted.getUTCMinutes() / 60 + shifted.getUTCSeconds() / 3_600,
    minuteOfDay: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() + shifted.getUTCSeconds() / 60,
    dayOfWeek: shifted.getUTCDay(),
  };
}

function tariffAt(profile: SiteProfile, date: Date) {
  const { hour } = localDateParts(date, profile.timezoneOffsetMinutes);
  const peak = hour >= profile.tariff.peakStartHour && hour < profile.tariff.peakEndHour;
  return {
    period: peak ? "WBP · peak" : "LWBP · off-peak",
    rate: peak ? profile.tariff.peakRateIdrPerKwh : profile.tariff.offPeakRateIdrPerKwh,
  };
}

function scenarioStateFor(id: ScenarioId, elapsedSeconds: number): ScenarioState {
  if (id === "normal") return { id, phase: "stable", label: "Stable operation", progress: 1, elapsedSeconds, eventActive: false };
  if (id === "peak-demand") {
    if (elapsedSeconds < 5) return { id, phase: "precondition", label: "Load convergence detected", progress: elapsedSeconds / 5, elapsedSeconds, eventActive: false };
    if (elapsedSeconds < 20) return { id, phase: "ramp", label: "Demand forecast rising", progress: (elapsedSeconds - 5) / 15, elapsedSeconds, eventActive: true };
    return { id, phase: "analysis", label: "Demand intervention window", progress: 1, elapsedSeconds, eventActive: true };
  }
  if (id === "voltage-dip") {
    if (elapsedSeconds < 3) return { id, phase: "precondition", label: "Pre-event steady state", progress: elapsedSeconds / 3, elapsedSeconds, eventActive: false };
    if (elapsedSeconds < 4) return { id, phase: "event", label: "Voltage dip active", progress: elapsedSeconds - 3, elapsedSeconds, eventActive: true };
    if (elapsedSeconds < 12) return { id, phase: "recovery", label: "Voltage restored · downstream recovery", progress: (elapsedSeconds - 4) / 8, elapsedSeconds, eventActive: false };
    return { id, phase: "analysis", label: "PQ evidence ready", progress: 1, elapsedSeconds, eventActive: false };
  }
  if (id === "efficiency") {
    if (elapsedSeconds < 5) return { id, phase: "precondition", label: "Normalized baseline", progress: elapsedSeconds / 5, elapsedSeconds, eventActive: false };
    if (elapsedSeconds < 15) return { id, phase: "ramp", label: "Efficiency drift accumulating", progress: (elapsedSeconds - 5) / 10, elapsedSeconds, eventActive: true };
    return { id, phase: "analysis", label: "Opportunity validated", progress: 1, elapsedSeconds, eventActive: true };
  }
  if (elapsedSeconds < 6) return { id, phase: "validation", label: "Meter validation", progress: elapsedSeconds / 6, elapsedSeconds, eventActive: true };
  if (elapsedSeconds < 14) return { id, phase: "analysis", label: "Tariff and allocation calculation", progress: (elapsedSeconds - 6) / 8, elapsedSeconds, eventActive: true };
  return { id, phase: "approval", label: "Invoice approval ready", progress: 1, elapsedSeconds, eventActive: true };
}

function operatingMultiplier(profile: SiteProfile, feeder: FeederModel, hour: number, dayOfWeek: number) {
  const weekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (profile.type === "Manufacturing") {
    const shift = hour >= 6 && hour < 22 ? 1 : 0.54;
    const weekendFactor = weekend ? 0.67 : 1;
    if (feeder.kind === "process") return shift * weekendFactor;
    if (feeder.kind === "cooling") return (0.62 + Math.max(0, Math.sin(((hour - 7) / 12) * Math.PI)) * 0.48) * weekendFactor;
    if (feeder.kind === "compressed-air") return (hour >= 5.5 && hour < 22.5 ? 1 : 0.58) * weekendFactor;
    if (feeder.kind === "building") return hour >= 7 && hour < 19 ? 1 : 0.35;
    return 0.82 + (hour >= 6 && hour < 22 ? 0.18 : 0);
  }
  if (profile.type === "Data Center") {
    if (feeder.kind === "it-load") return 0.97 + Math.sin(hour / 24 * Math.PI * 2) * 0.025;
    if (feeder.kind === "cooling") return 0.72 + Math.max(0, Math.sin(((hour - 7) / 12) * Math.PI)) * 0.38;
    if (feeder.kind === "building") return hour >= 7 && hour < 19 ? 0.9 : 0.42;
    return 0.92;
  }
  const occupied = hour >= 7 && hour < 20;
  const weekday = !weekend;
  if (feeder.kind === "cooling") return occupied ? (weekday ? 1 : 0.72) : 0.24;
  if (feeder.kind === "building") return occupied ? (weekday ? 1 : 0.76) : 0.3;
  if (feeder.kind === "lighting") return hour >= 6 && hour < 22 ? 1 : 0.22;
  if (feeder.kind === "ev") return hour >= 8 && hour < 18 ? 0.95 : 0.24;
  return occupied ? 0.85 : 0.42;
}

function scenarioFeederAdderKw(feeder: FeederModel, scenario: ScenarioId, state: ScenarioState) {
  const progress = state.phase === "precondition" || state.phase === "stable" ? 0 : state.progress;
  if (scenario === "peak-demand") {
    if (feeder.kind === "cooling") return feeder.ratedKw * 0.22 * progress;
    if (feeder.kind === "compressed-air") return feeder.ratedKw * 0.2 * progress;
    if (feeder.kind === "process" && feeder.flexible) return feeder.ratedKw * 0.15 * progress;
    if (feeder.kind === "ev") return feeder.ratedKw * 0.32 * progress;
  }
  if (scenario === "efficiency" && state.eventActive) {
    if (feeder.kind === "compressed-air") return feeder.ratedKw * 0.13 * progress;
    if (feeder.kind === "cooling") return feeder.ratedKw * 0.08 * progress;
  }
  return 0;
}

function solarOutputKw(profile: SiteProfile, date: Date, seed: number) {
  const { hour, minuteOfDay } = localDateParts(date, profile.timezoneOffsetMinutes);
  if (hour <= profile.sunriseHour || hour >= profile.sunsetHour) return 0;
  const daylightProgress = (hour - profile.sunriseHour) / (profile.sunsetHour - profile.sunriseHour);
  const clearSky = Math.sin(daylightProgress * Math.PI);
  const cloud = clamp(0.91 + deterministicNoise(seed, Math.floor(minuteOfDay / 20), 91) * 0.075, 0.72, 1);
  return profile.solarCapacityKw * clearSky * cloud;
}

function feederSnapshots(
  profile: SiteProfile,
  date: Date,
  scenario: ScenarioId,
  state: ScenarioState,
  seed: number,
) {
  const { hour, minuteOfDay, dayOfWeek } = localDateParts(date, profile.timezoneOffsetMinutes);
  const dipActive = scenario === "voltage-dip" && state.phase === "event";
  const values = profile.feeders.map((feeder, index) => {
    const operating = operatingMultiplier(profile, feeder, hour, dayOfWeek);
    const noise = deterministicNoise(seed, Math.floor(minuteOfDay / 3), index) * 0.025;
    const baseKw = feeder.ratedKw * clamp(feeder.baseFraction * operating + noise, 0.08, 0.96);
    const scenarioKw = scenarioFeederAdderKw(feeder, scenario, state);
    const dropout = dipActive && feeder.id === "F-07" ? 0.9 : 1;
    const kw = clamp((baseKw + scenarioKw) * dropout, 0, feeder.ratedKw * 1.02);
    const voltageV = dipActive && feeder.id === "F-07" ? 328 : 399 + deterministicNoise(seed, Math.floor(minuteOfDay), index + 40) * 1.7;
    const powerFactor = clamp(feeder.powerFactor - (scenario === "peak-demand" && feeder.kind === "compressed-air" ? 0.035 * state.progress : 0), 0.82, 0.995);
    const thdV = clamp(2.2 + deterministicNoise(seed, Math.floor(minuteOfDay / 5), index + 70) * 0.45 + (dipActive && feeder.id === "F-07" ? 2.4 : 0), 1.2, 7.5);
    return { feeder, kw, voltageV, powerFactor, thdV };
  });
  const totalKw = values.reduce((sum, item) => sum + item.kw, 0);
  return values.map(({ feeder, kw, voltageV, powerFactor, thdV }) => {
    const load = kw / feeder.ratedKw * 100;
    const status = voltageV < 360 ? "critical" : load > 88 || powerFactor < 0.89 ? "warning" : "normal";
    return {
      ...feeder,
      kw,
      load,
      status,
      voltageV,
      currentA: kw * 1_000 / (Math.sqrt(3) * Math.max(voltageV, 1) * Math.max(powerFactor, 0.7)),
      powerFactor,
      thdV,
      quality: "GOOD" as MeasurementQuality,
      contributionPercent: totalKw > 0 ? kw / totalKw * 100 : 0,
    } satisfies FeederSnapshot;
  });
}

function electricalBalance(profile: SiteProfile, feeders: FeederSnapshot[], date: Date, seed: number) {
  const loadKw = feeders.reduce((sum, feeder) => sum + feeder.kw, 0);
  const solarKw = solarOutputKw(profile, date, seed);
  const loadRatio = loadKw / Math.max(profile.transformerCapacityMva * 1_000, 1);
  const lossKw = 22 + loadKw * 0.0048 + loadRatio * loadRatio * 34;
  const gridKw = Math.max(0, loadKw + lossKw - solarKw);
  const weightedPf = feeders.reduce((sum, feeder) => sum + feeder.powerFactor * feeder.kw, 0) / Math.max(loadKw, 1);
  return { loadKw, solarKw, lossKw, gridKw, weightedPf };
}

function pointAt(profile: SiteProfile, date: Date, scenario: ScenarioId, state: ScenarioState, seed: number) {
  const feeders = feederSnapshots(profile, date, scenario, state, seed);
  const balance = electricalBalance(profile, feeders, date, seed);
  return { feeders, ...balance };
}

function normalState(): ScenarioState {
  return { id: "normal", phase: "stable", label: "Stable operation", progress: 1, elapsedSeconds: 0, eventActive: false };
}

function scenarioHistoryMinutes(scenario: ScenarioId, elapsedSeconds: number, timeScale: TimeScale) {
  if (scenario === "normal") return 0;
  return Math.min(45, elapsedSeconds * timeScale / 60);
}

function stateForHistoricalPoint(scenario: ScenarioId, state: ScenarioState, minutesAgo: number, affectedMinutes: number) {
  if (scenario === "normal" || minutesAgo > affectedMinutes) return normalState();
  return state;
}

function buildHistorian(
  profile: SiteProfile,
  now: Date,
  scenario: ScenarioId,
  state: ScenarioState,
  elapsedSeconds: number,
  timeScale: TimeScale,
  seed: number,
) {
  const affectedMinutes = scenarioHistoryMinutes(scenario, elapsedSeconds, timeScale);
  const result: HistorianPoint[] = [];
  for (let index = 95; index >= 0; index -= 1) {
    const minutesAgo = index * 15;
    const date = new Date(now.getTime() - minutesAgo * 60_000);
    const pointState = stateForHistoricalPoint(scenario, state, minutesAgo, affectedMinutes);
    const pointScenario = pointState.id;
    const point = pointAt(profile, date, pointScenario, pointState, seed);
    const tariff = tariffAt(profile, date);
    result.push({
      timestamp: date.toISOString(),
      t: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }),
      loadMw: point.loadKw / 1_000,
      gridMw: point.gridKw / 1_000,
      solarMw: point.solarKw / 1_000,
      demandMw: point.gridKw / 1_000,
      tariffRate: tariff.rate,
    });
  }
  return result;
}

function integrateDay(
  profile: SiteProfile,
  now: Date,
  scenario: ScenarioId,
  state: ScenarioState,
  elapsedSeconds: number,
  timeScale: TimeScale,
  seed: number,
) {
  const { minuteOfDay } = localDateParts(now, profile.timezoneOffsetMinutes);
  const dayStart = now.getTime() - minuteOfDay * 60_000;
  const affectedMinutes = scenarioHistoryMinutes(scenario, elapsedSeconds, timeScale);
  let energyKwh = 0;
  let gridEnergyKwh = 0;
  let costIdr = 0;
  for (let minute = 0; minute < minuteOfDay; minute += 5) {
    const date = new Date(dayStart + minute * 60_000);
    const minutesAgo = minuteOfDay - minute;
    const pointState = stateForHistoricalPoint(scenario, state, minutesAgo, affectedMinutes);
    const point = pointAt(profile, date, pointState.id, pointState, seed);
    const hours = Math.min(5, minuteOfDay - minute) / 60;
    const loadEnergy = point.loadKw * hours;
    const gridEnergy = point.gridKw * hours;
    energyKwh += loadEnergy;
    gridEnergyKwh += gridEnergy;
    costIdr += gridEnergy * tariffAt(profile, date).rate;
  }
  return { energyKwh, gridEnergyKwh, costIdr };
}

function demandWindow(
  profile: SiteProfile,
  now: Date,
  scenario: ScenarioId,
  state: ScenarioState,
  elapsedSeconds: number,
  timeScale: TimeScale,
  seed: number,
  responseIds: string[],
) {
  const interval = profile.tariff.demandIntervalMinutes;
  const { minuteOfDay } = localDateParts(now, profile.timezoneOffsetMinutes);
  const startMinute = Math.floor(minuteOfDay / interval) * interval;
  const elapsedMinutes = clamp(minuteOfDay - startMinute, 0, interval);
  const dayStart = now.getTime() - minuteOfDay * 60_000;
  const affectedMinutes = scenarioHistoryMinutes(scenario, elapsedSeconds, timeScale);
  const actualValues: number[] = [];
  const points: DemandForecastPoint[] = [];
  const current = pointAt(profile, now, scenario, state, seed);
  const responseKw = current.feeders
    .filter((feeder) => responseIds.includes(feeder.id) && feeder.flexible)
    .reduce((sum, feeder) => sum + feeder.kw * 0.65, 0);

  for (let minute = 0; minute <= interval; minute += 1) {
    const date = new Date(dayStart + (startMinute + minute) * 60_000);
    if (minute <= elapsedMinutes) {
      const minutesAgo = elapsedMinutes - minute;
      const pointState = stateForHistoricalPoint(scenario, state, minutesAgo, affectedMinutes);
      const actual = pointAt(profile, date, pointState.id, pointState, seed).gridKw / 1_000;
      actualValues.push(actual);
      points.push({ minute, label: `${minute}m`, actual, forecast: null, limit: profile.demandLimitMw, warning: profile.demandLimitMw * 0.92 });
    } else {
      const futureProgress = (minute - elapsedMinutes) / Math.max(interval - elapsedMinutes, 1);
      const scenarioRamp = scenario === "peak-demand" ? 0.18 * state.progress * futureProgress : 0;
      const forecast = Math.max(0, current.gridKw / 1_000 + scenarioRamp - responseKw / 1_000 * futureProgress);
      points.push({ minute, label: `${minute}m`, actual: null, forecast, limit: profile.demandLimitMw, warning: profile.demandLimitMw * 0.92 });
    }
  }

  const actualAverage = actualValues.reduce((sum, value) => sum + value, 0) / Math.max(actualValues.length, 1);
  const forecastValues = points.map((point) => point.actual ?? point.forecast ?? 0);
  const projected = forecastValues.reduce((sum, value) => sum + value, 0) / Math.max(forecastValues.length, 1);
  return {
    actualAverage,
    projected,
    points,
    responseKw,
    remainingSeconds: Math.max(0, Math.round((interval - elapsedMinutes) * 60)),
  };
}

function buildAlarms(
  profile: SiteProfile,
  metrics: Pick<LiveMetrics, "projectedDemand" | "demandLimit" | "powerFactor" | "dataHealth">,
  scenario: ScenarioId,
  state: ScenarioState,
  now: Date,
  acknowledgedIds: Set<string>,
) {
  const alarms: AlarmSnapshot[] = [];
  const timestamp = now.toISOString().replace("T", " ").slice(0, 19);
  const demandRatio = metrics.projectedDemand / metrics.demandLimit;
  if (demandRatio >= 0.97) {
    const critical = demandRatio > 1;
    alarms.push({
      id: "ALM-DEMAND-001",
      ts: timestamp,
      severity: critical ? "Critical" : "Warning",
      source: `${profile.shortName} / Demand interval`,
      message: critical ? `Projected interval demand exceeds contract limit by ${((metrics.projectedDemand - metrics.demandLimit) * 1_000).toFixed(0)} kW` : "Projected interval demand exceeds the 97% intervention threshold",
      ack: acknowledgedIds.has("ALM-DEMAND-001"),
      state: "active",
      cause: "Concurrent flexible-load operation during the active demand interval.",
      requiredResponse: "Review contributing loads and apply an approved demand response before interval close.",
    });
  }
  if (scenario === "voltage-dip" && state.phase !== "precondition") {
    alarms.push({
      id: "ALM-PQ-082",
      ts: timestamp,
      severity: "Critical",
      source: "MSB-02 / F-07",
      message: "Voltage sag reached 82% Un for 240 ms",
      ack: acknowledgedIds.has("ALM-PQ-082"),
      state: state.phase === "event" ? "active" : "returned",
      cause: "Simulated upstream voltage disturbance at the utility incomer.",
      requiredResponse: "Review correlated downstream events and confirm sensitive-load recovery.",
    });
  }
  if (scenario === "efficiency" && state.eventActive) {
    alarms.push({
      id: "ALM-EFF-014",
      ts: timestamp,
      severity: "Warning",
      source: profile.type === "Manufacturing" ? "Compressor House" : "Cooling Plant",
      message: "Specific energy consumption remains above normalized operating baseline",
      ack: acknowledgedIds.has("ALM-EFF-014"),
      state: "active",
      cause: "Utility asset efficiency has drifted while production or service output remains stable.",
      requiredResponse: "Validate operating mode, inspect controls, and convert the finding into an opportunity action.",
    });
  }
  if (metrics.powerFactor < 0.9) {
    alarms.push({
      id: "ALM-PF-003",
      ts: timestamp,
      severity: "Warning",
      source: "MSB-Main",
      message: `Power factor below target at ${metrics.powerFactor.toFixed(2)}`,
      ack: acknowledgedIds.has("ALM-PF-003"),
      state: "active",
      cause: "Reactive demand increased with motor and compressor loading.",
      requiredResponse: "Review capacitor-bank availability and confirm switching status.",
    });
  }
  if (metrics.dataHealth < 98) {
    alarms.push({
      id: "ALM-DATA-007",
      ts: timestamp,
      severity: "Warning",
      source: "Telemetry gateway",
      message: "Data completeness below billing-ready threshold",
      ack: acknowledgedIds.has("ALM-DATA-007"),
      state: "active",
      cause: "Missing or stale telemetry intervals.",
      requiredResponse: "Validate the source connection before using affected intervals for billing.",
    });
  }
  return alarms;
}

function pqEvents(scenario: ScenarioId, state: ScenarioState) {
  const events: PowerQualityEvent[] = Array.from({ length: 36 }, (_, index) => {
    const first = Math.abs(deterministicNoise(87, index, 4));
    const second = Math.abs(deterministicNoise(91, index, 7));
    const duration = Math.pow(10, -2 + first * 3.7);
    const magnitude = 74 + second * 48;
    return { id: index, duration: +duration.toFixed(3), magnitude: +magnitude.toFixed(0), type: magnitude < 90 ? "sag" : magnitude > 110 ? "swell" : "normal" };
  });
  if (scenario === "voltage-dip" && state.phase !== "precondition") events.push({ id: 1001, duration: 0.24, magnitude: 82, type: "sag" });
  return events;
}

function billingEngine(profile: SiteProfile, scenario: ScenarioId, state: ScenarioState) {
  const blendedEnergyRate = profile.tariff.offPeakRateIdrPerKwh * 0.72 + profile.tariff.peakRateIdrPerKwh * 0.28;
  const tenants = profile.billingAllocations.map((allocation, index) => {
    const kwh = Math.round(profile.monthlyEnergyKwh * allocation.share);
    const demand = Math.round(profile.monthlyPeakKw * allocation.demandShare);
    const energyCharge = Math.round(kwh * blendedEnergyRate);
    const demandCharge = Math.round(demand * profile.tariff.demandRateIdrPerKw * 0.22);
    const taxAndServices = Math.round((energyCharge + demandCharge) * 0.08);
    const quality = scenario === "billing" && index === 2 && state.phase !== "approval" ? "Estimated" : "Measured";
    const statuses: BillingTenant["status"][] = ["Sent", "Approved", "Draft", "Sent", "Overdue"];
    return {
      ...allocation,
      kwh,
      demand,
      amount: energyCharge + demandCharge + taxAndServices,
      status: statuses[index] ?? "Draft",
      quality,
      energyCharge,
      demandCharge,
      taxAndServices,
    } satisfies BillingTenant;
  });
  const internalEnergyKwh = tenants.reduce((sum, tenant) => sum + tenant.kwh, 0);
  const internalPeakKw = profile.monthlyPeakKw;
  const internalTotalIdr = tenants.reduce((sum, tenant) => sum + tenant.amount, 0);
  const utilityPeakKw = scenario === "billing" ? internalPeakKw + 72 : internalPeakKw;
  const utilityEnergyKwh = internalEnergyKwh;
  const discrepancyIdr = Math.round((utilityPeakKw - internalPeakKw) * profile.tariff.demandRateIdrPerKw * 0.75);
  return {
    tenants,
    validation: {
      internalEnergyKwh,
      internalPeakKw,
      utilityEnergyKwh,
      utilityPeakKw,
      internalTotalIdr,
      utilityTotalIdr: internalTotalIdr + discrepancyIdr,
      discrepancyIdr,
    } satisfies UtilityBillValidation,
  };
}

export function buildSimulationSnapshot(args: {
  siteId: DemoSiteId;
  now: Date;
  scenario: ScenarioId;
  scenarioElapsedSeconds: number;
  timeScale: TimeScale;
  responseIds: string[];
  acknowledgedIds: Set<string>;
  seed?: number;
}): SimulationSnapshot {
  const { siteId, now, scenario, scenarioElapsedSeconds, timeScale, responseIds, acknowledgedIds, seed = 61850 } = args;
  const profile = demoSites[siteId];
  const state = scenarioStateFor(scenario, scenarioElapsedSeconds);
  const current = pointAt(profile, now, scenario, state, seed);
  const integrated = integrateDay(profile, now, scenario, state, scenarioElapsedSeconds, timeScale, seed);
  const demand = demandWindow(profile, now, scenario, state, scenarioElapsedSeconds, timeScale, seed, responseIds);
  const tariff = tariffAt(profile, now);
  const renewableShare = current.loadKw > 0 ? current.solarKw / current.loadKw * 100 : 0;
  const dataHealth = 99.55 + deterministicNoise(seed, Math.floor(now.getTime() / 900_000), 301) * 0.12;
  const preliminaryMetrics = {
    projectedDemand: demand.projected,
    demandLimit: profile.demandLimitMw,
    powerFactor: current.weightedPf,
    dataHealth,
  };
  const alarms = buildAlarms(profile, preliminaryMetrics, scenario, state, now, acknowledgedIds);
  const criticalAlarms = alarms.filter((alarm) => alarm.severity === "Critical" && alarm.state === "active").length;
  const activeAlarms = alarms.filter((alarm) => alarm.state === "active").length;
  const demandExcessKw = Math.max(0, (demand.projected - profile.demandLimitMw) * 1_000);
  const metrics: LiveMetrics = {
    currentPower: current.loadKw / 1_000,
    gridPower: current.gridKw / 1_000,
    todayEnergy: integrated.energyKwh,
    todayCost: integrated.costIdr,
    currentDemand: demand.actualAverage,
    projectedDemand: demand.projected,
    demandLimit: profile.demandLimitMw,
    demandChargeExposure: demandExcessKw * profile.tariff.demandRateIdrPerKw,
    intervalRemainingSeconds: demand.remainingSeconds,
    powerFactor: current.weightedPf,
    solarPower: current.solarKw / 1_000,
    transformerLossKw: current.lossKw,
    balanceErrorPercent: Math.abs(current.gridKw + current.solarKw - current.loadKw - current.lossKw) / Math.max(current.loadKw, 1) * 100,
    dataHealth,
    criticalAlarms,
    activeAlarms,
    verifiedSavings: profile.verifiedSavingsIdr,
    renewableShare,
    co2TodayTonnes: integrated.gridEnergyKwh * profile.emissionFactorKgPerKwh / 1_000,
    tariffPeriod: tariff.period,
    tariffRateIdrPerKwh: tariff.rate,
  };
  const demandContributors = current.feeders
    .map((feeder) => ({
      id: feeder.id,
      name: feeder.name,
      kw: Math.round(feeder.kw),
      share: +feeder.contributionPercent.toFixed(1),
      deferrable: feeder.flexible,
      availableReductionKw: feeder.flexible ? Math.round(feeder.kw * 0.65) : 0,
    }))
    .sort((a, b) => b.kw - a.kw);
  const billing = billingEngine(profile, scenario, state);
  return {
    metrics,
    scenarioState: state,
    feeders: current.feeders,
    historian24h: buildHistorian(profile, now, scenario, state, scenarioElapsedSeconds, timeScale, seed),
    demandForecast: demand.points,
    demandContributors,
    alarms,
    powerQualityEvents: pqEvents(scenario, state),
    billingTenants: billing.tenants,
    utilityBillValidation: billing.validation,
  };
}
