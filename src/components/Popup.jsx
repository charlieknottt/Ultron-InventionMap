"use client";
import { useRef, useEffect, useState } from "react";
import ExpandableSection from "./ExpandableSection";

export default function Popup({ node, position, containerRect, onClose, accentColor, forceAbove }) {
  const popupRef = useRef(null);
  const [adjustedPos, setAdjustedPos] = useState(null);
  const [arrowSide, setArrowSide] = useState("bottom");
  const [arrowLeftPx, setArrowLeftPx] = useState(null);

  useEffect(() => {
    if (!popupRef.current || !containerRect) return;
    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    const padding = 16;

    let x = position.x;
    let y = position.y - position.radius - 16;
    let arrow = "bottom";

    if (!forceAbove && y - rect.height < padding) {
      y = position.y + position.radius + 16;
      arrow = "top";
    }

    const halfWidth = rect.width / 2;
    if (x - halfWidth < padding) {
      x = halfWidth + padding;
    } else if (x + halfWidth > containerRect.width - padding) {
      x = containerRect.width - halfWidth - padding;
    }

    let finalY = arrow === "bottom" ? y - rect.height : y;
    finalY = Math.max(padding, Math.min(finalY, containerRect.height - rect.height - padding));
    x = Math.max(halfWidth + padding, Math.min(x, containerRect.width - halfWidth - padding));

    const arrowLeft = position.x - x + halfWidth;
    const clampedArrowLeft = Math.max(24, Math.min(arrowLeft, rect.width - 24));

    setAdjustedPos({ x, y: finalY });
    setArrowSide(arrow);
    setArrowLeftPx(clampedArrowLeft);
  }, [position, containerRect, forceAbove]);

  const isInvention = node.condensed;
  const isSummaryNode = node.summary && !node.condensed;

  return (
    <div
      ref={popupRef}
      className="popup-enter absolute z-50 pointer-events-auto"
      style={{
        left: adjustedPos ? `${adjustedPos.x}px` : `${position.x}px`,
        top: adjustedPos ? `${adjustedPos.y}px` : `${position.y - 200}px`,
        transform: "translateX(-50%)",
        maxWidth: "440px",
        minWidth: "340px",
        opacity: adjustedPos ? 1 : 0,
      }}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="rounded-xl border shadow-2xl relative"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          boxShadow: `0 0 30px ${accentColor}15, 0 20px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06)`,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="p-4 overflow-y-auto">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h3
              className="text-base font-semibold leading-snug"
              style={{ color: "var(--text-primary)" }}
            >
              {node.label}
            </h3>
            <button
              onClick={onClose}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full cursor-pointer transition-colors"
              style={{
                color: "var(--text-muted)",
                background: "var(--bg-surface-hover)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M1 1L9 9M9 1L1 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {isInvention && (
            <div>
              <ExpandableSection
                title="What it accomplishes"
                bullets={node.condensed.accomplishes}
                fullText={node.full?.accomplishes}
                accentColor={accentColor}
              />
              <div
                className="my-3 border-t"
                style={{ borderColor: "var(--border)" }}
              />
              <ExpandableSection
                title="Why it works"
                bullets={node.condensed.works}
                fullText={node.full?.works}
                accentColor={accentColor}
              />
              <div
                className="my-3 border-t"
                style={{ borderColor: "var(--border)" }}
              />
              <ExpandableSection
                title="Why it produces a superior result"
                bullets={node.condensed.superior}
                fullText={node.full?.superior}
                accentColor={accentColor}
              />
            </div>
          )}

          {isSummaryNode && (
            <div
              className="pr-1 text-sm leading-relaxed"
              style={{
                color: "var(--text-secondary)",
              }}
            >
              {node.summary.split("\n\n").map((para, i) => (
                <p key={i} className={i > 0 ? "mt-3" : ""}>
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>

        <div
          className={`popup-arrow ${arrowSide === "top" ? "popup-arrow-top" : ""}`}
          style={{
            background: "var(--bg-surface)",
            left: arrowLeftPx != null ? `${arrowLeftPx}px` : "50%",
          }}
        />
      </div>
    </div>
  );
}
