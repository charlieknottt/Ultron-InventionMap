"use client";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { inventionData } from "../data/inventions";
import Popup from "./Popup";

const COLORS = {
  enrollment: { raw: "#059669", rawMid: "#d1fae5", rawBorder: "#6ee7b7", text: "#065f46" },
  detection: { raw: "#2563eb", rawMid: "#dbeafe", rawBorder: "#93c5fd", text: "#1e40af" },
  latency: { raw: "#d97706", rawMid: "#fef3c7", rawBorder: "#fcd34d", text: "#92400e" },
};

const CORE_AREA_KEYS = ["enrollment", "detection", "latency"];
const CORE_AREA_NUMBERS = ["1", "2", "3"];

function wrapText(text, maxCharsPerLine) {
  const tokens = [];
  for (const word of text.split(" ")) {
    const parts = word.split("-");
    parts.forEach((part, i) => { tokens.push(i < parts.length - 1 ? part + "-" : part); });
  }
  const lines = [];
  let current = "";
  for (const token of tokens) {
    const sep = current && !current.endsWith("-") ? " " : "";
    if (current && (current + sep + token).length > maxCharsPerLine) { lines.push(current); current = token; }
    else { current = current ? current + sep + token : token; }
  }
  if (current) lines.push(current);
  return lines;
}

