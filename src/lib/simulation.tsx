import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ScenarioId = "normal" | "peak-demand" | "voltage-dip" | "efficiency" | "billing";
export type DemoSiteId = "cikarang" | "batam-dc" | "surabaya-campus";

export const scenarioOptions: Array<{ id: ScenarioId; label: string; description: string }> = [
  { id: "normal", label: "Normal operation", description: "Stable utility supply and balanced production load." },
  { id: "peak-demand", label: "Peak-demand risk", description: "Large process loads are converging near the contract limit." },
  { id: "voltage-dip", label: "Voltage-dip event", description: "A simulated 82% Un voltage dip affects the utility feeder." },
  { id: "efficiency", label: "Efficiency opportunity", description: "Compressed-air and HVAC waste create an actionable saving." },
  { id: "billing", label: "Billing close", description: "Tenant invoices enter validation and approval workflow." },
];

export const demoSites = {
  cikarang: {
    id: "cikarang" as const,
    name: "Cikarang Manufacturing Complex",
    region: "West Java Industrial Region",
    shortName: "Cikarang Plant",
    type: "Manufacturing",
    multiplier: 1,
  },
  "batam-dc": {
    id: "batam-dc" as const,
    name: "Batam Edge Data Center",
    region: "Riau Islands Digital Zone",
    shortName: "Batam DC",
    type: "Data Center",
    multiplier: 0.72,
  },
  "surabaya-campus": {
    id: "surabaya-campus" as const,
    name: "Surabaya Commercial Campus",
    region: "East Java Metropolitan Area",
    shortName: "Surabaya Campus",
    type: "Commercial Campus",
    multiplier: 0.46,
  },
};

export type LiveMetrics = {
  currentPower: number;
  todayEnergy: number;
  todayCost: number;
  projectedDemand: number;
  demandLimit: number;
  powerFactor: number;
  solarPower: number;
  dataHealth: number;
  criticalAlarms: number;
  activeAlarms: number;
  verifiedSavings: number;
  renewableShare: number;
};

type SimulationContextValue = {
  scenario: ScenarioId;
  setScenario: (scenario: ScenarioId) => void;
  running: boolean;
  setRunning: (running: boolean) => void;
  metrics: LiveMetrics;
  now: Date;
  tick: number;
  siteId: DemoSiteId;
  setSiteId: (site: DemoSiteId) => void;
  site: (typeof demoSites)[DemoSiteId];
  guidedDemoOpen: boolean;
  setGuidedDemoOpen: (open: boolean) => void;
};

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<ScenarioId>("normal");
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const [siteId, setSiteId] = useState<DemoSiteId>("cikarang");
  const [guidedDemoOpen, setGuidedDemoOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setTick((value) => value + 1);
      setNow(new Date());
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [running]);

  const site = demoSites[siteId];
  const metrics = useMemo<LiveMetrics>(() => {
    const drift = Math.sin(tick / 4) * 0.075 + Math.sin(tick / 11) * 0.035;
    const scenarioPower = scenario === "peak-demand" ? 0.92 : scenario === "efficiency" ? 0.34 : 0;
    const scenarioDemand = scenario === "peak-demand" ? 0.78 : 0.18;
    const factor = site.multiplier;
    const currentPower = Math.max(0.65, (4.82 + drift + scenarioPower) * factor);
    const demandLimit = 6 * factor;
    const projectedDemand = Math.min(demandLimit * 1.12, (5.31 + scenarioDemand + drift * 1.4) * factor);
    const todayEnergy = (68_420 + tick * currentPower * 0.275) * factor;
    const todayCost = todayEnergy * 1_200;
    const voltageEvent = scenario === "voltage-dip";

    return {
      currentPower,
      todayEnergy,
      todayCost,
      projectedDemand,
      demandLimit,
      powerFactor: scenario === "peak-demand" ? 0.9 : 0.94 + Math.sin(tick / 9) * 0.004,
      solarPower: Math.max(0.12, 1.32 * factor + Math.sin(tick / 8) * 0.03),
      dataHealth: voltageEvent ? 97.8 : 98.4 + Math.sin(tick / 15) * 0.15,
      criticalAlarms: voltageEvent ? 2 : scenario === "peak-demand" ? 1 : 0,
      activeAlarms: voltageEvent ? 5 : scenario === "peak-demand" ? 4 : 3,
      verifiedSavings: 1_146_000_000 + tick * 42_500,
      renewableShare: siteId === "batam-dc" ? 8.7 : siteId === "surabaya-campus" ? 18.9 : 12.4,
    };
  }, [scenario, site.multiplier, siteId, tick]);

  const value = useMemo(
    () => ({
      scenario,
      setScenario,
      running,
      setRunning,
      metrics,
      now,
      tick,
      siteId,
      setSiteId,
      site,
      guidedDemoOpen,
      setGuidedDemoOpen,
    }),
    [guidedDemoOpen, metrics, now, running, scenario, site, siteId, tick],
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const value = useContext(SimulationContext);
  if (!value) throw new Error("useSimulation must be used inside SimulationProvider");
  return value;
}
