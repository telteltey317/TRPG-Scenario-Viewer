import { useMemo, useRef, useState } from 'react';
import type { FlowEdge, FlowNodeLayout, Scene } from '../types';
import './FlowGraph.css';

type Props = {
  scenes: Scene[];
  edges: FlowEdge[];
  layout: FlowNodeLayout[];
  onSelectScene?: (id: string) => void;
  onAutoLayout?: () => void;
  onLayoutChange?: (layout: FlowNodeLayout[]) => void;
};

const NODE_W = 140;
const NODE_H = 60;
const GAP = 60;

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

export function FlowGraph({ scenes, edges, layout, onSelectScene, onAutoLayout, onLayoutChange }: Props) {
  const layoutMap = useMemo(() => computeLayout(scenes, layout), [scenes, layout]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
    if (!draggingId || !onLayoutChange) return;
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const local = pt.matrixTransform(ctm.inverse());
    const nextX = local.x - dragOffset.current.x;
    const nextY = local.y - dragOffset.current.y;
    const nextLayout = Array.from(layoutMap.values()).map((l) =>
      l.sceneId === draggingId ? { ...l, x: nextX, y: nextY } : l,
    );
    onLayoutChange(nextLayout);
  };

  const handleMouseUp = () => {
    setDraggingId(null);
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
          {onAutoLayout && <button onClick={onAutoLayout}>オートレイアウト</button>}
        </div>
      </div>
      <svg
        width="100%"
        height="500"
        viewBox={`0 0 ${maxX} ${Math.max(maxY, 400)}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 z" fill="#555" />
          </marker>
        </defs>

        {edges.map((edge) => {
          const from = layoutMap.get(edge.from);
          const to = layoutMap.get(edge.to);
          if (!from || !to) return null;
          const x1 = from.x + NODE_W / 2;
          const y1 = from.y + NODE_H / 2;
          const x2 = to.x + NODE_W / 2;
          const y2 = to.y + NODE_H / 2;
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
              />
              {(edge.condition || edge.note) && (
                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} className="edge-text">
                  {edge.condition || edge.note}
                </text>
              )}
            </g>
          );
        })}

        {scenes.map((scene) => {
          const pos = layoutMap.get(scene.id);
          if (!pos) return null;
          return (
            <g
              key={scene.id}
              transform={`translate(${pos.x},${pos.y})`}
              className="node"
              onClick={() => onSelectScene?.(scene.id)}
              onMouseDown={(e) => startDrag(scene.id, e)}
            >
              <rect width={NODE_W} height={NODE_H} rx={10} ry={10} fill="#fff" stroke="#c7d0ff" strokeWidth={1.5} />
              <text x={NODE_W / 2} y={24} className="node-title">{scene.title}</text>
              <text x={NODE_W / 2} y={44} className={`node-type node-${scene.type}`}>{scene.type}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
