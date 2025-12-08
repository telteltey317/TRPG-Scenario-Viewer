import type { ScenarioMeta } from '../types';
import './ScenarioMetaEditor.css';

type Props = {
  meta: ScenarioMeta;
  onChange: (meta: ScenarioMeta) => void;
};

export function ScenarioMetaEditor({ meta, onChange }: Props) {
  const update = <K extends keyof ScenarioMeta>(key: K, value: ScenarioMeta[K]) => {
    onChange({ ...meta, [key]: value });
  };

  return (
    <div className="meta-editor">
      <h2>シナリオ情報</h2>
      <div className="meta-grid">
        <label>
          タイトル
          <input
            value={meta.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="シナリオ名"
          />
        </label>
        <label>
          作者
          <input
            value={meta.author ?? ''}
            onChange={(e) => update('author', e.target.value)}
            placeholder="作者名"
          />
        </label>
        <label>
          想定プレイ時間(hrs)
          <input
            type="number"
            value={meta.estimatedHours ?? ''}
            onChange={(e) =>
              update('estimatedHours', e.target.value === '' ? undefined : Number(e.target.value))
            }
            placeholder="例: 4"
          />
        </label>
        <label>
          推奨PL人数
          <input
            value={meta.playerCountHint ?? ''}
            onChange={(e) => update('playerCountHint', e.target.value)}
            placeholder="例: 2-4"
          />
        </label>
      </div>
      <label className="meta-notes">
        備考 / 概要
        <textarea
          rows={6}
          value={meta.notes ?? ''}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="シナリオ概要、注意点など"
        />
      </label>
    </div>
  );
}
