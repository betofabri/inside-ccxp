"use client";

// FunnelChart adaptado do componente original (21st.dev) pro stack do Insider:
// sem Tailwind/shadcn — utilitários viraram estilos inline + classes fc-* do
// globals.css. A mecânica (camadas, springs do motion, hover/dim) é a original.

import { motion, useSpring, useTransform } from "motion/react";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FunnelGradientStop {
  offset: string | number;
  color: string;
}

export interface FunnelStage {
  label: string;
  value: number;
  displayValue?: string;
  color?: string;
  gradient?: FunnelGradientStop[];
}

export interface FunnelChartProps {
  data: FunnelStage[];
  orientation?: "horizontal" | "vertical";
  color?: string;
  layers?: number;
  className?: string;
  style?: CSSProperties;
  showPercentage?: boolean;
  showValues?: boolean;
  showLabels?: boolean;
  formatPercentage?: (pct: number) => string;
  formatValue?: (value: number) => string;
  staggerDelay?: number;
  gap?: number;
  edges?: "curved" | "straight";
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const fmtPct = (p: number) => `${Math.round(p)}%`;
const fmtVal = (v: number) => v.toLocaleString("pt-BR");

const springConfig = { stiffness: 120, damping: 20, mass: 1 };
const hoverSpring = { stiffness: 300, damping: 24 };

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function hSegmentPath(
  normStart: number,
  normEnd: number,
  segW: number,
  H: number,
  layerScale: number,
  straight = false,
) {
  const my = H / 2;
  const h0 = normStart * H * 0.44 * layerScale;
  const h1 = normEnd * H * 0.44 * layerScale;

  if (straight) {
    return `M 0 ${my - h0} L ${segW} ${my - h1} L ${segW} ${my + h1} L 0 ${my + h0} Z`;
  }

  const cx = segW * 0.55;
  const top = `M 0 ${my - h0} C ${cx} ${my - h0}, ${segW - cx} ${my - h1}, ${segW} ${my - h1}`;
  const bot = `L ${segW} ${my + h1} C ${segW - cx} ${my + h1}, ${cx} ${my + h0}, 0 ${my + h0}`;
  return `${top} ${bot} Z`;
}

function vSegmentPath(
  normStart: number,
  normEnd: number,
  segH: number,
  W: number,
  layerScale: number,
  straight = false,
) {
  const mx = W / 2;
  const w0 = normStart * W * 0.44 * layerScale;
  const w1 = normEnd * W * 0.44 * layerScale;

  if (straight) {
    return `M ${mx - w0} 0 L ${mx - w1} ${segH} L ${mx + w1} ${segH} L ${mx + w0} 0 Z`;
  }

  const cy = segH * 0.55;
  const left = `M ${mx - w0} 0 C ${mx - w0} ${cy}, ${mx - w1} ${segH - cy}, ${mx - w1} ${segH}`;
  const right = `L ${mx + w1} ${segH} C ${mx + w1} ${segH - cy}, ${mx + w0} ${cy}, ${mx + w0} 0`;
  return `${left} ${right} Z`;
}

// ─── Animated ring ───────────────────────────────────────────────────────────

function Ring({
  d,
  fill,
  opacity,
  hovered,
  ringIndex,
  totalRings,
  eixo,
}: {
  d: string;
  fill: string;
  opacity: number;
  hovered: boolean;
  ringIndex: number;
  totalRings: number;
  eixo: "x" | "y";
}) {
  const extraScale = 1 + (ringIndex / Math.max(totalRings - 1, 1)) * 0.12;
  const ringSpring = {
    stiffness: 300 - ringIndex * 60,
    damping: 24 - ringIndex * 3,
  };
  const escala = useSpring(1, ringSpring);

  useEffect(() => {
    escala.set(hovered ? extraScale : 1);
  }, [hovered, escala, extraScale]);

  return (
    <motion.path
      d={d}
      fill={fill}
      opacity={opacity}
      style={
        eixo === "y"
          ? { scaleY: escala, transformOrigin: "center center" }
          : { scaleX: escala, transformOrigin: "center center" }
      }
    />
  );
}

// ─── Animated segment ────────────────────────────────────────────────────────

function Segmento({
  index,
  normStart,
  normEnd,
  segMaior,
  segMenor,
  color,
  layers,
  staggerDelay,
  hovered,
  dimmed,
  straight,
  gradientStops,
  horizontal,
}: {
  index: number;
  normStart: number;
  normEnd: number;
  segMaior: number; // dimensão cheia (H no horizontal, W no vertical)
  segMenor: number; // dimensão do segmento (W no horizontal, H no vertical)
  color: string;
  layers: number;
  staggerDelay: number;
  hovered: boolean;
  dimmed: boolean;
  straight: boolean;
  gradientStops?: FunnelGradientStop[];
  horizontal: boolean;
}) {
  const gradientId = `funil-grad-${horizontal ? "h" : "v"}-${index}`;
  const growProgress = useSpring(0, springConfig);
  const entranceScale = useTransform(growProgress, [0, 1], [0, 1]);
  const dimOpacity = useSpring(1, hoverSpring);

  useEffect(() => {
    dimOpacity.set(dimmed ? 0.4 : 1);
  }, [dimmed, dimOpacity]);

  useEffect(() => {
    const timeout = setTimeout(() => growProgress.set(1), index * staggerDelay * 1000);
    return () => clearTimeout(timeout);
  }, [growProgress, index, staggerDelay]);

  const rings = Array.from({ length: layers }, (_, l) => {
    const scale = 1 - (l / layers) * 0.35;
    const opacity = 0.18 + (l / (layers - 1 || 1)) * 0.65;
    const d = horizontal
      ? hSegmentPath(normStart, normEnd, segMenor, segMaior, scale, straight)
      : vSegmentPath(normStart, normEnd, segMenor, segMaior, scale, straight);
    return { d, opacity };
  });

  const w = horizontal ? segMenor : segMaior;
  const h = horizontal ? segMaior : segMenor;

  return (
    <motion.div
      style={{
        pointerEvents: "none",
        position: "relative",
        flexShrink: 0,
        overflow: "visible",
        width: w,
        height: h,
        zIndex: hovered ? 10 : 1,
        opacity: dimOpacity,
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
          scaleX: entranceScale,
          scaleY: entranceScale,
          transformOrigin: horizontal ? "left center" : "center top",
        }}
      >
        <svg
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
          preserveAspectRatio="none"
          role="presentation"
          viewBox={`0 0 ${w} ${h}`}
        >
          <defs>
            {gradientStops && (
              <linearGradient
                id={gradientId}
                x1="0"
                x2={horizontal ? "1" : "0"}
                y1="0"
                y2={horizontal ? "0" : "1"}
              >
                {gradientStops.map((stop) => (
                  <stop
                    key={`${stop.offset}-${stop.color}`}
                    offset={typeof stop.offset === "number" ? `${stop.offset * 100}%` : stop.offset}
                    stopColor={stop.color}
                  />
                ))}
              </linearGradient>
            )}
          </defs>
          {rings.map((r, i) => {
            const isInnermost = i === rings.length - 1;
            const fill = isInnermost && gradientStops ? `url(#${gradientId})` : color;
            return (
              <Ring
                d={r.d}
                fill={fill}
                hovered={hovered}
                key={`ring-${r.opacity.toFixed(2)}`}
                opacity={r.opacity}
                ringIndex={i}
                totalRings={layers}
                eixo={horizontal ? "y" : "x"}
              />
            );
          })}
        </svg>
      </motion.div>
    </motion.div>
  );
}

// ─── Label overlay ───────────────────────────────────────────────────────────

function RotuloSegmento({
  stage,
  pct,
  horizontal,
  showValues,
  showPercentage,
  showLabels,
  formatPercentage,
  formatValue,
  index,
  staggerDelay,
}: {
  stage: FunnelStage;
  pct: number;
  horizontal: boolean;
  showValues: boolean;
  showPercentage: boolean;
  showLabels: boolean;
  formatPercentage: (p: number) => string;
  formatValue: (v: number) => string;
  index: number;
  staggerDelay: number;
}) {
  const display = stage.displayValue ?? formatValue(stage.value);

  const valueEl = showValues && <span className="fc-valor">{display}</span>;
  // pill central carrega absoluto + percentual
  const pctEl = showPercentage && (
    <span className="fc-pct">
      {display} <small>· {formatPercentage(pct)}</small>
    </span>
  );
  const labelEl = showLabels && <span className="fc-label">{stage.label}</span>;

  const linha = (children: React.ReactNode, extra: CSSProperties) => (
    <div style={{ display: "flex", ...extra }}>{children}</div>
  );

  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: horizontal ? "column" : "row",
        alignItems: "center",
      }}
      transition={{ delay: index * staggerDelay + 0.25, duration: 0.35, ease: "easeOut" }}
    >
      {horizontal ? (
        <>
          {linha(valueEl, { height: "16%", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4 })}
          {linha(pctEl, { flex: 1, alignItems: "center", justifyContent: "center" })}
          {linha(labelEl, { height: "16%", alignItems: "flex-start", justifyContent: "center", paddingTop: 4 })}
        </>
      ) : (
        <>
          {linha(valueEl, { width: "16%", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 })}
          {linha(pctEl, { flex: 1, alignItems: "center", justifyContent: "center" })}
          {linha(labelEl, { width: "16%", alignItems: "center", justifyContent: "flex-start", paddingLeft: 8 })}
        </>
      )}
    </motion.div>
  );
}

