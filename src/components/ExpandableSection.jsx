"use client";
import { useState, useRef, useEffect } from "react";

export default function ExpandableSection({ title, bullets, fullText, accentColor }) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [expanded, fullText]);

  return (
    <div className="mb-2 last:mb-0">
      <h4
        className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: accentColor }}
      >
        {title}
      </h4>
      <ul className="space-y-1.5 mb-1.5">
        {bullets.map((bullet, i) => (
          <li
            key={i}
            className="text-xs leading-relaxed flex gap-2"
            style={{ color: "var(--text-secondary)" }}
          >
            <span
              className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: accentColor, opacity: 0.6 }}
            />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      {fullText && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-xs font-medium cursor-pointer hover:underline transition-colors mt-1"
            style={{ color: accentColor }}
          >
            {expanded ? "Show less" : "Read full detail"}
          </button>
          <div
            className="expand-section"
            style={{
              maxHeight: expanded ? height + "px" : "0px",
              opacity: expanded ? 1 : 0,
            }}
          >
            <div ref={contentRef} className="pt-2">
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {fullText}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
