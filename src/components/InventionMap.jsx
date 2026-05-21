"use client";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { inventionData } from "../data/inventions";
import Popup from "./Popup";

const COLORS = {
  enrollment: {
    fill: "#0D9488",
    border: "#14B8A6",
    glow: "rgba(13,148,136,0.15)",
  },
  detection: {
    fill: "#4B7BF5",
    border: "#6B93F7",
    glow: "rgba(75,123,245,0.15)",
  },
  latency: {
    fill: "#F59E0B",
    border: "#FBBF24",
    glow: "rgba(245,158,11,0.15)",
  },
};

const FILL_OPACITY = { core: 0.85, tech: 0.75, invention: 0.65 };
const BORDER_WIDTH = { core: 2.5, tech: 1.5, invention: 1 };

const CORE_AREA_KEYS = ["enrollment", "detection", "latency"];

function wrapText(text, maxCharsPerLine) {
  const tokens = [];
  for (const word of text.split(" ")) {
    const parts = word.split("-");
    parts.forEach((part, i) => {
      tokens.push(i < parts.length - 1 ? part + "-" : part);
    });
  }
  const lines = [];
  let current = "";
  for (const token of tokens) {
    const sep = current && !current.endsWith("-") ? " " : "";
    if (current && (current + sep + token).length > maxCharsPerLine) {
      lines.push(current);
      current = token;
    } else {
      current = current ? current + sep + token : token;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildConePath(cx, cy, innerR, outerR, startDeg, endDeg, roundR) {
  const toRad = (d) => (d * Math.PI) / 180;
  const pt = (r, deg) => ({ x: cx + r * Math.cos(toRad(deg)), y: cy + r * Math.sin(toRad(deg)) });

  const aInner = innerR > 0 ? (roundR / innerR) * (180 / Math.PI) : 0;
  const aOuter = (roundR / outerR) * (180 / Math.PI);
  const sweep = endDeg - startDeg;

  if (innerR <= roundR * 2) {
    const tip = pt(innerR, (startDeg + endDeg) / 2);
    const sideStart = pt(outerR, startDeg);
    const sideEnd = pt(outerR, endDeg);
    const arcStart = pt(outerR, startDeg + aOuter);
    const arcEnd = pt(outerR, endDeg - aOuter);
    const cornerSR = pt(outerR - roundR, startDeg);
    const cornerER = pt(outerR - roundR, endDeg);
    const largeArc = (sweep - 2 * aOuter) > 180 ? 1 : 0;

    return [
      `M ${tip.x} ${tip.y}`,
      `L ${cornerSR.x} ${cornerSR.y}`,
      `Q ${sideStart.x} ${sideStart.y} ${arcStart.x} ${arcStart.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${arcEnd.x} ${arcEnd.y}`,
      `Q ${sideEnd.x} ${sideEnd.y} ${cornerER.x} ${cornerER.y}`,
      `Z`,
    ].join(" ");
  }

  const iS_arc = pt(innerR, startDeg + aInner);
  const iS_rad = pt(innerR + roundR, startDeg);
  const iS = pt(innerR, startDeg);

  const iE_arc = pt(innerR, endDeg - aInner);
  const iE_rad = pt(innerR + roundR, endDeg);
  const iE = pt(innerR, endDeg);

  const oE_arc = pt(outerR, endDeg - aOuter);
  const oE_rad = pt(outerR - roundR, endDeg);
  const oE = pt(outerR, endDeg);

  const oS_arc = pt(outerR, startDeg + aOuter);
  const oS_rad = pt(outerR - roundR, startDeg);
  const oS = pt(outerR, startDeg);

  const innerLargeArc = (sweep - 2 * aInner) > 180 ? 1 : 0;
  const outerLargeArc = (sweep - 2 * aOuter) > 180 ? 1 : 0;

  return [
    `M ${iS_rad.x} ${iS_rad.y}`,
    `Q ${iS.x} ${iS.y} ${iS_arc.x} ${iS_arc.y}`,
    `A ${innerR} ${innerR} 0 ${innerLargeArc} 1 ${iE_arc.x} ${iE_arc.y}`,
    `Q ${iE.x} ${iE.y} ${iE_rad.x} ${iE_rad.y}`,
    `L ${oE_rad.x} ${oE_rad.y}`,
    `Q ${oE.x} ${oE.y} ${oE_arc.x} ${oE_arc.y}`,
    `A ${outerR} ${outerR} 0 ${outerLargeArc} 0 ${oS_arc.x} ${oS_arc.y}`,
    `Q ${oS.x} ${oS.y} ${oS_rad.x} ${oS_rad.y}`,
    `Z`,
  ].join(" ");
}

function CircleNode({
  nodeId, x, y, radius, label, color, fillOpacity, borderWidth, fontSize,
  isActive, isHovered, onMouseEnter, onMouseLeave, onClick, glowClass, ring,
}) {
  const maxChars = radius > 50 ? 16 : radius > 40 ? 12 : radius > 30 ? 10 : 9;
  const lines = wrapText(label, maxChars);
  const maxLines = radius > 50 ? 6 : radius > 40 ? 5 : radius > 30 ? 4 : 3;
  const displayLines = lines.length > maxLines
    ? [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(" ").slice(0, maxChars - 1) + "..."]
    : lines;
  const lineHeight = fontSize + 3;
  const startY = -(displayLines.length - 1) * lineHeight * 0.5;
  const clipId = `clip-${nodeId}`;
  const isCenter = ring === "center";

  return (
    <g
      className={`circle-node ${isActive || isHovered ? glowClass : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={x} cy={y} r={radius - 3} />
        </clipPath>
      </defs>
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={isCenter ? "#FFFFFF" : color.fill}
        fillOpacity={isCenter ? 1 : (isActive || isHovered ? fillOpacity + 0.15 : fillOpacity)}
        stroke={color.border}
        strokeWidth={isActive || isHovered ? borderWidth + 0.5 : borderWidth}
      />
      <g clipPath={`url(#${clipId})`}>
        {displayLines.map((line, i) => (
          <text
            key={i}
            x={x}
            y={y + startY + i * lineHeight}
            textAnchor="middle"
            dominantBaseline="central"
            fill={isCenter ? "#0F172A" : "#F1F5F9"}
            fontSize={fontSize}
            fontWeight={isCenter ? 700 : 500}
            fontFamily="var(--font-inter), system-ui, sans-serif"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {line}
          </text>
        ))}
      </g>
    </g>
  );
}

function ZoomControls({ onZoomIn, onZoomOut, onReset, scale }) {
  const btnStyle = {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 500,
    transition: "all 0.15s",
  };

  return (
    <div
      className="absolute bottom-4 left-4 flex flex-col gap-1 z-40 rounded-lg overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}
    >
      <button
        style={btnStyle}
        onClick={onZoomIn}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
        title="Zoom in"
      >
        +
      </button>
      <button
        style={btnStyle}
        onClick={onReset}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
        title="Reset view"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v3M7 1L5 3M7 1l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 13v-3M7 13l-2-2M7 13l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1 7h3M1 7l2-2M1 7l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13 7h-3M13 7l-2-2M13 7l-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button
        style={btnStyle}
        onClick={onZoomOut}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
        title="Zoom out"
      >
        -
      </button>
      <div
        className="text-center text-xs py-1"
        style={{ background: "var(--bg-surface)", color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}
      >
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}

export default function InventionMap() {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [activeNode, setActiveNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [pinned, setPinned] = useState(false);

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === "Escape") {
        setActiveNode(null);
        setPinned(false);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function handleWheel(e) {
      if (e.target.closest(".popup-enter")) return;
      e.preventDefault();
      const clampedDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 150);
      const factor = Math.pow(0.998, clampedDelta);
      setTransform((prev) => {
        const newScale = Math.min(Math.max(prev.scale * factor, 0.75), 3.5);
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const newX = mx - (mx - prev.x) * (newScale / prev.scale);
        const newY = my - (my - prev.y) * (newScale / prev.scale);
        return { x: newX, y: newY, scale: newScale };
      });
    }
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const didDragRef = useRef(false);

  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (e.target.closest(".circle-node") || e.target.closest(".popup-enter")) return;
      didDragRef.current = false;
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    },
    [transform.x, transform.y]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isPanning) return;
      didDragRef.current = true;
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      }));
    },
    [isPanning]
  );

  const handleMouseUp = useCallback((e) => {
    if (isPanning && !didDragRef.current && !e.target.closest(".popup-enter") && !e.target.closest(".circle-node")) {
      setActiveNode(null);
      setPinned(false);
    }
    setIsPanning(false);
  }, [isPanning]);

  const handleZoomIn = useCallback(() => {
    setTransform((prev) => {
      const newScale = Math.min(prev.scale * 1.2, 3.5);
      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;
      const newX = cx - (cx - prev.x) * (newScale / prev.scale);
      const newY = cy - (cy - prev.y) * (newScale / prev.scale);
      return { x: newX, y: newY, scale: newScale };
    });
  }, [dimensions]);

  const handleZoomOut = useCallback(() => {
    setTransform((prev) => {
      const newScale = Math.max(prev.scale * 0.83, 0.75);
      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;
      const newX = cx - (cx - prev.x) * (newScale / prev.scale);
      const newY = cy - (cy - prev.y) * (newScale / prev.scale);
      return { x: newX, y: newY, scale: newScale };
    });
  }, [dimensions]);

  const handleResetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  const layout = useMemo(() => {
    const { width, height } = dimensions;
    const cx = width / 2;
    const cy = height / 2;
    const minDim = Math.min(width, height);

    const r1 = minDim * 0.26;
    const r2 = minDim * 0.46;
    const r3 = minDim * 0.62;

    const coreAreas = inventionData.coreAreas;
    const totalInventions = coreAreas.reduce(
      (sum, ca) => sum + ca.techAreas.reduce((s, ta) => s + ta.inventions.length, 0),
      0
    );

    const gapDeg = 10;
    const totalGap = gapDeg * coreAreas.length;
    const availableDeg = 360 - totalGap;

    const sectorSizes = coreAreas.map((ca) => {
      const count = ca.techAreas.reduce((s, ta) => s + ta.inventions.length, 0);
      return Math.max(availableDeg * (count / totalInventions), 60);
    });
    const sectorTotal = sectorSizes.reduce((a, b) => a + b, 0);
    const scaleF = availableDeg / sectorTotal;
    const scaledSectors = sectorSizes.map((s) => s * scaleF);

    const nodes = [];
    const connections = [];

    const centerR = minDim * 0.085;
    nodes.push({
      id: "center",
      x: cx,
      y: cy,
      radius: centerR,
      label: inventionData.center.label,
      shortLabel: "Checkout Product Recognition",
      data: inventionData.center,
      ring: "center",
      color: { fill: "#4B7BF5", border: "#6B93F7" },
      colorKey: "detection",
      fillOpacity: 0.9,
      borderWidth: 2.5,
      fontSize: Math.max(11.5, minDim * 0.0135),
    });

    let angleOffset = -90;

    coreAreas.forEach((ca, caIdx) => {
      const colorKey = CORE_AREA_KEYS[caIdx];
      const color = COLORS[colorKey];
      const sectorDeg = scaledSectors[caIdx];
      const enrollBias = caIdx === 0 ? 10 : 0;
      const sectorStart = angleOffset + enrollBias;
      const sectorEnd = angleOffset + sectorDeg;
      const sectorMid = (sectorStart + sectorEnd) / 2;

      const caRad = (sectorMid * Math.PI) / 180;
      const coreX = cx + r1 * Math.cos(caRad);
      const coreY = cy + r1 * Math.sin(caRad);

      const coreR = minDim * 0.085;
      nodes.push({
        id: ca.id,
        x: coreX,
        y: coreY,
        radius: coreR,
        label: ca.label,
        shortLabel: ca.label,
        data: ca,
        ring: "core",
        color,
        colorKey,
        fillOpacity: FILL_OPACITY.core,
        borderWidth: BORDER_WIDTH.core,
        fontSize: Math.max(12.5, minDim * 0.0155),
        sectorStart,
        sectorEnd,
      });

      connections.push({ x1: cx, y1: cy, x2: coreX, y2: coreY, color: color.border, r1: centerR, r2: coreR });

      const techAreas = ca.techAreas;
      const techInvCounts = techAreas.map((ta) => ta.inventions.length);
      const techTotalInv = techInvCounts.reduce((a, b) => a + b, 0);

      const minTechDeg = Math.min(sectorDeg / techAreas.length, 18);
      const rawShares = techAreas.map((_, taIdx) => {
        const invBased = sectorDeg * (techInvCounts[taIdx] / techTotalInv);
        return Math.max(invBased, minTechDeg);
      });
      const rawTotal = rawShares.reduce((a, b) => a + b, 0);
      const techShares = rawShares.map((s) => (s / rawTotal) * sectorDeg);

      let techAngleOffset = sectorStart;
      techAreas.forEach((ta, taIdx) => {
        const taShare = techShares[taIdx];
        const taStart = techAngleOffset;
        const taEnd = techAngleOffset + taShare;
        const taMid = (taStart + taEnd) / 2;

        const taRad = (taMid * Math.PI) / 180;
        const techX = cx + r2 * Math.cos(taRad);
        const techY = cy + r2 * Math.sin(taRad);

        const techR = minDim * 0.06;
        nodes.push({
          id: `${ca.id}-${ta.id}`,
          x: techX,
          y: techY,
          radius: techR,
          label: ta.label,
          shortLabel: ta.shortLabel || ta.label,
          data: ta,
          ring: "tech",
          color,
          colorKey,
          fillOpacity: FILL_OPACITY.tech,
          borderWidth: BORDER_WIDTH.tech,
          fontSize: Math.max(10.5, minDim * 0.0115),
          taStart,
          taEnd,
        });

        connections.push({ x1: coreX, y1: coreY, x2: techX, y2: techY, color: color.border, r1: coreR, r2: techR });

        const invCount = ta.inventions.length;
        ta.inventions.forEach((inv, invIdx) => {
          const invAngle =
            invCount === 1
              ? taMid
              : taStart + (taShare * (invIdx + 0.5)) / invCount;
          const invRad = (invAngle * Math.PI) / 180;
          const invX = cx + r3 * Math.cos(invRad);
          const invY = cy + r3 * Math.sin(invRad);

          const invR = minDim * 0.048;
          nodes.push({
            id: `${ca.id}-${ta.id}-${inv.id}`,
            x: invX,
            y: invY,
            radius: invR,
            label: inv.label,
            shortLabel: inv.shortLabel,
            data: inv,
            ring: "invention",
            color,
            colorKey,
            fillOpacity: FILL_OPACITY.invention,
            borderWidth: BORDER_WIDTH.invention,
            fontSize: Math.max(9.5, minDim * 0.0105),
          });

          connections.push({ x1: techX, y1: techY, x2: invX, y2: invY, color: color.border, r1: techR, r2: invR });
        });

        techAngleOffset = taEnd;
      });

      angleOffset = sectorEnd + gapDeg;
    });

    return { nodes, connections, cx, cy, r1, r2, r3, centerR, coreR: minDim * 0.085, techR: minDim * 0.06, invR: minDim * 0.048 };
  }, [dimensions]);

  const handleNodeClick = useCallback(
    (node) => {
      if (pinned && activeNode?.id === node.id) {
        setActiveNode(null);
        setPinned(false);
      } else {
        setActiveNode(node);
        setPinned(true);
      }
    },
    [pinned, activeNode]
  );

  const handleBackgroundClick = useCallback(() => {
    if (pinned) {
      setActiveNode(null);
      setPinned(false);
    }
  }, [pinned]);

  const handleMouseEnterNode = useCallback(
    (node) => {
      setHoveredNode(node);
      if (!pinned) {
        setActiveNode(node);
      }
    },
    [pinned]
  );

  const handleMouseLeaveNode = useCallback(() => {
    setHoveredNode(null);
    if (!pinned) {
      setActiveNode(null);
    }
  }, [pinned]);

  const displayNode = activeNode;
  const popupAccentColor = displayNode ? COLORS[displayNode.colorKey]?.border : "#fff";

  const popupPosition = useMemo(() => {
    if (!displayNode) return null;
    return {
      x: displayNode.x * transform.scale + transform.x,
      y: displayNode.y * transform.scale + transform.y,
      radius: displayNode.radius * transform.scale,
    };
  }, [displayNode, transform]);

  const conePath = useMemo(() => {
    if (!pinned || !activeNode) return null;
    const node = activeNode;
    if (node.ring === "invention") return null;

    const minDim = Math.min(dimensions.width, dimensions.height);
    const outerR = layout.r3 + minDim * 0.04;
    const roundR = 14;

    if (node.ring === "core") {
      const innerR = minDim * 0.04;
      return {
        d: buildConePath(layout.cx, layout.cy, innerR, outerR, node.sectorStart - 2, node.sectorEnd + 2, roundR),
        color: node.color.fill,
      };
    }

    if (node.ring === "tech") {
      return {
        d: buildConePath(layout.cx, layout.cy, layout.r2 - minDim * 0.01, outerR, node.taStart - 1.5, node.taEnd + 1.5, roundR),
        color: node.color.fill,
      };
    }

    return null;
  }, [pinned, activeNode, layout, dimensions]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ cursor: isPanning ? "grabbing" : "grab", overflow: "hidden" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="absolute inset-0"
      >
        <rect width={dimensions.width} height={dimensions.height} fill="#E0E5F0" />

        <g
          transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
        >
          {(() => {
            const ringNames = ["CORE AREAS", "TECHNOLOGY AREAS", "INVENTIONS"];
            const band1 = (layout.r1 + layout.coreR + layout.r2 - layout.techR) / 2;
            const band2 = (layout.r2 + layout.techR + layout.r3 - layout.invR) / 2;
            const band3 = layout.r3 + layout.invR + 10;
            const radii = [band1, band2, band3];
            const innerRadii = [0, band1, band2];
            const bandFills = ["#D2D8E8", "#D9DFEB", "#E0E5F0"];
            return radii.map((r, i) => {
              const inner = innerRadii[i];
              const mid = (inner + r) / 2;
              const labelX = layout.cx;
              const labelYPos = layout.cy - mid;
              return (
                <g key={`ring-${i}`}>
                  <defs>
                    <mask id={`ring-mask-${i}`}>
                      <rect width={dimensions.width} height={dimensions.height} fill="black" />
                      <circle cx={layout.cx} cy={layout.cy} r={r} fill="white" />
                      <circle cx={layout.cx} cy={layout.cy} r={inner} fill="black" />
                    </mask>
                  </defs>
                  <circle
                    cx={layout.cx}
                    cy={layout.cy}
                    r={r}
                    fill={bandFills[i]}
                    mask={`url(#ring-mask-${i})`}
                  />
                  <circle
                    cx={layout.cx}
                    cy={layout.cy}
                    r={r}
                    fill="none"
                    stroke="#CBD5E1"
                    strokeWidth={0.75}
                  />
                  <text
                    x={labelX}
                    y={labelYPos}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#5B6B86"
                    fontSize={12}
                    fontWeight={700}
                    fontFamily="var(--font-inter), system-ui, sans-serif"
                    letterSpacing="0.08em"
                    style={{ userSelect: "none" }}
                  >
                    {ringNames[i]}
                  </text>
                </g>
              );
            });
          })()}

          {/* Center circle is rendered as part of layout.nodes */}

          {conePath && (
            <path
              className="cone-highlight"
              d={conePath.d}
              fill={conePath.color}
              style={{ pointerEvents: "none", opacity: 0.1 }}
            />
          )}

          {layout.connections.map((conn, i) => {
            const dx = conn.x2 - conn.x1;
            const dy = conn.y2 - conn.y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return null;
            const ux = dx / len;
            const uy = dy / len;
            return (
              <line
                key={`conn-${i}`}
                x1={conn.x1 + ux * conn.r1}
                y1={conn.y1 + uy * conn.r1}
                x2={conn.x2 - ux * conn.r2}
                y2={conn.y2 - uy * conn.r2}
                stroke={conn.color}
                strokeWidth={1.2}
                opacity={0.3}
              />
            );
          })}

          {layout.nodes.map((node) => (
            <CircleNode
              key={node.id}
              nodeId={node.id}
              x={node.x}
              y={node.y}
              radius={node.radius}
              label={node.shortLabel}
              color={node.color}
              fillOpacity={node.fillOpacity}
              borderWidth={node.borderWidth}
              fontSize={node.fontSize}
              ring={node.ring}
              isActive={activeNode?.id === node.id}
              isHovered={hoveredNode?.id === node.id}
              glowClass={`circle-glow-${node.colorKey}`}
              onMouseEnter={() => handleMouseEnterNode(node)}
              onMouseLeave={handleMouseLeaveNode}
              onClick={(e) => {
                e.stopPropagation();
                handleNodeClick(node);
              }}
            />
          ))}
        </g>
      </svg>

      {displayNode && popupPosition && (
        <Popup
          node={displayNode.data}
          position={popupPosition}
          containerRect={dimensions}
          onClose={() => {
            setActiveNode(null);
            setPinned(false);
          }}
          accentColor={popupAccentColor}
          forceAbove={displayNode.colorKey === "detection"}
        />
      )}

      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetView}
        scale={transform.scale}
      />
    </div>
  );
}
