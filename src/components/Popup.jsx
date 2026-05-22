"use client";
import { useEffect, useRef } from "react";

const COLOR_MAP = {
  enrollment: { accent: "#059669", bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46", label: "Product Enrollment" },
  detection: { accent: "#2563eb", bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", label: "Detection & Recognition" },
  latency: { accent: "#d97706", bg: "#fffbeb", border: "#fcd34d", text: "#92400e", label: "Experience / Latency" },
};

const RING_LABELS = { center: "System", core: "Core Area", tech: "Technology Area", invention: "Invention" };

function Paragraphs({ text, className = "" }) {
  if (!text) return null;
  return (
    <div className={`text-[13.5px] leading-[1.7] ${className}`} style={{ color: "#475569" }}>
      {text.split("\n\n").map((para, i) => (
        <p key={i} className={i > 0 ? "mt-3" : ""}>{para}</p>
      ))}
    </div>
  );
}

function SectionHeading({ children, color }) {
  return (
    <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color }}>
      {children}
    </h4>
  );
}

function Divider() {
  return <div className="my-5" style={{ borderTop: "1px solid #f1f5f9" }} />;
}

export default function Popup({ node, colorKey, ring, onClose }) {
  const ref = useRef(null);
  const c = COLOR_MAP[colorKey] || COLOR_MAP.detection;

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${RING_LABELS[ring] || "Invention"}: ${node.label}`}
      style={{ animation: "fadeIn 0.15s ease-out" }}
    >
      <div className="absolute inset-0" style={{ background: "rgba(15,23,42,0.3)", backdropFilter: "blur(2px)" }} />

      <div
        ref={ref}
        className="relative w-full max-w-[560px] bg-white rounded-xl overflow-hidden"
        style={{ boxShadow: "0 20px 50px -12px rgba(15,23,42,0.15), 0 0 0 1px rgba(15,23,42,0.05)", animation: "modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[75vh] overflow-y-auto">
          <div className="px-7 pt-6 pb-7">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "#94a3b8" }}>
                  {RING_LABELS[ring] || "Invention"}
                </p>
                <h2 className="text-[20px] font-semibold leading-tight" style={{ color: "#0f172a" }}>
                  {node.label}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-11 h-11 -mr-2 -mt-1 flex items-center justify-center rounded-full cursor-pointer"
                style={{ color: "#94a3b8" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
                aria-label="Close dialog"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Center node: executive summary */}
            {ring === "center" && (
              <Paragraphs text={node.summary} />
            )}

            {/* Core area: description + cluster summary */}
            {ring === "core" && (
              <div>
                <Paragraphs text={node.description} />
                {node.summary && (
                  <>
                    <Divider />
                    <SectionHeading color={c.accent}>How these inventions work together</SectionHeading>
                    <Paragraphs text={node.summary} />
                  </>
                )}
              </div>
            )}

            {/* Tech area: summary text */}
            {ring === "tech" && (
              <Paragraphs text={node.summary} />
            )}

            {/* Invention: accomplishes / works / superior as plain paragraphs */}
            {ring === "invention" && node.full && (
              <div>
                <SectionHeading color={c.accent}>What the invention accomplishes</SectionHeading>
                <Paragraphs text={node.full.accomplishes} />
                <Divider />
                <SectionHeading color={c.accent}>Why it works</SectionHeading>
                <Paragraphs text={node.full.works} />
                <Divider />
                <SectionHeading color={c.accent}>Why this produces a superior result</SectionHeading>
                <Paragraphs text={node.full.superior} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
