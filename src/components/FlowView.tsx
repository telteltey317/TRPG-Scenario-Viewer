import { useMemo, useState } from 'react';
import type { FlowEdge, FlowEdgeType, FlowNodeLayout, Scene } from '../types';
import { FlowGraph } from './FlowGraph';
import './FlowView.css';

type Props = {
  scenes: Scene[];
  edges: FlowEdge[];
  layout: FlowNodeLayout[];
  onAddEdge: (edge: Omit<FlowEdge, 'id'>) => void;
  onUpdateEdge: (edge: FlowEdge) => void;
  onDeleteEdge: (id: string) => void;
  onAutoLayout: (layout: FlowNodeLayout[]) => void;
  onSelectScene?: (id: string) => void;
};

export function FlowView({ scenes, edges, layout, onAddEdge, onUpdateEdge, onDeleteEdge, onAutoLayout, onSelectScene }: Props) {
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [type, setType] = useState<FlowEdgeType>('normal');
  const [condition, setCondition] = useState('');
  const [note, setNote] = useState('');
  const [warning, setWarning] = useState<string | null>(null);

  const sceneMap = useMemo(() => new Map(scenes.map((s) => [s.id, s])), [scenes]);

  const handleAdd = () => {
    if (!from || !to || from === to) return;
    const dup = edges.some((e) => e.from === from && e.to === to && e.type === type);
    if (dup) {
      setWarning('同じ経路が既にあります');
      return;
    }
    onAddEdge({ from, to, type, condition: condition || undefined, note: note || undefined });
    setCondition('');
    setNote('');
    setWarning(null);
  };

  return (
    <div className="flow-view">
      <FlowGraph
        scenes={scenes}
        edges={edges}
        layout={layout}
        onSelectScene={onSelectScene}
        onLayoutChange={onAutoLayout}
        onAutoLayout={() => {
          const perRow = 4;
          const spacingX = 200;
          const spacingY = 140;
          const next: FlowNodeLayout[] = scenes.map((scene, idx) => {
            const row = Math.floor(idx / perRow);
            const col = idx % perRow;
            return { sceneId: scene.id, x: col * spacingX, y: row * spacingY };
          });
          onAutoLayout(next);
        }}
      />

      <div className="flow-controls">
        <div className="row gap-sm">
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="">from</option>
            {scenes.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <span>→</span>
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">to</option>
            {scenes.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value as FlowEdgeType)}>
            <option value="normal">normal</option>
            <option value="optional">optional</option>
            <option value="badEnd">badEnd</option>
          </select>
          <input
            placeholder="条件"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          />
          <input
            placeholder="メモ"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button onClick={handleAdd} disabled={!from || !to || from === to}>エッジ追加</button>
        </div>
        {warning && <div className="warn-text">{warning}</div>}
      </div>

      <div className="flow-list">
        <table>
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Type</th>
              <th>Condition / Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {edges.map((edge) => (
              <tr key={edge.id}>
                <td className="link" onClick={() => onSelectScene?.(edge.from)}>{sceneMap.get(edge.from)?.title ?? edge.from}</td>
                <td className="link" onClick={() => onSelectScene?.(edge.to)}>{sceneMap.get(edge.to)?.title ?? edge.to}</td>
                <td>
                  <select
                    value={edge.type}
                    onChange={(e) => onUpdateEdge({ ...edge, type: e.target.value as FlowEdgeType })}
                  >
                    <option value="normal">normal</option>
                    <option value="optional">optional</option>
                    <option value="badEnd">badEnd</option>
                  </select>
                </td>
                <td>
                  <div className="stack">
                    <input
                      placeholder="条件"
                      value={edge.condition ?? ''}
                      onChange={(e) => onUpdateEdge({ ...edge, condition: e.target.value })}
                    />
                    <input
                      placeholder="メモ"
                      value={edge.note ?? ''}
                      onChange={(e) => onUpdateEdge({ ...edge, note: e.target.value })}
                    />
                  </div>
                </td>
                <td>
                  <button className="ghost" onClick={() => onDeleteEdge(edge.id)}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
