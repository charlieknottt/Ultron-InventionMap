import Image from "next/image";
import InventionMap from "../components/InventionMap";

export default function Home() {
  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <header
        className="flex items-center justify-between px-12 py-6 border-b shrink-0"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        <div className="flex items-center gap-8">
          <a href="https://ultronai.com/" target="_blank" rel="noopener noreferrer">
            <Image
              src="/ultronai-logo.png"
              alt="UltronAI"
              width={400}
              height={112}
              priority
              style={{ height: "80px", width: "auto" }}
            />
          </a>
          <div
            className="w-px h-14"
            style={{ background: "var(--border)" }}
          />
          <div>
            <h1
              className="text-3xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Invention Map
            </h1>
            <p
              className="text-base mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              22 inventions powering grocery-scale checkout product recognition
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-6 text-base" style={{ color: "var(--text-secondary)" }}>
            <span className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: "#0D9488" }}
              />
              Enrollment
            </span>
            <span className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: "#4B7BF5" }}
              />
              Detection
            </span>
            <span className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full"
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