function CircleNode({ x, y, radius, label, color, ring, isActive, isHovered, onMouseEnter, onMouseLeave, onClick }) {
  const maxChars = radius > 50 ? 14 : radius > 40 ? 11 : radius > 30 ? 9 : 8;
  const lines = wrapText(label, maxChars);
  const maxLines = radius > 50 ? 6 : radius > 40 ? 5 : radius > 30 ? 4 : 3;
  const displayLines = lines.length > maxLines
    ? [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(" ").slice(0, maxChars - 1) + "..."]
    : lines;
  const fontSize = ring === "center" ? 16 : ring === "core" ? 16 : ring === "tech" ? 14 : 12;
  const lineHeight = fontSize + 3;
  const startY = -(displayLines.length - 1) * lineHeight * 0.5;
  const active = isActive || isHovered;

  let fillColor, strokeColor, strokeWidth, textColor;
  if (ring === "center") { fillColor = "#0f172a"; strokeColor = "#0f172a"; strokeWidth = 0; textColor = "#fff"; }
  else if (ring === "core") { fillColor = color.raw; strokeColor = color.raw; strokeWidth = 0; textColor = "#fff"; }
  else if (ring === "tech") { fillColor = color.rawMid; strokeColor = color.raw; strokeWidth = 1.5; textColor = color.text; }
  else { fillColor = "#fff"; strokeColor = color.rawBorder; strokeWidth = 1.5; textColor = color.text; }

  return (
    <g style={{ cursor: "pointer" }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      {(ring === "center" || ring === "core") && <circle cx={x} cy={y + 2} r={radius + 1} fill="rgba(15,23,42,0.05)" />}
      {active && <circle cx={x} cy={y} r={radius + 4} fill="none" stroke={color.raw || "#0f172a"} strokeWidth={2} opacity={0.2} />}
      <circle cx={x} cy={y} r={radius} fill={fillColor} stroke={strokeColor} strokeWidth={active ? strokeWidth + 0.5 : strokeWidth} style={{ transition: "stroke-width 0.15s" }} />
      {displayLines.map((line, i) => (
        <text key={i} x={x} y={y + startY + i * lineHeight} textAnchor="middle" dominantBaseline="central"
          fill={textColor} fontSize={fontSize} fontWeight={700} fontFamily="var(--font-inter), system-ui, sans-serif"
          style={{ pointerEvents: "none", userSelect: "none" }}>{line}</text>
      ))}
    </g>
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
  const didDragRef = useRef(false);

  useEffect(() => {
    function updateSize() { if (containerRef.current) { const r = containerRef.current.getBoundingClientRect(); setDimensions({ width: r.width, height: r.height }); } }
    updateSize(); window.addEventListener("resize", updateSize); return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") { setActiveNode(null); setPinned(false); } };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    function handleWheel(e) {
      if (e.target.closest(".modal-overlay")) return;
      e.preventDefault();
      const d = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 150);
      const factor = Math.pow(0.998, d);
      setTransform((p) => {
        const ns = Math.min(Math.max(p.scale * factor, 0.5), 3.5);
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        return { x: mx - (mx - p.x) * (ns / p.scale), y: my - (my - p.y) * (ns / p.scale), scale: ns };
      });
    }
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0 || e.target.closest(".modal-overlay")) return;
    didDragRef.current = false; setIsPanning(true);
    panStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  }, [transform.x, transform.y]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return; didDragRef.current = true;
    setTransform((p) => ({ ...p, x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y }));
  }, [isPanning]);

  const handleMouseUp = useCallback(() => { setIsPanning(false); }, []);

  const zoomTo = useCallback((factor) => {
    setTransform((p) => {
      const ns = Math.min(Math.max(p.scale * factor, 0.5), 3.5);
      const cx = dimensions.width / 2, cy = dimensions.height / 2;
      return { x: cx - (cx - p.x) * (ns / p.scale), y: cy - (cy - p.y) * (ns / p.scale), scale: ns };
    });
  }, [dimensions]);

  const layout = useMemo(() => {
    const { width, height } = dimensions;
    const cx = width / 2, cy = height / 2, minDim = Math.min(width, height);
    const r1 = minDim * 0.26, r2 = minDim * 0.46, r3 = minDim * 0.62;
    const coreAreas = inventionData.coreAreas;
    const totalInv = coreAreas.reduce((s, ca) => s + ca.techAreas.reduce((s2, ta) => s2 + ta.inventions.length, 0), 0);
    const gapDeg = 14, availDeg = 360 - gapDeg * coreAreas.length;
    const sectors = coreAreas.map((ca) => Math.max(availDeg * (ca.techAreas.reduce((s, ta) => s + ta.inventions.length, 0) / totalInv), 60));
    const sf = availDeg / sectors.reduce((a, b) => a + b, 0);
    const scaled = sectors.map((s) => s * sf);

    const nodes = [], connections = [];
    const centerR = minDim * 0.085, coreR = minDim * 0.085, techR = minDim * 0.06, invR = minDim * 0.058;

    nodes.push({ id: "center", x: cx, y: cy, radius: centerR, label: inventionData.center.label, shortLabel: "Checkout Product Recognition", data: inventionData.center, ring: "center", colorKey: "detection" });

    let angleOff = -180;
    coreAreas.forEach((ca, ci) => {
      const ck = CORE_AREA_KEYS[ci], sd = scaled[ci];
      const ss = angleOff, se = angleOff + sd, sm = (ss + se) / 2;
      const cr = (sm * Math.PI) / 180;
      const cX = cx + r1 * Math.cos(cr), cY = cy + r1 * Math.sin(cr);
      const numberedLabel = `${CORE_AREA_NUMBERS[ci]}. ${ca.label}`;
      nodes.push({ id: ca.id, x: cX, y: cY, radius: coreR, label: numberedLabel, shortLabel: numberedLabel, data: ca, ring: "core", colorKey: ck, sectorStart: ss, sectorEnd: se });
      connections.push({ x1: cx, y1: cy, x2: cX, y2: cY, colorKey: ck, r1: centerR, r2: coreR });

      const tas = ca.techAreas, tic = tas.map((t) => t.inventions.length), tTotal = tic.reduce((a, b) => a + b, 0);
      const minTD = Math.min(sd / tas.length, 18);
      const raw = tas.map((_, i) => Math.max(sd * (tic[i] / tTotal), minTD));
      const rT = raw.reduce((a, b) => a + b, 0);
      const tShares = raw.map((s) => (s / rT) * sd);

      let tOff = ss;
      tas.forEach((ta, ti) => {
        const ts = tShares[ti], taS = tOff, taE = tOff + ts, taM = (taS + taE) / 2;
        const tr = (taM * Math.PI) / 180;
        const tX = cx + r2 * Math.cos(tr), tY = cy + r2 * Math.sin(tr);
        nodes.push({ id: `${ca.id}-${ta.id}`, x: tX, y: tY, radius: techR, label: ta.label, shortLabel: ta.shortLabel || ta.label, data: ta, ring: "tech", colorKey: ck, taStart: taS, taEnd: taE });
        connections.push({ x1: cX, y1: cY, x2: tX, y2: tY, colorKey: ck, r1: coreR, r2: techR });

        const ic = ta.inventions.length;
        ta.inventions.forEach((inv, ii) => {
          const ia = ic === 1 ? taM : taS + (ts * (ii + 0.5)) / ic;
          const ir = (ia * Math.PI) / 180;
          const iX = cx + r3 * Math.cos(ir), iY = cy + r3 * Math.sin(ir);
          nodes.push({ id: `${ca.id}-${ta.id}-${inv.id}`, x: iX, y: iY, radius: invR, label: inv.label, shortLabel: inv.shortLabel, data: inv, ring: "invention", colorKey: ck });
          connections.push({ x1: tX, y1: tY, x2: iX, y2: iY, colorKey: ck, r1: techR, r2: invR });
        });
        tOff = taE;
      });
      angleOff = se + gapDeg;
    });

    const band1Inner = centerR + 8, band1Outer = (r1 + coreR + r2 - techR) / 2;
    const band2Inner = band1Outer, band2Outer = (r2 + techR + r3 - invR) / 2;
    const band3Inner = band2Outer, band3Outer = r3 + invR + 8;
    const ringBands = [
      { inner: band1Inner, outer: band1Outer, fill: "rgba(100,116,139,0.12)" },
      { inner: band2Inner, outer: band2Outer, fill: "rgba(100,116,139,0.06)" },
      { inner: band3Inner, outer: band3Outer, fill: "rgba(100,116,139,0.12)" },
    ];

    const clusterArcs = nodes.filter(n => n.ring === "core").map(n => {
      const arcR = r3 + invR + 80;
      const barHalf = 24, rInner = arcR - barHalf, rOuter = arcR + barHalf;
      const sd1 = n.sectorStart + 3, sd2 = n.sectorEnd - 3;
      const angleDiff = sd2 - sd1;
      const largeArc = angleDiff > 180 ? 1 : 0;

      const a1 = (sd1 * Math.PI) / 180, a2 = (sd2 * Math.PI) / 180;
      const ix1 = cx + rInner * Math.cos(a1), iy1 = cy + rInner * Math.sin(a1);
      const ox1 = cx + rOuter * Math.cos(a1), oy1 = cy + rOuter * Math.sin(a1);
      const ix2 = cx + rInner * Math.cos(a2), iy2 = cy + rInner * Math.sin(a2);
      const ox2 = cx + rOuter * Math.cos(a2), oy2 = cy + rOuter * Math.sin(a2);
      const barPath = `M ${ix1} ${iy1} A ${barHalf} ${barHalf} 0 0 0 ${ox1} ${oy1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${ox2} ${oy2} A ${barHalf} ${barHalf} 0 0 0 ${ix2} ${iy2} A ${rInner} ${rInner} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;

      const midAngle = ((n.sectorStart + n.sectorEnd) / 2 + 360) % 360;
      const normMid = midAngle > 180 ? midAngle - 360 : midAngle;
      const isBottom = normMid > 0 && normMid < 180;
      const [tsd1, tsd2] = isBottom ? [sd2, sd1] : [sd1, sd2];
      const ts = (tsd1 * Math.PI) / 180, te = (tsd2 * Math.PI) / 180;
      const tx1 = cx + arcR * Math.cos(ts), ty1 = cy + arcR * Math.sin(ts);
      const tx2 = cx + arcR * Math.cos(te), ty2 = cy + arcR * Math.sin(te);
      const tSweep = isBottom ? 0 : 1;

      return { id: n.id, colorKey: n.colorKey, barPath, textPath: `M ${tx1} ${ty1} A ${arcR} ${arcR} 0 ${largeArc} ${tSweep} ${tx2} ${ty2}` };
    });

    return { nodes, connections, clusterArcs, ringBands, cx, cy, r1, r2, r3, centerR, coreR, techR, invR };
  }, [dimensions]);

  const handleNodeClick = useCallback((node) => {
    if (pinned && activeNode?.id === node.id) { setActiveNode(null); setPinned(false); }
    else { setActiveNode(node); setPinned(true); }
  }, [pinned, activeNode]);

  const handleMouseEnterNode = useCallback((node) => { setHoveredNode(node); if (!pinned) setActiveNode(node); }, [pinned]);
  const handleMouseLeaveNode = useCallback(() => { setHoveredNode(null); if (!pinned) setActiveNode(null); }, [pinned]);

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ cursor: isPanning ? "grabbing" : "grab", overflow: "hidden" }}
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <svg width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} className="absolute inset-0">
        <rect width={dimensions.width} height={dimensions.height} fill="#f1f5f9" />
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          <defs>
            {layout.clusterArcs.map(arc => (
              <path key={`arc-${arc.id}`} id={`arc-${arc.id}`} d={arc.textPath} fill="none" />
            ))}
          </defs>
          {/* Ring bands */}
          {layout.ringBands.map((band, i) => (
            <circle key={`band-${i}`} cx={layout.cx} cy={layout.cy}
              r={(band.inner + band.outer) / 2} fill="none"
              stroke={band.fill} strokeWidth={band.outer - band.inner} />
          ))}
          {/* Ring guide circles */}
          {[layout.r1, layout.r2, layout.r3].map((r, i) => {
            const pad = [layout.coreR, layout.techR, layout.invR][i];
            return <circle key={i} cx={layout.cx} cy={layout.cy} r={r + pad} fill="none" stroke="#cbd5e1" strokeWidth={0.5} strokeDasharray="4 4" opacity={0.4} />;
          })}
          {/* Ring labels */}
          {["CORE AREAS", "TECHNOLOGY AREAS", "INVENTIONS"].map((lbl, i) => {
            const radii = [(layout.r1 + layout.coreR + layout.r2 - layout.techR) / 2, (layout.r2 + layout.techR + layout.r3 - layout.invR) / 2, layout.r3 + layout.invR + 18];
            return <text key={lbl} x={layout.cx} y={layout.cy - radii[i]} textAnchor="middle" dominantBaseline="central" fill="#334155" fontSize={20} fontWeight={800} fontFamily="var(--font-inter), system-ui, sans-serif" letterSpacing="0.15em" style={{ userSelect: "none" }}>{lbl}</text>;
          })}
          {layout.connections.map((c, i) => {
            const dx = c.x2 - c.x1, dy = c.y2 - c.y1, len = Math.sqrt(dx * dx + dy * dy);
            if (!len) return null; const ux = dx / len, uy = dy / len;
            return <line key={i} x1={c.x1 + ux * c.r1} y1={c.y1 + uy * c.r1} x2={c.x2 - ux * c.r2} y2={c.y2 - uy * c.r2} stroke={COLORS[c.colorKey].rawBorder} strokeWidth={1.5} opacity={0.6} />;
          })}
          {layout.nodes.map((n) => (
            <CircleNode key={n.id} x={n.x} y={n.y} radius={n.radius} label={n.shortLabel} color={COLORS[n.colorKey]} ring={n.ring}
              isActive={activeNode?.id === n.id} isHovered={hoveredNode?.id === n.id}
              onMouseEnter={() => handleMouseEnterNode(n)} onMouseLeave={handleMouseLeaveNode}
              onClick={(e) => { e.stopPropagation(); handleNodeClick(n); }} />
          ))}
          {layout.clusterArcs.map(arc => (
            <g key={`ca-${arc.id}`} className="cluster-arc" style={{ cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); const cn = layout.nodes.find(n => n.id === arc.id); if (cn) handleNodeClick({ ...cn, ring: "cluster" }); }}>
              <path d={arc.barPath} fill={COLORS[arc.colorKey].raw} stroke={COLORS[arc.colorKey].raw} strokeWidth={1} opacity={0.92} />
              <text fill="#fff" fontSize={16} fontWeight={700}
                fontFamily="var(--font-inter), system-ui, sans-serif"
                style={{ letterSpacing: "0.02em", pointerEvents: "none", userSelect: "none" }}>
                <textPath href={`#arc-${arc.id}`} startOffset="50%" textAnchor="middle">
                  See how this cluster of inventions works together
                </textPath>
              </text>
            </g>
          ))}
        </g>
      </svg>

      {activeNode && pinned && (
        <Popup node={activeNode.data} colorKey={activeNode.colorKey} ring={activeNode.ring} onClose={() => { setActiveNode(null); setPinned(false); }} />
      )}

      <div className="absolute bottom-4 left-4 flex flex-col z-40 rounded-lg overflow-hidden" style={{ background: "#fff", border: "1px solid var(--border)", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
        {[{ label: "+", action: () => zoomTo(1.2), ariaLabel: "Zoom in" }, { label: "fit", action: () => setTransform({ x: 0, y: 0, scale: 1 }), ariaLabel: "Fit to screen" }, { label: "−", action: () => zoomTo(0.83), ariaLabel: "Zoom out" }].map((b, i) => (
          <button key={i} onClick={b.action} aria-label={b.ariaLabel} className="w-10 h-10 flex items-center justify-center cursor-pointer text-[15px] font-medium hover:bg-slate-50 transition-colors" style={{ color: "var(--text-secondary)", borderTop: i ? "1px solid var(--border)" : "none" }}>{b.label}</button>
        ))}
        <div className="text-center text-[10px] py-1.5 font-medium" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>{Math.round(transform.scale * 100)}%</div>
      </div>
    </div>
  );
}
