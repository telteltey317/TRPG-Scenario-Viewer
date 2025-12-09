import { useMemo, useRef, useState } from 'react';
import type { FlowEdge, FlowNodeLayout, Scene } from '../types';
import './FlowGraph.css';

type Props = {
  scenes: Scene[];
  edges: FlowEdge[];
  layout: FlowNodeLayout[];
  chapters?: string[];
  onSelectScene?: (id: string) => void;
  onAutoLayout?: (layout: FlowNodeLayout[]) => void;
  onLayoutChange?: (layout: FlowNodeLayout[]) => void;
};

const NODE_W = 140;
const NODE_H = 60;
const GAP = 60;

function autoLayoutByDependency(scenes: Scene[], edges: FlowEdge[]): FlowNodeLayout[] {
  // 左→右へ進む依存ベースレイアウト。レベルをX軸、レベル内順序をY軸。
  const spacingX = 280;
  const baseSpacingY = NODE_H + 70; // ラベルを考慮した最低すきま

  const indeg = new Map<string, number>();
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  scenes.forEach((s) => {
    indeg.set(s.id, 0);
    parents.set(s.id, []);
    children.set(s.id, []);
  });

  edges.forEach((e) => {
    if (!indeg.has(e.from)) indeg.set(e.from, 0);
    if (!indeg.has(e.to)) indeg.set(e.to, 0);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
    parents.get(e.to)?.push(e.from);
    children.get(e.from)?.push(e.to);
  });

  // レベル計算（幅優先）。サイクルがあっても初期ノードは先頭に。
  const queue: string[] = [];
  indeg.forEach((d, id) => { if (d === 0) queue.push(id); });
  if (queue.length === 0 && scenes[0]) queue.push(scenes[0].id);

  const level = new Map<string, number>();
  queue.forEach((id) => level.set(id, 0));
  while (queue.length) {
    const id = queue.shift()!;
    const lv = level.get(id) ?? 0;
    (children.get(id) ?? []).forEach((c) => {
      if ((level.get(c) ?? -1) < lv + 1) level.set(c, lv + 1);
      indeg.set(c, (indeg.get(c) ?? 1) - 1);
      if ((indeg.get(c) ?? 0) <= 0) queue.push(c);
    });
  }
  scenes.forEach((s) => { if (!level.has(s.id)) level.set(s.id, 0); });

  const levels: Record<number, Scene[]> = {};
  scenes.forEach((s) => {
    const lv = level.get(s.id) ?? 0;
    if (!levels[lv]) levels[lv] = [];
    levels[lv].push(s);
  });

  // 並び順改善: 親のy平均でソート（下り）→子のy平均でソート（上り）
  const order: Record<string, number> = {};
  Object.entries(levels).forEach(([lvStr, list]) => {
    list.forEach((scene, idx) => { order[scene.id] = idx * baseSpacingY; });
  });

  // 親ベースの並べ替え
  Object.keys(levels).map(Number).sort((a, b) => a - b).forEach((lv) => {
    const list = levels[lv];
    if (!list) return;
    list.sort((a, b) => {
      const ap = parents.get(a.id) ?? [];
      const bp = parents.get(b.id) ?? [];
      const ay = ap.length ? ap.reduce((s, p) => s + (order[p] ?? 0), 0) / ap.length : order[a.id] ?? 0;
      const by = bp.length ? bp.reduce((s, p) => s + (order[p] ?? 0), 0) / bp.length : order[b.id] ?? 0;
      return ay - by;
    });
    list.forEach((scene, idx) => { order[scene.id] = idx * baseSpacingY; });
  });

  // 子ベースの並べ替え（上り）
  Object.keys(levels).map(Number).sort((a, b) => b - a).forEach((lv) => {
    const list = levels[lv];
    if (!list) return;
    list.sort((a, b) => {
      const ac = children.get(a.id) ?? [];
      const bc = children.get(b.id) ?? [];
      const ay = ac.length ? ac.reduce((s, c) => s + (order[c] ?? 0), 0) / ac.length : order[a.id] ?? 0;
      const by = bc.length ? bc.reduce((s, c) => s + (order[c] ?? 0), 0) / bc.length : order[b.id] ?? 0;
      return ay - by;
    });
    list.forEach((scene, idx) => { order[scene.id] = idx * baseSpacingY; });
  });

  // 衝突解消：各レベル内でy重なりを押し広げる
  const resolveLevelCollisions = () => {
    Object.entries(levels).forEach(([lvStr, list]) => {
      const lv = Number(lvStr);
      if (!list || list.length === 0) return;
      // y順にソート
      list.sort((a, b) => (order[a.id] ?? 0) - (order[b.id] ?? 0));
      const minGap = baseSpacingY;
      let cursor = 0;
      list.forEach((scene, idx) => {
        if (idx === 0) {
          cursor = order[scene.id] ?? 0;
          order[scene.id] = cursor;
          return;
        }
        const target = Math.max(order[scene.id] ?? 0, cursor + minGap);
        order[scene.id] = target;
        cursor = target;
      });
      // 中央寄せ（平均を0付近に戻す）
      const avg = list.reduce((s, sc) => s + (order[sc.id] ?? 0), 0) / list.length;
      list.forEach((sc) => { order[sc.id] = (order[sc.id] ?? 0) - avg; });
      // 再度間隔確保
      let cur2 = 0;
      list.sort((a, b) => (order[a.id] ?? 0) - (order[b.id] ?? 0));
      list.forEach((sc, idx) => {
        if (idx === 0) { cur2 = order[sc.id] ?? 0; return; }
        const target = Math.max(order[sc.id] ?? 0, cur2 + minGap);
        order[sc.id] = target;
        cur2 = target;
      });
    });
  };

  resolveLevelCollisions();

  const layouts: FlowNodeLayout[] = [];
  const maxLevel = Math.max(...Object.keys(levels).map(Number), 0);
  for (let lv = 0; lv <= maxLevel; lv++) {
    (levels[lv] ?? []).forEach((scene) => {
      layouts.push({ sceneId: scene.id, x: lv * spacingX, y: order[scene.id] ?? 0 });
    });
  }
  return layouts;
}

