import type {
  AlarmSnapshot,
  DemoSiteId,
  ScenarioId,
  ScenarioState,
  SimulationSnapshot,
  SiteProfile,
} from "./simulation-engine";

function formatSiteTime(timestamp: string, offsetMinutes: number) {
  const shifted = new Date(new Date(timestamp).getTime() + offsetMinutes * 60_000);
  return `${String(shifted.getUTCHours()).padStart(2, "0")}:${String(shifted.getUTCMinutes()).padStart(2, "0")}`;
}

function peakTargetRatio(state: ScenarioState) {
  if (state.phase === "precondition") return 0.88 + state.progress * 0.04;
  if (state.phase === "ramp") return 0.92 + state.progress * 0.125;
  return 1.045;
}

function calibratedDemandAlarm(args: {
  site: SiteProfile;
  projectedDemand: number;
  acknowledged: boolean;
  timestamp: string;
}): AlarmSnapshot | null {
  const { site, projectedDemand, acknowledged, timestamp } = args;
  const ratio = projectedDemand / site.demandLimitMw;
  if (ratio < 0.97) return null;
  const excessKw = Math.max(0, (projectedDemand - site.demandLimitMw) * 1_000);
  return {
    id: "ALM-DEMAND-001",
    ts: timestamp,
    severity: ratio > 1 ? "Critical" : "Warning",
    source: `${site.shortName} / Demand interval`,
    message:
      ratio > 1
        ? `Scheduled interval demand exceeds contract limit by ${excessKw.toFixed(0)} kW`
        : "Scheduled interval demand exceeds the 97% intervention threshold",
    ack: acknowledged,
    state: "active",
    cause: "Concurrent scheduled starts and flexible utility loads converge before interval close.",
    requiredResponse:
      "Review the forecast contributors and apply an approved response without rewriting actual interval history.",
  };
}

export function calibrateSimulationSnapshot(args: {
  snapshot: SimulationSnapshot;
  site: SiteProfile;
  siteId: DemoSiteId;
  scenario: ScenarioId;
  scenarioState: ScenarioState;
  responseIds: string[];
  acknowledgedIds: Set<string>;
  now: Date;
}): SimulationSnapshot {
  const { snapshot, site, scenario, scenarioState, responseIds, acknowledgedIds, now } = args;
  const historian24h = snapshot.historian24h.map((point) => ({
    ...point,
    t: formatSiteTime(point.timestamp, site.timezoneOffsetMinutes),
  }));

  if (scenario !== "peak-demand") return { ...snapshot, historian24h };

  const responseReductionMw = snapshot.demandContributors
    .filter((item) => responseIds.includes(item.id) && item.deferrable)
    .reduce((sum, item) => sum + item.availableReductionKw, 0) / 1_000;
  const scheduledTarget = site.demandLimitMw * peakTargetRatio(scenarioState);
  const projectedDemand = Math.max(
    snapshot.metrics.currentDemand,
    scheduledTarget - responseReductionMw * 0.9,
  );
  const demandChargeExposure =
    Math.max(0, projectedDemand - site.demandLimitMw) * 1_000 * site.tariff.demandRateIdrPerKw;

  const lastActualIndex = snapshot.demandForecast.reduce(
    (last, point, index) => (point.actual !== null ? index : last),
    0,
  );
  const startValue =
    snapshot.demandForecast[lastActualIndex]?.actual ?? snapshot.metrics.currentDemand;
  const remainingPoints = Math.max(1, snapshot.demandForecast.length - 1 - lastActualIndex);
  const demandForecast = snapshot.demandForecast.map((point, index) => {
    if (point.actual !== null) return point;
    const progress = (index - lastActualIndex) / remainingPoints;
    const smoothProgress = progress * progress * (3 - 2 * progress);
    return {
      ...point,
      forecast: startValue + (projectedDemand - startValue) * smoothProgress,
    };
  });

  const nonDemandAlarms = snapshot.alarms.filter((alarm) => alarm.id !== "ALM-DEMAND-001");
  const demandAlarm = calibratedDemandAlarm({
    site,
    projectedDemand,
    acknowledged: acknowledgedIds.has("ALM-DEMAND-001"),
    timestamp: now.toISOString().replace("T", " ").slice(0, 19),
  });
  const alarms = demandAlarm ? [demandAlarm, ...nonDemandAlarms] : nonDemandAlarms;
  const criticalAlarms = alarms.filter(
    (alarm) => alarm.severity === "Critical" && alarm.state === "active",
  ).length;
  const activeAlarms = alarms.filter((alarm) => alarm.state === "active").length;

  return {
    ...snapshot,
    historian24h,
    demandForecast,
    alarms,
    metrics: {
      ...snapshot.metrics,
      projectedDemand,
      demandChargeExposure,
      criticalAlarms,
      activeAlarms,
    },
  };
}
