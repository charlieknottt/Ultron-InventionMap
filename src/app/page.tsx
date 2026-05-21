import Image from "next/image";
import InventionMap from "../components/InventionMap";

export default function Home() {
  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <header
        className="flex items-center justify-between px-8 py-3 border-b shrink-0"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        <div className="flex items-center gap-5">
          <a href="https://ultronai.com/" target="_blank" rel="noopener noreferrer">
            <Image
              src="/ultronai-logo.png"
              alt="UltronAI"
              width={400}
              height={112}
              priority
              style={{ height: "36px", width: "auto" }}
            />
          </a>
          <div
            className="w-px h-8"
            style={{ background: "var(--border)" }}
          />
          <div>
            <h1
              className="text-xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Invention Map
            </h1>
            <p
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              22 inventions powering grocery-scale checkout product recognition
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#0D9488" }}
              />
              Enrollment
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#4B7BF5" }}
              />
              Detection
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#F59E0B" }}
              />
              Latency
            </span>
          </div>
        </div>
      </header>
      <main className="flex-1 relative overflow-hidden">
        <InventionMap />
      </main>
    </div>
  );
}