function computeLayout(scenes: Scene[], layout: FlowNodeLayout[]) {
  const map = new Map<string, FlowNodeLayout>();
  layout.forEach((l) => map.set(l.sceneId, l));
  // generate fallback positions
  const fallback: FlowNodeLayout[] = [];
  let x = 0;
  let y = 0;
  const perRow = 4;
  scenes.forEach((scene, idx) => {
    if (!map.has(scene.id)) {
      fallback.push({ sceneId: scene.id, x, y });
      x += NODE_W + GAP;
      if ((idx + 1) % perRow === 0) {
        x = 0;
        y += NODE_H + GAP;
      }
    }
  });
  fallback.forEach((f) => map.set(f.sceneId, f));
  return map;
}

export function FlowGraph({ scenes, edges, layout, chapters, onSelectScene, onAutoLayout, onLayoutChange }: Props) {
  const layoutMap = useMemo(() => computeLayout(scenes, layout), [scenes, layout]);
  const chapterColors = useMemo(() => {
    const palette = ['#4c6fff', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];
    const map = new Map<string, string>();
    (chapters ?? []).forEach((c, idx) => {
      map.set(c, palette[idx % palette.length]);
    });
    return map;
  }, [chapters]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [view, setView] = useState({ x: 10, y: 10, scale: 1 });
  const panState = useRef<{ active: boolean; startX: number; startY: number }>({ active: false, startX: 0, startY: 0 });

  const maxX = Math.max(...Array.from(layoutMap.values()).map((l) => l.x + NODE_W), NODE_W) + GAP;
  const maxY = Math.max(...Array.from(layoutMap.values()).map((l) => l.y + NODE_H), NODE_H) + GAP;

  const typeColor: Record<FlowEdge['type'], string> = {
    normal: '#4c6fff',
    optional: '#2f9e44',
    badEnd: '#d9480f',
  };

  const startDrag = (sceneId: string, e: React.MouseEvent<SVGGElement, MouseEvent>) => {
    const pos = layoutMap.get(sceneId);
    if (!pos) return;
    const svg = e.currentTarget.ownerSVGElement as SVGSVGElement | null;
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const local = pt.matrixTransform(ctm.inverse());
    dragOffset.current = { x: local.x - pos.x, y: local.y - pos.y };
    setDraggingId(sceneId);
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (panState.current.active) {
      const dx = e.clientX - panState.current.startX;
      const dy = e.clientY - panState.current.startY;
      panState.current.startX = e.clientX;
      panState.current.startY = e.clientY;
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      return;
    }
    if (!draggingId || !onLayoutChange) return;
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const local = pt.matrixTransform(ctm.inverse());
    const nextX = (local.x - dragOffset.current.x) / view.scale;
    const nextY = (local.y - dragOffset.current.y) / view.scale;
    const nextLayout = Array.from(layoutMap.values()).map((l) =>
      l.sceneId === draggingId ? { ...l, x: nextX, y: nextY } : l,
    );
    onLayoutChange(nextLayout);
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    panState.current.active = false;
  };

  const startPan = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (e.target !== e.currentTarget) return;
    panState.current = { active: true, startX: e.clientX, startY: e.clientY };
  };

  return (
    <div className="flow-graph">
      <div className="flow-graph__header">
        <div>
          <h3>フロー簡易グラフ</h3>
          <span className="muted">ノードドラッグで座標更新／未設定は自動配置</span>
        </div>
        <div className="row gap-sm">
          {draggingId && <span className="muted">ドラッグ中: {draggingId}</span>}
          {onAutoLayout && (
            <button
              onClick={() => onAutoLayout(autoLayoutByDependency(scenes, edges))}
              title="依存関係ベースで整列"
            >
              オートレイアウト
            </button>
          )}
          <div className="view-controls">
            <button onClick={() => setView((v) => ({ ...v, scale: Math.min(2, v.scale + 0.1) }))}>＋</button>
            <button onClick={() => setView((v) => ({ ...v, scale: Math.max(0.6, v.scale - 0.1) }))}>－</button>
            <button onClick={() => setView({ x: 10, y: 10, scale: 1 })}>リセット</button>
          </div>
        </div>
      </div>
      <svg
        width="100%"
        height="420"
        viewBox={`0 0 ${maxX + 60} ${Math.max(maxY, 360) + 60}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseDown={startPan}
        >
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 z" fill="#555" />
          </marker>
        </defs>

        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
        {edges.map((edge) => {
          const from = layoutMap.get(edge.from);
          const to = layoutMap.get(edge.to);
          if (!from || !to) return null;
          const x1 = from.x + NODE_W / 2;
          const y1 = from.y + NODE_H / 2;
          const x2 = to.x + NODE_W / 2;
          const y2 = to.y + NODE_H / 2;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const len = Math.hypot(x2 - x1, y2 - y1) || 1;
          const nx = -(y2 - y1) / len; // 法線ベクトル（左側）
          const ny = (x2 - x1) / len;

          // ノード矩形との重なりを避けるため、複数オフセット候補から最初に非衝突のものを選ぶ
          const labelW = 160;
          const labelH = 44;
          const offsets = [16, -16, 28, -28, 40, -40, 56, -56];
          const nodes = scenes.map((s) => layoutMap.get(s.id)).filter(Boolean) as FlowNodeLayout[];

          const hitsNode = (lx: number, ly: number) => {
            const box = { x: lx - labelW / 2, y: ly - labelH / 2, w: labelW, h: labelH };
            return nodes.some((n) => {
              const rx = n.x;
              const ry = n.y;
              const rw = NODE_W;
              const rh = NODE_H;
              return box.x < rx + rw && box.x + box.w > rx && box.y < ry + rh && box.y + box.h > ry;
            });
          };

          let labelX = midX;
          let labelY = midY;
          for (const off of offsets) {
            const lx = midX + nx * off;
            const ly = midY + ny * off;
            if (!hitsNode(lx, ly)) {
              labelX = lx;
              labelY = ly;
              break;
            }
          }

          return (
            <g key={edge.id}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={typeColor[edge.type]}
                strokeWidth={2}
                markerEnd="url(#arrow)"
                opacity={0.9}
                className="edge-line"
              />
              {(edge.condition || edge.note) && (
                <foreignObject
                  x={labelX - 80}
                  y={labelY - 20}
                  width="160"
                  height="44"
                  className="edge-label"
                >
                  <div className="edge-text-block">{edge.condition || edge.note}</div>
                </foreignObject>
              )}
            </g>
          );
        })}

        {scenes.map((scene) => {
          const pos = layoutMap.get(scene.id);
          if (!pos) return null;
          const chapterColor = scene.chapter && chapterColors.get(scene.chapter);
          return (
            <g
              key={scene.id}
              transform={`translate(${pos.x},${pos.y})`}
              className="node"
              onClick={() => onSelectScene?.(scene.id)}
              onMouseDown={(e) => startDrag(scene.id, e)}
            >
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={10}
                ry={10}
                fill="#fff"
                stroke={chapterColor ?? '#c7d0ff'}
                strokeWidth={1.6}
              />
              {scene.chapter && (
                <text x={NODE_W / 2} y={16} className="node-chapter" fill={chapterColor ?? '#4b5563'}>
                  {scene.chapter}
                </text>
              )}
              <text x={NODE_W / 2} y={scene.chapter ? 30 : 24} className="node-title">{scene.title}</text>
              <text x={NODE_W / 2} y={scene.chapter ? 48 : 44} className={`node-type node-${scene.type}`}>{scene.type}</text>
            </g>
          );
        })}
        </g>
      </svg>
    </div>
  );
}
