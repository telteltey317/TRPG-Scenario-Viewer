import { useState } from 'react';
import type { Npc } from '../types';
import { buildCocofoliaText } from '../lib/cocofolia';
import './CocofoliaExportPanel.css';

type Props = {
  npc: Npc | undefined;
};

export function CocofoliaExportPanel({ npc }: Props) {
  const [secret, setSecret] = useState(false);
  const [includeSan, setIncludeSan] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  if (!npc) {
    return <div className="coco-panel muted">NPCを選択するとココフォリア出力できます。</div>;
  }

  const handleCopy = async () => {
    try {
      const text = buildCocofoliaText(npc, { secret, includeSanCommands: includeSan });
      await navigator.clipboard.writeText(text);
      setStatus('クリップボードにコピーしました');
    } catch (error) {
      console.error(error);
      setStatus('コピーに失敗しました。ブラウザの権限を確認してください');
    }
  };

  return (
    <div className="coco-panel">
      <div className="coco-panel__header">
        <div>
          <h3>ココフォリア出力</h3>
          <div className="muted">クリップボードAPI形式 (1NPC)</div>
        </div>
        <button onClick={handleCopy}>コピー</button>
      </div>

      <div className="coco-options">
        <label>
          <input
            type="checkbox"
            checked={includeSan}
            onChange={(e) => setIncludeSan(e.target.checked)}
          />
          SANチェックコマンドを含める
        </label>
        <label>
          <input
            type="checkbox"
            checked={secret}
            onChange={(e) => setSecret(e.target.checked)}
          />
          すべて秘匿(S)で出力
        </label>
      </div>

      {status && <div className="status-text">{status}</div>}
    </div>
  );
}
