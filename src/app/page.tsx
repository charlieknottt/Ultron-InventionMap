import InventionMap from "../components/InventionMap";

export default function Home() {
  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <header
        className="flex items-center justify-between px-8 py-3 border-b shrink-0"
        style={{ borderColor: "var(--border)", background: "var(--bg)" }}
      >
        <div className="flex items-center gap-5">
          <div>
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: "#000000" }}>
              UltronAI Invention Map
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              22 inventions powering grocery-scale checkout product recognition
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5 text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--enrollment)" }} />
            Product Enrollment
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--detection)" }} />
            Detection & Recognition
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--latency)" }} />
            Experience / Latency
          </span>
        </div>
      </header>
      <main className="flex-1 relative overflow-hidden">
        <InventionMap />
      </main>
    </div>
  );
}
