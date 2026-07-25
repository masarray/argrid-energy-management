import { Link, Outlet, createRootRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { SimulationProvider } from "@/lib/simulation";

function NotFoundComponent() {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-5 text-foreground">
      <div className="panel max-w-md p-8 text-center">
        <div className="font-display text-5xl font-medium tabular text-primary">404</div>
        <h1 className="mt-4 text-lg font-medium">Workspace not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested ArGrid demo workspace is unavailable.
        </p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Return to overview</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error("ArGrid route error", error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center bg-background px-5 text-foreground">
      <div className="panel max-w-lg p-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-red">Runtime exception</div>
        <h1 className="mt-2 text-xl font-medium">This workspace did not load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The rest of the demo remains available. Retry this route or return to the overview.
        </p>
        <pre className="mt-4 max-h-32 overflow-auto rounded-md border border-border bg-background p-3 text-[11px] text-muted-foreground">
          {error.message}
        </pre>
        <div className="mt-5 flex gap-2">
          <button
            className="btn-primary"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Retry
          </button>
          <Link to="/" className="btn-secondary">Overview</Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  return (
    <SimulationProvider>
      <Outlet />
    </SimulationProvider>
  );
}
