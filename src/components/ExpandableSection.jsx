"use client";
import { useState, useRef, useEffect } from "react";

export default function ExpandableSection({ title, bullets, fullText, accentColor, defaultExpanded }) {
  const [expanded, setExpanded] = useState(!!defaultExpanded);
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) setHeight(contentRef.current.scrollHeight);
  }, [expanded, fullText]);

  const hasBullets = bullets && bullets.length > 0;

  return (
    <div className="mb-3 last:mb-0">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: accentColor }}>
        {title}
      </h4>
      {hasBullets && (
        <ul className="space-y-1.5 mb-1.5">
          {bullets.map((bullet, i) => (
            <li key={i} className="text-[13px] leading-relaxed flex gap-2" style={{ color: "#475569" }}>
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
      {fullText && (
        <>
          {!defaultExpanded && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="text-[11px] font-medium cursor-pointer hover:underline mt-1"
              style={{ color: accentColor }}
            >
              {expanded ? "Show less" : "Read full detail"}
            </button>
          )}
          <div
            className="expand-section"
            style={{
              maxHeight: expanded || defaultExpanded ? (height || 2000) + "px" : "0px",
              opacity: expanded || defaultExpanded ? 1 : 0,
            }}
          >
            <div ref={contentRef} className={defaultExpanded ? "" : "pt-2"}>
              <p className="text-[13px] leading-relaxed" style={{ color: "#64748b" }}>
                {fullText}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
