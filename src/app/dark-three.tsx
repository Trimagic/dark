"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import {
  NODES,
  LINKS,
  FAMILY_COLORS,
  nodeById,
  parentsOf,
  childrenOf,
  partnersOf,
  type DarkNode,
  type DarkLink,
  type LinkType,
} from "./data";

type Mode = { kind: "force" } | { kind: "tree"; rootId: string };

type SimNode = DarkNode & d3.SimulationNodeDatum;
type SimLink = d3.SimulationLinkDatum<SimNode> &
  Pick<DarkLink, "type" | "note">;

const colOf = (d: DarkNode) => FAMILY_COLORS[d.family];

const linkStroke = (t: LinkType) =>
  t === "partner"
    ? "#c9a049"
    : t === "paradox_parent"
      ? "#7a2e26"
      : t === "adoptive"
        ? "#5a4720"
        : t === "sibling"
          ? "#3a5a7e"
          : "#5a554c";

const linkDash = (t: LinkType) =>
  t === "partner"
    ? "5,4"
    : t === "adoptive"
      ? "3,3"
      : t === "sibling"
        ? "2,3"
        : "none";

const linkArrow = (t: LinkType) =>
  t === "parent"
    ? "url(#a-parent)"
    : t === "paradox_parent"
      ? "url(#a-paradox)"
      : t === "adoptive"
        ? "url(#a-adopt)"
        : null;

const modeEqual = (a: Mode, b: Mode) =>
  a.kind === b.kind &&
  (a.kind === "force" || (b.kind === "tree" && a.rootId === b.rootId));

const EXIT_MS = 320;
const ENTER_MS = 480;

