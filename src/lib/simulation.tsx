import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { calibrateSimulationSnapshot } from "./simulation-calibration";
import {
  DEMO_START_MS,
  buildSimulationSnapshot,
  demoSites,
  scenarioOptions,
  type AlarmSnapshot,
  type BillingTenant,
  type DemandContributor,
  type DemandForecastPoint,
  type DemoSiteId,
  type FeederSnapshot,
  type HistorianPoint,
  type LiveMetrics,
  type PowerQualityEvent,
  type ScenarioId,
  type ScenarioState,
  type TimeScale,
  type UtilityBillValidation,
} from "./simulation-engine";

export { demoSites, scenarioOptions };
export type { DemoSiteId, LiveMetrics, ScenarioId, TimeScale };

type SimulationContextValue = {
  scenario: ScenarioId;
  setScenario: (scenario: ScenarioId) => void;
  scenarioState: ScenarioState;
  running: boolean;
  setRunning: (running: boolean) => void;
  timeScale: TimeScale;
  setTimeScale: (scale: TimeScale) => void;
  stepForward: (minutes?: number) => void;
  resetSimulation: () => void;
  resetScenario: () => void;
  metrics: LiveMetrics;
  now: Date;
  tick: number;
  siteId: DemoSiteId;
  setSiteId: (site: DemoSiteId) => void;
  site: (typeof demoSites)[DemoSiteId];
  guidedDemoOpen: boolean;
  setGuidedDemoOpen: (open: boolean) => void;
  feeders: FeederSnapshot[];
  historian24h: HistorianPoint[];
  demandForecast: DemandForecastPoint[];
  demandContributors: DemandContributor[];
  demandResponseIds: string[];
  setDemandResponseIds: (ids: string[]) => void;
  alarms: AlarmSnapshot[];
  acknowledgeAlarm: (id: string) => void;
  powerQualityEvents: PowerQualityEvent[];
  billingTenants: BillingTenant[];
  utilityBillValidation: UtilityBillValidation;
};

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenarioState] = useState<ScenarioId>("normal");
  const [scenarioStartedAtTick, setScenarioStartedAtTick] = useState(0);
  const [running, setRunning] = useState(true);
  const [timeScale, setTimeScale] = useState<TimeScale>(1);
  const [tick, setTick] = useState(0);
  const tickRef = useRef(0);
  const [siteId, setSiteIdState] = useState<DemoSiteId>("cikarang");
  const [guidedDemoOpen, setGuidedDemoOpen] = useState(false);
  const [now, setNow] = useState(() => new Date(DEMO_START_MS));
  const [demandResponseIds, setDemandResponseIds] = useState<string[]>([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setTick((value) => {
        const next = value + 1;
        tickRef.current = next;
        return next;
      });
      setNow((value) => new Date(value.getTime() + timeScale * 1_000));
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [running, timeScale]);

  const setScenario = useCallback((nextScenario: ScenarioId) => {
    setScenarioState(nextScenario);
    setScenarioStartedAtTick(tickRef.current);
    setDemandResponseIds([]);
  }, []);

  const setSiteId = useCallback((nextSiteId: DemoSiteId) => {
    setSiteIdState(nextSiteId);
    setScenarioState("normal");
    setScenarioStartedAtTick(tickRef.current);
    setDemandResponseIds([]);
    setAcknowledgedIds(new Set());
  }, []);

  const resetScenario = useCallback(() => {
    setScenarioState("normal");
    setScenarioStartedAtTick(tickRef.current);
    setDemandResponseIds([]);
  }, []);

  const resetSimulation = useCallback(() => {
    setNow(new Date(DEMO_START_MS));
    setTick(0);
    tickRef.current = 0;
    setScenarioStartedAtTick(0);
    setScenarioState("normal");
    setDemandResponseIds([]);
    setAcknowledgedIds(new Set());
    setRunning(true);
    setTimeScale(1);
  }, []);

  const stepForward = useCallback((minutes = 5) => {
    setNow((value) => new Date(value.getTime() + minutes * 60_000));
    setTick((value) => {
      const next = value + 1;
      tickRef.current = next;
      return next;
    });
  }, []);

  const acknowledgeAlarm = useCallback((id: string) => {
    setAcknowledgedIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const scenarioElapsedSeconds = Math.max(0, tick - scenarioStartedAtTick);
  const snapshot = useMemo(() => {
    const raw = buildSimulationSnapshot({
      siteId,
      now,
      scenario,
      scenarioElapsedSeconds,
      timeScale,
      responseIds: demandResponseIds,
      acknowledgedIds,
    });
    return calibrateSimulationSnapshot({
      snapshot: raw,
      site: demoSites[siteId],
      siteId,
      scenario,
      scenarioState: raw.scenarioState,
      responseIds: demandResponseIds,
      acknowledgedIds,
      now,
    });
  }, [acknowledgedIds, demandResponseIds, now, scenario, scenarioElapsedSeconds, siteId, timeScale]);

  const value = useMemo<SimulationContextValue>(
    () => ({
      scenario,
      setScenario,
      scenarioState: snapshot.scenarioState,
      running,
      setRunning,
      timeScale,
      setTimeScale,
      stepForward,
      resetSimulation,
      resetScenario,
      metrics: snapshot.metrics,
      now,
      tick,
      siteId,
      setSiteId,
      site: demoSites[siteId],
      guidedDemoOpen,
      setGuidedDemoOpen,
      feeders: snapshot.feeders,
      historian24h: snapshot.historian24h,
      demandForecast: snapshot.demandForecast,
      demandContributors: snapshot.demandContributors,
      demandResponseIds,
      setDemandResponseIds,
      alarms: snapshot.alarms,
      acknowledgeAlarm,
      powerQualityEvents: snapshot.powerQualityEvents,
      billingTenants: snapshot.billingTenants,
      utilityBillValidation: snapshot.utilityBillValidation,
    }),
    [
      acknowledgeAlarm,
      demandResponseIds,
      guidedDemoOpen,
      now,
      resetScenario,
      resetSimulation,
      running,
      scenario,
      setScenario,
      setSiteId,
      siteId,
      snapshot,
      stepForward,
      tick,
      timeScale,
    ],
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const value = useContext(SimulationContext);
  if (!value) throw new Error("useSimulation must be used inside SimulationProvider");
  return value;
}