// ─── FunnelChart ─────────────────────────────────────────────────────────────

export function FunnelChart({
  data,
  orientation = "horizontal",
  color = "var(--champagne)",
  layers = 3,
  className,
  style,
  showPercentage = true,
  showValues = true,
  showLabels = true,
  formatPercentage = fmtPct,
  formatValue = fmtVal,
  staggerDelay = 0.12,
  gap = 4,
  edges = "curved",
}: FunnelChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [sz, setSz] = useState({ w: 0, h: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const measure = useCallback(() => {
    if (!ref.current) return;
    const { width: w, height: h } = ref.current.getBoundingClientRect();
    if (w > 0 && h > 0) setSz({ w, h });
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, [measure]);

  if (!data.length) return null;
  const first = data[0];
  if (!first || first.value <= 0) return null;

  const max = first.value;
  const n = data.length;
  const norms = data.map((d) => d.value / max);
  const horiz = orientation === "horizontal";
  const { w: W, h: H } = sz;

  const totalGap = gap * (n - 1);
  const segW = (W - (horiz ? totalGap : 0)) / n;
  const segH = (H - (horiz ? 0 : totalGap)) / n;

  return (
    <div
      className={className}
      ref={ref}
      style={{
        position: "relative",
        width: "100%",
        userSelect: "none",
        overflow: "visible",
        aspectRatio: horiz ? "2.2 / 1" : "1 / 1.5",
        ...style,
      }}
    >
      {W > 0 && H > 0 && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: horiz ? "row" : "column",
              overflow: "visible",
              gap,
            }}
          >
            {data.map((stage, i) => {
              const firstStop = stage.gradient?.[0];
              const segColor = firstStop ? firstStop.color : (stage.color ?? color);
              return (
                <Segmento
                  color={segColor}
                  dimmed={hoveredIndex !== null && hoveredIndex !== i}
                  gradientStops={stage.gradient}
                  horizontal={horiz}
                  hovered={hoveredIndex === i}
                  index={i}
                  key={stage.label}
                  layers={layers}
                  normEnd={norms[Math.min(i + 1, n - 1)] ?? 0}
                  normStart={norms[i] ?? 0}
                  segMaior={horiz ? H : W}
                  segMenor={horiz ? segW : segH}
                  staggerDelay={staggerDelay}
                  straight={edges === "straight"}
                />
              );
            })}
          </div>

          {data.map((stage, i) => {
            const pct = (stage.value / max) * 100;
            const posStyle: CSSProperties = horiz
              ? { left: (segW + gap) * i, width: segW, top: 0, height: H }
              : { top: (segH + gap) * i, height: segH, left: 0, width: W };
            const isDimmed = hoveredIndex !== null && hoveredIndex !== i;

            return (
              <motion.div
                animate={{ opacity: isDimmed ? 0.4 : 1 }}
                key={`lbl-${stage.label}`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ position: "absolute", cursor: "pointer", ...posStyle, zIndex: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <RotuloSegmento
                  formatPercentage={formatPercentage}
                  formatValue={formatValue}
                  horizontal={horiz}
                  index={i}
                  pct={pct}
                  showLabels={showLabels}
                  showPercentage={showPercentage}
                  showValues={showValues}
                  stage={stage}
                  staggerDelay={staggerDelay}
                />
              </motion.div>
            );
          })}
        </>
      )}
    </div>
  );
}

FunnelChart.displayName = "FunnelChart";

export default FunnelChart;