export default function DarkTree() {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const transitioningRef = useRef(false);

  // mode = what user wants, displayMode = what's actually rendered (lags during exit anim)
  const [mode, setMode] = useState<Mode>({ kind: "force" });
  const [displayMode, setDisplayMode] = useState<Mode>({ kind: "force" });
  const [hint, setHint] = useState(true);

  const requestMode = useCallback((next: Mode) => {
    if (transitioningRef.current) return;
    setMode((prev) => (modeEqual(prev, next) ? prev : next));
  }, []);

  // ============== EXIT ANIMATION ==============
  useEffect(() => {
    if (modeEqual(mode, displayMode)) return;
    const svgEl = svgRef.current;
    if (!svgEl) {
      setDisplayMode(mode);
      return;
    }

    transitioningRef.current = true;
    const stage = d3.select(svgEl).select<SVGGElement>("g.stage");
    if (stage.empty()) {
      setDisplayMode(mode);
      transitioningRef.current = false;
      return;
    }

    stage
      .interrupt()
      .transition()
      .duration(EXIT_MS)
      .ease(d3.easeCubicIn)
      .style("opacity", 0)
      .on("end", () => setDisplayMode(mode));
  }, [mode, displayMode]);

  // ============== TOOLTIP ==============
  const showTooltip = useCallback(
    (event: MouseEvent, d: DarkNode, kind?: "partner", paradox?: boolean) => {
      const tt = tooltipRef.current;
      const wrap = wrapRef.current;
      if (!tt || !wrap) return;
      const c = colOf(d);

      tt.innerHTML = `
        <div class="font-display text-[15px] font-semibold tracking-wider uppercase mb-2 leading-tight" style="color:${c}">${d.full}</div>
        ${d.born ? `<div class="text-[10px] text-[#8a8378] mt-0.5"><b class="text-[#d8d2c4] font-normal">рождение</b> · ${d.born}</div>` : ""}
        ${d.died ? `<div class="text-[10px] text-[#8a8378] mt-0.5"><b class="text-[#d8d2c4] font-normal">смерть</b> · ${d.died}</div>` : ""}
        <div class="text-[10px] text-[#8a8378] mt-0.5"><b class="text-[#d8d2c4] font-normal">род</b> · ${d.family}</div>
        ${d.occupation ? `<div class="text-[10px] text-[#8a8378] mt-0.5"><b class="text-[#d8d2c4] font-normal">занятие</b> · ${d.occupation}</div>` : ""}
        ${d.aliases?.length ? `<div class="text-[10px] mt-0.5 text-[#5a554c] italic">«${d.aliases.join(" · ")}»</div>` : ""}
        ${d.timetravel ? `<div class="inline-block mt-2 px-1.5 py-0.5 border border-[#5a4720] text-[8px] tracking-[1.5px] text-[#c9a049] uppercase">◷ путешественник</div>` : ""}
        ${paradox ? `<div class="inline-block mt-2 ml-1 px-1.5 py-0.5 border border-[#7a2e26] text-[8px] tracking-[1.5px] text-[#a83a2e] uppercase">♾ парадокс петли</div>` : ""}
        ${kind === "partner" ? `<div class="text-[10px] text-[#c9a049] mt-1.5">◊ супруг(а) выбранного</div>` : ""}
        ${d.dead ? `<div class="text-[#7a2e26] text-[10px] mt-1.5 tracking-[2px]">† умер</div>` : ""}
      `;
      tt.style.display = "block";
      const tw = tt.offsetWidth;
      const rect = wrap.getBoundingClientRect();
      const x = event.clientX - rect.left + 18;
      const y = event.clientY - rect.top - 30;
      tt.style.left = `${Math.min(x, rect.width - tw - 12)}px`;
      tt.style.top = `${Math.max(y, 12)}px`;
    },
    [],
  );

  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) tooltipRef.current.style.display = "none";
  }, []);

  // ============== MAIN RENDER ==============
  useEffect(() => {
    const svgEl = svgRef.current;
    const wrap = wrapRef.current;
    if (!svgEl || !wrap) return;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
    if (simRef.current) {
      simRef.current.stop();
      simRef.current = null;
    }

    const W = wrap.clientWidth;
    const H = wrap.clientHeight;

    // ---- defs ----
    const defs = svg.append("defs");
    (
      [
        ["a-parent", "#8a8378"],
        ["a-paradox", "#7a2e26"],
        ["a-adopt", "#5a4720"],
      ] as const
    ).forEach(([id, c]) => {
      defs
        .append("marker")
        .attr("id", id)
        .attr("viewBox", "0 -4 8 8")
        .attr("refX", 22)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-4L8,0L0,4")
        .attr("fill", c);
    });

    const fGlow = defs
      .append("filter")
      .attr("id", "glow-amber")
      .attr("x", "-100%")
      .attr("y", "-100%")
      .attr("width", "300%")
      .attr("height", "300%");
    fGlow
      .append("feGaussianBlur")
      .attr("stdDeviation", "5")
      .attr("result", "b");
    fGlow
      .append("feFlood")
      .attr("flood-color", "#c9a049")
      .attr("flood-opacity", "0.7")
      .attr("result", "c");
    fGlow
      .append("feComposite")
      .attr("in", "c")
      .attr("in2", "b")
      .attr("operator", "in")
      .attr("result", "g");
    const m1 = fGlow.append("feMerge");
    m1.append("feMergeNode").attr("in", "g");
    m1.append("feMergeNode").attr("in", "SourceGraphic");

    const fParadox = defs
      .append("filter")
      .attr("id", "glow-paradox")
      .attr("x", "-100%")
      .attr("y", "-100%")
      .attr("width", "300%")
      .attr("height", "300%");
    fParadox
      .append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "b");
    fParadox
      .append("feFlood")
      .attr("flood-color", "#a83a2e")
      .attr("flood-opacity", "0.85")
      .attr("result", "c");
    fParadox
      .append("feComposite")
      .attr("in", "c")
      .attr("in2", "b")
      .attr("operator", "in")
      .attr("result", "g");
    const mp = fParadox.append("feMerge");
    mp.append("feMergeNode").attr("in", "g");
    mp.append("feMergeNode").attr("in", "SourceGraphic");

    const fShadow = defs
      .append("filter")
      .attr("id", "shadow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    fShadow
      .append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", "2");
    fShadow
      .append("feOffset")
      .attr("dx", "0")
      .attr("dy", "1")
      .attr("result", "o");
    fShadow
      .append("feFlood")
      .attr("flood-color", "#000")
      .attr("flood-opacity", "0.6");
    fShadow
      .append("feComposite")
      .attr("in2", "o")
      .attr("operator", "in")
      .attr("result", "s");
    const m2 = fShadow.append("feMerge");
    m2.append("feMergeNode").attr("in", "s");
    m2.append("feMergeNode").attr("in", "SourceGraphic");

    // 'stage' is the wrapper we fade out on exit
    const stage = svg.append("g").attr("class", "stage").style("opacity", 1);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 7])
      .on("zoom", (e) => stage.attr("transform", e.transform.toString()));
    svg.call(zoom);
    svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
    svg.on("click", () => hideTooltip());

    const transitionDoneTimer = setTimeout(() => {
      transitioningRef.current = false;
    }, ENTER_MS + 100);

    // ============== FORCE GRAPH ==============
    if (displayMode.kind === "force") {
      const nodes: SimNode[] = NODES.map((n) => ({ ...n }));
      const links: SimLink[] = LINKS.map((l) => ({
        source: l.s,
        target: l.t,
        type: l.type,
        note: l.note,
      }));

      const sim = d3
        .forceSimulation<SimNode, SimLink>(nodes)
        .force(
          "link",
          d3
            .forceLink<SimNode, SimLink>(links)
            .id((d) => d.id)
            .distance((d) => (d.type === "partner" ? 55 : 95))
            .strength((d) => (d.type === "partner" ? 0.2 : 0.6)),
        )
        .force("charge", d3.forceManyBody().strength(-380))
        .force("center", d3.forceCenter(W / 2, H / 2))
        .force("collide", d3.forceCollide(38));
      simRef.current = sim;

      const linkG = stage.append("g").attr("opacity", 0);
      linkG.transition().duration(ENTER_MS).attr("opacity", 1);

      const lsel = linkG
        .selectAll<SVGLineElement, SimLink>("line")
        .data(links)
        .join("line")
        .attr("stroke", (d) => linkStroke(d.type))
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", (d) => linkDash(d.type))
        .attr("marker-end", (d) => linkArrow(d.type) ?? null)
        .attr("opacity", 0.45);

      const nsel = stage
        .append("g")
        .selectAll<SVGGElement, SimNode>("g")
        .data(nodes)
        .join("g")
        .attr("class", "cursor-pointer")
        .call(
          d3
            .drag<SVGGElement, SimNode>()
            .on("start", (e, d) => {
              if (!e.active) sim.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on("drag", (e, d) => {
              d.fx = e.x;
              d.fy = e.y;
            })
            .on("end", (e, d) => {
              if (!e.active) sim.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            }),
        )
        .on("click", (event, d) => {
          event.stopPropagation();
          requestMode({ kind: "tree", rootId: d.id });
        })
        .on("mouseover", (event, d) => showTooltip(event, d))
        .on("mouseout", () => hideTooltip());

      nsel
        .filter((d) => !!d.timetravel)
        .append("circle")
        .attr("r", 22)
        .attr("fill", "none")
        .attr("stroke", "#c9a049")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,3")
        .attr("opacity", 0.55);

      nsel
        .append("circle")
        .attr("r", 16)
        .attr("fill", "none")
        .attr("stroke", (d) => colOf(d))
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.4);

      nsel
        .append("circle")
        .attr("r", 13)
        .attr("fill", (d) => colOf(d))
        .attr("fill-opacity", (d) => (d.dead ? 0.5 : 0.92))
        .attr("stroke", (d) => (d.dead ? "#0a0908" : "#c9a049"))
        .attr("stroke-width", (d) => (d.dead ? 1.5 : 0.8))
        .attr("filter", "url(#shadow)");

      nsel
        .filter((d) => d.dead)
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.4em")
        .attr("font-size", "11px")
        .attr("fill", "#d8d2c4")
        .attr("opacity", 0.85)
        .text("†");

      nsel
        .append("text")
        .attr(
          "class",
          "font-display uppercase tracking-wider pointer-events-none",
        )
        .attr("text-anchor", "middle")
        .attr("dy", "2.4em")
        .attr("font-size", "9.5px")
        .attr("fill", "#8a8378")
        .text((d) => d.full.split(" ")[0]);
      nsel
        .append("text")
        .attr(
          "class",
          "font-display uppercase tracking-wider pointer-events-none",
        )
        .attr("text-anchor", "middle")
        .attr("dy", "3.5em")
        .attr("font-size", "9.5px")
        .attr("fill", "#5a554c")
        .text((d) => d.full.split(" ").slice(1).join(" "));

      sim.on("tick", () => {
        lsel
          .attr("x1", (d) => (d.source as SimNode).x ?? 0)
          .attr("y1", (d) => (d.source as SimNode).y ?? 0)
          .attr("x2", (d) => (d.target as SimNode).x ?? 0)
          .attr("y2", (d) => (d.target as SimNode).y ?? 0);
        nsel.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

      const t = setTimeout(() => setHint(false), 4500);
      return () => {
        clearTimeout(t);
        clearTimeout(transitionDoneTimer);
        sim.stop();
      };
    }

    // ============== TREE ==============
    setHint(false);
    const rootId = displayMode.rootId;
    const CX = W / 2,
      CY = H / 2;
    const VGAP = 120,
      HGAP = 110;

    type TNode = {
      id: string;
      children: TNode[];
      linkType?: LinkType;
      paradox?: boolean;
    };

    // Path-tracking traversal: if id appears in current path → cycle → mark paradox & stop
    const buildAnc = (
      id: string,
      depth: number,
      path: string[] = [],
    ): TNode => {
      if (path.includes(id)) return { id, children: [], paradox: true };
      if (depth <= 0) return { id, children: [] };
      const newPath = [...path, id];
      return {
        id,
        children: (parentsOf[id] || []).map((p) => ({
          ...buildAnc(p.id, depth - 1, newPath),
          linkType: p.type,
        })),
      };
    };
    const buildDesc = (
      id: string,
      depth: number,
      path: string[] = [],
    ): TNode => {
      if (path.includes(id)) return { id, children: [], paradox: true };
      if (depth <= 0) return { id, children: [] };
      const newPath = [...path, id];
      return {
        id,
        children: (childrenOf[id] || []).map((k) => ({
          ...buildDesc(k.id, depth - 1, newPath),
          linkType: k.type,
        })),
      };
    };

    type LaidNode = {
      id: string;
      x: number;
      y: number;
      depth: number;
      linkType?: LinkType;
      paradox?: boolean;
    };
    type LaidEdge = {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      type: LinkType;
    };

    const layout = (
      data: TNode,
      isUp: boolean,
    ): { nodes: LaidNode[]; edges: LaidEdge[] } => {
      const h = d3.hierarchy<TNode>(data);
      d3.tree<TNode>().nodeSize([HGAP, VGAP])(h);
      const nodes: LaidNode[] = [];
      const edges: LaidEdge[] = [];
      h.each((n) => {
        const x = n.x ?? 0;
        const y = isUp ? -n.depth * VGAP : n.depth * VGAP;
        nodes.push({
          id: n.data.id,
          x: CX + x,
          y: CY + y,
          depth: n.depth,
          linkType: n.data.linkType,
          paradox: n.data.paradox,
        });
        if (n.parent) {
          const px = CX + (n.parent.x ?? 0);
          const py = isUp
            ? CY - n.parent.depth * VGAP
            : CY + n.parent.depth * VGAP;
          edges.push({
            x1: px,
            y1: py,
            x2: CX + x,
            y2: CY + y,
            type: n.data.linkType ?? "parent",
          });
        }
      });
      return { nodes, edges };
    };

    const up = layout(buildAnc(rootId, 3), true);
    const down = layout(buildDesc(rootId, 3), false);

    // ===== Detect ALL paradox ids =====
    // (a) any node flagged during traversal (cycle terminator)
    // (b) any id in BOTH ancestors AND descendants (and isn't root) — temporal loop through this person
    // (c) root itself, if it appears among its own ancestors or descendants
    const paradoxIds = new Set<string>();
    up.nodes.forEach((n) => {
      if (n.paradox) paradoxIds.add(n.id);
    });
    down.nodes.forEach((n) => {
      if (n.paradox) paradoxIds.add(n.id);
    });
    const ancIds = new Set(
      up.nodes.filter((n) => n.depth > 0).map((n) => n.id),
    );
    const descIds = new Set(
      down.nodes.filter((n) => n.depth > 0).map((n) => n.id),
    );
    ancIds.forEach((id) => {
      if (descIds.has(id)) paradoxIds.add(id);
    });
    if (ancIds.has(rootId) || descIds.has(rootId)) paradoxIds.add(rootId);

    const partners = (partnersOf[rootId] || []).map((p, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const off = Math.floor(i / 2) + 1;
      return { id: p.id, x: CX + side * (80 + off * 60), y: CY, note: p.note };
    });

    // ---- edges ----
    const edgeG = stage.append("g").attr("opacity", 0);
    edgeG
      .transition()
      .duration(ENTER_MS * 0.7)
      .attr("opacity", 1);

    const drawCurve = (e: LaidEdge) => {
      const my = (e.y1 + e.y2) / 2;
      const path = `M${e.x1},${e.y1} C${e.x1},${my} ${e.x2},${my} ${e.x2},${e.y2}`;
      edgeG
        .append("path")
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", linkStroke(e.type))
        .attr("stroke-width", 1.4)
        .attr(
          "stroke-dasharray",
          e.type === "adoptive"
            ? "3,3"
            : e.type === "paradox_parent"
              ? "6,3"
              : "none",
        )
        .attr("marker-end", linkArrow(e.type) ?? null)
        .attr("opacity", 0.7)
        .attr("filter", "url(#shadow)");
    };
    up.edges.forEach(drawCurve);
    down.edges.forEach(drawCurve);

    partners.forEach((p) => {
      edgeG
        .append("line")
        .attr("x1", CX)
        .attr("y1", CY)
        .attr("x2", p.x)
        .attr("y2", p.y)
        .attr("stroke", "#c9a049")
        .attr("stroke-width", 1.2)
        .attr("stroke-dasharray", "5,4")
        .attr("opacity", 0.5);
    });

    // ---- nodes ----
    // ===== build draw list with ECHO support =====
    // Echo nodes are duplicates / paradox terminators — they don't render as full
    // primary nodes (avoiding orphan edges), but as ghostly red mini-nodes with a
    // curved arrow back to the primary occurrence of that id.
    type DrawableEx = {
      id: string;
      x: number;
      y: number;
      kind: "root" | "anc" | "desc" | "partner";
      isEcho?: boolean;
    };

    const primaryPos: Record<string, { x: number; y: number }> = {
      [rootId]: { x: CX, y: CY },
    };
    const drawn = new Set<string>([rootId]);
    const drawables: DrawableEx[] = [
      { id: rootId, x: CX, y: CY, kind: "root" },
    ];

    const consider = (n: LaidNode, kind: "anc" | "desc") => {
      // root reappearing inside its own up/down tree → echo back to center
      if (n.id === rootId) {
        drawables.push({ id: rootId, x: n.x, y: n.y, kind, isEcho: true });
        return;
      }
      // explicit paradox terminator OR id already drawn elsewhere → echo
      if (n.paradox || drawn.has(n.id)) {
        drawables.push({ id: n.id, x: n.x, y: n.y, kind, isEcho: true });
        return;
      }
      drawn.add(n.id);
      primaryPos[n.id] = { x: n.x, y: n.y };
      drawables.push({ id: n.id, x: n.x, y: n.y, kind });
    };

    up.nodes.filter((n) => n.depth > 0).forEach((n) => consider(n, "anc"));
    down.nodes.filter((n) => n.depth > 0).forEach((n) => consider(n, "desc"));

    partners.forEach((p) => {
      if (!drawn.has(p.id)) {
        drawn.add(p.id);
        drawables.push({ id: p.id, x: p.x, y: p.y, kind: "partner" });
      }
    });

    const nodeG = stage.append("g");
    drawables.forEach((n, idx) => {
      const d = nodeById[n.id];
      if (!d) return;

      // ============ ECHO NODE — paradox loop terminator ============
      if (n.isEcho) {
        const target = primaryPos[n.id];
        // Curved dashed arrow back to primary, drawn under nodes
        if (target && (target.x !== n.x || target.y !== n.y)) {
          const dx = target.x - n.x;
          const dy = target.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const sideways = Math.min(90, dist * 0.35);
          const midX = (n.x + target.x) / 2 + (dy / dist) * sideways;
          const midY = (n.y + target.y) / 2 - (dx / dist) * sideways;
          edgeG
            .append("path")
            .attr(
              "d",
              `M${n.x},${n.y} Q${midX},${midY} ${target.x},${target.y}`,
            )
            .attr("fill", "none")
            .attr("stroke", "#a83a2e")
            .attr("stroke-width", 0.8)
            .attr("stroke-dasharray", "3,3")
            .attr("opacity", 0.55);
        }

        const g = nodeG
          .append("g")
          .attr("class", "cursor-pointer")
          .attr("transform", `translate(${n.x},${n.y})`);
        g.style("opacity", 0)
          .transition()
          .delay(50 + idx * 18)
          .duration(ENTER_MS)
          .ease(d3.easeCubicOut)
          .style("opacity", 0.9);

        // pulsing red halo
        g.append("circle")
          .attr("class", "paradox-ring")
          .attr("r", 14)
          .attr("fill", "none")
          .attr("stroke", "#a83a2e")
          .attr("stroke-width", 1)
          .attr("filter", "url(#glow-paradox)");

        // ghost body
        g.append("circle")
          .attr("r", 9)
          .attr("fill", colOf(d))
          .attr("fill-opacity", 0.22)
          .attr("stroke", "#a83a2e")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "2,2");

        // recursion glyph
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .attr("font-size", "11px")
          .attr("fill", "#a83a2e")
          .attr("font-weight", 600)
          .attr("class", "pointer-events-none")
          .text("↻");

        // first name (small)
        const parts = d.full.split(" ");
        g.append("text")
          .attr(
            "class",
            "font-display uppercase tracking-wider pointer-events-none",
          )
          .attr("text-anchor", "middle")
          .attr("y", 22)
          .attr("font-size", "8.5px")
          .attr("fill", "#a83a2e")
          .text(parts[0]);

        // loop label
        g.append("text")
          .attr("class", "font-mono pointer-events-none paradox-label")
          .attr("text-anchor", "middle")
          .attr("y", 33)
          .attr("font-size", "6.5px")
          .attr("fill", "#7a2e26")
          .attr("letter-spacing", "1.8px")
          .text("↺ ПЕТЛЯ");

        g.on("click", (event) => {
          event.stopPropagation();
          requestMode({ kind: "tree", rootId: n.id });
        });
        g.on("mouseover", (event: MouseEvent) =>
          showTooltip(event, d, undefined, true),
        );
        g.on("mouseout", () => hideTooltip());
        return;
      }

      // ============ PRIMARY NODE ============
      const isRoot = n.kind === "root";
      const isParadox = paradoxIds.has(n.id);
      const r = isRoot ? 22 : 14;

      const g = nodeG
        .append("g")
        .attr("class", isRoot ? "" : "cursor-pointer")
        .attr("transform", `translate(${n.x},${n.y})`);
      g.style("opacity", 0)
        .transition()
        .delay(50 + idx * 18)
        .duration(ENTER_MS)
        .ease(d3.easeCubicOut)
        .style("opacity", 1);

      // PARADOX RING — pulsing red (CSS-animated via class)
      if (isParadox) {
        g.append("circle")
          .attr("class", "paradox-ring")
          .attr("r", r + 14)
          .attr("fill", "none")
          .attr("stroke", "#a83a2e")
          .attr("stroke-width", 1.2)
          .attr("filter", "url(#glow-paradox)");
        g.append("circle")
          .attr("class", "paradox-ring paradox-ring--dash")
          .attr("r", r + 10)
          .attr("fill", "none")
          .attr("stroke", "#7a2e26")
          .attr("stroke-width", 0.8)
          .attr("stroke-dasharray", "2,2");
      }

      if (d.timetravel) {
        g.append("circle")
          .attr("r", r + 8)
          .attr("fill", "none")
          .attr("stroke", "#c9a049")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "2,3")
          .attr("opacity", 0.6);
      }

      if (isRoot) {
        g.append("circle")
          .attr("r", r + 12)
          .attr("fill", "none")
          .attr("stroke", "#c9a049")
          .attr("stroke-width", 0.6)
          .attr("opacity", 0.8);
        g.append("circle")
          .attr("r", r + 6)
          .attr("fill", "none")
          .attr("stroke", "#c9a049")
          .attr("stroke-width", 1.5)
          .attr("filter", "url(#glow-amber)")
          .attr("opacity", 0.9);
      } else {
        g.append("circle")
          .attr("r", r + 3)
          .attr("fill", "none")
          .attr("stroke", colOf(d))
          .attr("stroke-width", 0.4)
          .attr("opacity", 0.4);
      }

      g.append("circle")
        .attr("r", r)
        .attr("fill", colOf(d))
        .attr("fill-opacity", d.dead ? 0.55 : 0.92)
        .attr(
          "stroke",
          isRoot
            ? "#e8c373"
            : isParadox
              ? "#a83a2e"
              : d.dead
                ? "#0a0908"
                : "#c9a049",
        )
        .attr("stroke-width", isRoot ? 2 : isParadox ? 1.8 : d.dead ? 1.5 : 0.8)
        .attr("filter", "url(#shadow)");

      if (d.dead) {
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "0.4em")
          .attr("font-size", isRoot ? "15px" : "11px")
          .attr("fill", "#d8d2c4")
          .attr("opacity", 0.9)
          .text("†");
      }

      const parts = d.full.split(" ");
      const labelY = r + 14;
      const tg = g.append("g");

      tg.append("text")
        .attr(
          "class",
          "font-display uppercase tracking-wider pointer-events-none",
        )
        .attr("text-anchor", "middle")
        .attr("y", labelY)
        .attr("font-size", isRoot ? "12px" : "10px")
        .attr("fill", isRoot ? "#e8c373" : isParadox ? "#a83a2e" : "#a09988")
        .attr("font-weight", isRoot ? 600 : 500)
        .text(parts[0]);

      if (parts[1]) {
        tg.append("text")
          .attr(
            "class",
            "font-display uppercase tracking-wider pointer-events-none",
          )
          .attr("text-anchor", "middle")
          .attr("y", labelY + 12)
          .attr("font-size", isRoot ? "11px" : "9.5px")
          .attr("fill", isRoot ? "#c9a049" : isParadox ? "#7a2e26" : "#6a655a")
          .text(parts.slice(1).join(" "));
      }

      let extraY = parts[1] ? 26 : 14;
      if (d.born || d.died) {
        tg.append("text")
          .attr("class", "font-mono pointer-events-none")
          .attr("text-anchor", "middle")
          .attr("y", labelY + extraY)
          .attr("font-size", isRoot ? "9px" : "8px")
          .attr("fill", "#5a554c")
          .attr("letter-spacing", "1px")
          .text(`${d.born ?? "?"}  —  ${d.died ?? (d.dead ? "?" : "·")}`);
        extraY += 12;
      }
      if (isParadox) {
        tg.append("text")
          .attr("class", "font-mono pointer-events-none paradox-label")
          .attr("text-anchor", "middle")
          .attr("y", labelY + extraY)
          .attr("font-size", "7.5px")
          .attr("fill", "#a83a2e")
          .attr("letter-spacing", "2.5px")
          .text("♾ ПАРАДОКС");
        extraY += 12;
      }
      if (n.kind === "partner") {
        tg.append("text")
          .attr("class", "font-mono pointer-events-none")
          .attr("text-anchor", "middle")
          .attr("y", labelY + extraY)
          .attr("font-size", "7.5px")
          .attr("fill", "#c9a049")
          .attr("letter-spacing", "2px")
          .text("◊ СУПРУГ(А) ◊");
      }

      g.on("click", (event) => {
        event.stopPropagation();
        if (!isRoot) requestMode({ kind: "tree", rootId: n.id });
      });
      g.on("mouseover", (event: MouseEvent) =>
        showTooltip(
          event,
          d,
          n.kind === "partner" ? "partner" : undefined,
          isParadox,
        ),
      );
      g.on("mouseout", () => hideTooltip());
    });

    return () => {
      clearTimeout(transitionDoneTimer);
      if (simRef.current) simRef.current.stop();
    };
  }, [displayMode, requestMode, showTooltip, hideTooltip]);

  // ============== UI ==============
  const currentName =
    displayMode.kind === "tree"
      ? nodeById[displayMode.rootId]?.full
      : `все персонажи · ${NODES.length} человек`;

  return (
    <div className="flex h-screen w-full flex-col bg-[#070707] text-[#d8d2c4] font-mono relative overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-[1000] opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='2.8' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-[999]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 80%, #000 100%)",
        }}
      />

      <header className="relative flex items-end gap-4 border-b border-[#1a1815] bg-gradient-to-b from-[#0d0c0a] to-[#070707] px-6 pb-3 pt-3.5">
        <div className="flex items-baseline gap-3.5">
          <svg
            viewBox="0 0 100 100"
            className="h-[22px] w-[22px] self-center opacity-60"
          >
            <g fill="none" stroke="#c9a049" strokeWidth={1.6}>
              <circle cx={50} cy={35} r={22} />
              <circle cx={32} cy={62} r={22} />
              <circle cx={68} cy={62} r={22} />
            </g>
          </svg>
          <h1 className="font-display text-[34px] font-medium uppercase leading-none tracking-[14px] text-[#d8d2c4]">
            Dark
          </h1>
          <span className="pb-1 font-mono text-[9px] uppercase tracking-[3px] text-[#5a4720]">
            Stammbaum · Винден
          </span>
        </div>
        <div className="ml-auto flex flex-col items-end gap-px font-display italic text-[#8a8378]">
          <span className="text-sm">
            <em className="not-italic text-[#c9a049]">Anfang</em> ist Ende.{" "}
            <em className="not-italic text-[#c9a049]">Ende</em> ist Anfang.
          </span>
          <small className="font-mono text-[8px] uppercase tracking-[2px] text-[#3a3530]">
            Sic Mundus Creatus Est
          </small>
        </div>
        <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5a4720]/60 to-transparent" />
      </header>

      <div className="flex items-center gap-3.5 border-b border-[#1a1815] bg-[#070707] px-6 py-2 text-[10px] uppercase tracking-[1.5px] text-[#8a8378]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#c9a049] shadow-[0_0_8px_#c9a049]" />
        <span>{displayMode.kind === "force" ? "Граф" : "Древо"}</span>
        <span className="text-[#3a3530]">·</span>
        <span className="font-display text-sm font-medium normal-case tracking-[2px] text-[#d8d2c4] transition-opacity duration-300">
          {currentName}
        </span>
        {mode.kind === "tree" && (
          <button
            onClick={() => requestMode({ kind: "force" })}
            className="ml-auto cursor-pointer border border-[#5a4720] bg-transparent px-4 py-1 font-mono text-[9px] uppercase tracking-[2px] text-[#c9a049] transition-all duration-300 hover:border-[#c9a049] hover:bg-[#c9a049] hover:text-[#070707]"
          >
            ← Назад к графу
          </button>
        )}
      </div>

      <div
        ref={wrapRef}
        className="relative flex-1 overflow-hidden bg-[radial-gradient(ellipse_at_center,#141210,#070707_75%)]"
      >
        <div className="pointer-events-none absolute left-3.5 top-3.5 h-9 w-9 border-l border-t border-[#1a1815]" />
        <div className="pointer-events-none absolute right-3.5 top-3.5 h-9 w-9 border-r border-t border-[#1a1815]" />
        <div className="pointer-events-none absolute bottom-3.5 left-3.5 h-9 w-9 border-b border-l border-[#1a1815]" />
        <div className="pointer-events-none absolute bottom-3.5 right-3.5 h-9 w-9 border-b border-r border-[#1a1815]" />

        <svg ref={svgRef} className="block h-full w-full" />

        <div
          ref={tooltipRef}
          className="pointer-events-none absolute z-50 hidden max-w-[260px] border border-[#5a4720] bg-[rgba(10,9,8,0.96)] px-4 py-3 font-mono text-[11px] tracking-[0.5px] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
        />

        {displayMode.kind === "force" && (
          <div className="absolute bottom-5 left-5 flex flex-col gap-1.5 border-l border-[#1a1815] pl-3.5 font-mono text-[9px] uppercase tracking-[1.5px] text-[#3a3530]">
            <Legend color="#8a8378">родитель → потомок</Legend>
            <Legend color="#c9a049" dash>
              супруги
            </Legend>
            <Legend color="#7a2e26">петля времени</Legend>
            <Legend color="#5a4720" dash>
              усыновление
            </Legend>
            <div className="flex items-center gap-2">
              <span className="text-[#7a2e26]">†</span>&nbsp;умер ·{" "}
              <span className="text-[#c9a049]">◷</span>&nbsp;путешественник ·{" "}
              <span className="text-[#a83a2e]">♾</span>&nbsp;парадокс
            </div>
          </div>
        )}

        {hint && displayMode.kind === "force" && (
          <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 font-display text-xs italic tracking-[1.5px] text-[#3a3530] transition-opacity duration-1000">
            Klick auf einen Charakter — sein Stammbaum erscheint
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({
  color,
  dash,
  children,
}: {
  color: string;
  dash?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={24} height={6}>
        <line
          x1={0}
          y1={3}
          x2={24}
          y2={3}
          stroke={color}
          strokeWidth={1.2}
          strokeDasharray={dash ? "4,3" : undefined}
        />
      </svg>
      {children}
    </div>
  );
}
