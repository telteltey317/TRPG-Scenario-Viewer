import type { Npc, Scene } from '../types';
import './SceneDetail.css';

type Props = {
  scene: Scene | undefined;
  npcs: Npc[];
  availableChapters: string[];
  onChange: (scene: Scene) => void;
  onDelete: (id: string) => void;
};

export function SceneDetail({ scene, npcs, availableChapters, onChange, onDelete }: Props) {
  if (!scene) {
    return <div className="scene-detail">シーンが選択されていません。</div>;
  }

  const titleError = scene.title.trim() === '';

  const updateField = <K extends keyof Scene>(key: K, value: Scene[K]) => {
    onChange({ ...scene, [key]: value });
  };

  const updateSkillHint = (
    id: string,
    field: 'name' | 'effect' | 'failureNote',
    value: string,
  ) => {
    updateField(
      'skillHints',
      scene.skillHints.map((h) => (h.id === id ? { ...h, [field]: value } : h)),
    );
  };

  const updateSan = (id: string, field: 'trigger' | 'value' | 'description', value: string) => {
    updateField(
      'sanChecks',
      scene.sanChecks.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const updateBgm = (id: string, field: 'label' | 'localFileName' | 'note', value: string) => {
    updateField(
      'bgms',
      scene.bgms.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    );
  };

  const updateBackground = (id: string, field: 'label' | 'localFileName', value: string) => {
    updateField(
      'backgrounds',
      scene.backgrounds.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    );
  };

  const toggleNpc = (npcId: string) => {
    const exists = scene.npcs.includes(npcId);
    const next = exists ? scene.npcs.filter((id) => id !== npcId) : [...scene.npcs, npcId];
    updateField('npcs', next);
  };

  return (
    <div className="scene-detail">
      <header className="scene-header">
        <div>
          <div className="eyebrow">Scene detail</div>
          <input
            className={titleError ? 'input-error' : ''}
            value={scene.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="タイトル"
          />
          {titleError && <div className="error-text">タイトルは必須です</div>}
          <div className="row gap-sm top-gap">
            <label>
              タイプ
              <select
                value={scene.type}
                onChange={(e) => updateField('type', e.target.value as Scene['type'])}
              >
                <option value="intro">intro</option>
                <option value="investigation">investigation</option>
                <option value="combat">combat</option>
                <option value="climax">climax</option>
                <option value="epilogue">epilogue</option>
                <option value="etc">etc</option>
              </select>
            </label>
            <label>
              章 / チャプター
              <select
                value={scene.chapter ?? ''}
                onChange={(e) => updateField('chapter', e.target.value)}
              >
                <option value="">未分類</option>
                {availableChapters.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              解放条件
              <input
                value={scene.unlockCondition ?? ''}
                onChange={(e) => updateField('unlockCondition', e.target.value)}
              />
            </label>
            <label>
              場所メモ
              <input
                value={scene.locationNameNote ?? ''}
                onChange={(e) => updateField('locationNameNote', e.target.value)}
              />
            </label>
          </div>
        </div>
        <button
          className="danger"
          onClick={() => {
            if (confirm('このシーンを削除しますか？')) onDelete(scene.id);
          }}
        >
          シーン削除
        </button>
      </header>

      <section>
        <h3>描写</h3>
        <textarea
          rows={3}
          value={scene.description ?? ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="KP用描写"
        />
      </section>

      <section>
        <h3>情報</h3>
        <textarea
          rows={3}
          value={scene.info ?? ''}
          onChange={(e) => updateField('info', e.target.value)}
          placeholder="このシーンで確定提示する情報"
        />
      </section>

      <section>
        <div className="section-header">
          <h3>使える技能</h3>
          <button
            onClick={() =>
              updateField('skillHints', [
                ...scene.skillHints,
                { id: `hint-${Date.now()}`, name: '目星', effect: '', failureNote: '' },
              ])
            }
          >
            + 追加
          </button>
        </div>
        {scene.skillHints.length === 0 && <div className="muted">まだありません</div>}
        {scene.skillHints.map((hint) => (
          <div key={hint.id} className="grid triple">
            <input
              value={hint.name}
              onChange={(e) => updateSkillHint(hint.id, 'name', e.target.value)}
              placeholder="技能名"
            />
            <input
              value={hint.effect ?? ''}
              onChange={(e) => updateSkillHint(hint.id, 'effect', e.target.value)}
              placeholder="成功時の効果"
            />
            <div className="row gap-sm">
              <input
                value={hint.failureNote ?? ''}
                onChange={(e) => updateSkillHint(hint.id, 'failureNote', e.target.value)}
                placeholder="失敗メモ"
              />
              <button className="ghost" onClick={() => updateField('skillHints', scene.skillHints.filter((h) => h.id !== hint.id))}>
                削除
              </button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="section-header">
          <h3>SANチェック</h3>
          <button
            onClick={() =>
              updateField('sanChecks', [
                ...scene.sanChecks,
                { id: `san-${Date.now()}`, trigger: '', value: '', description: '' },
              ])
            }
          >
            + 追加
          </button>
        </div>
        {scene.sanChecks.length === 0 && <div className="muted">まだありません</div>}
        {scene.sanChecks.map((san) => (
          <div key={san.id} className="grid triple">
            <input
              value={san.trigger}
              onChange={(e) => updateSan(san.id, 'trigger', e.target.value)}
              placeholder="トリガー"
            />
            <input
              value={san.value}
              onChange={(e) => updateSan(san.id, 'value', e.target.value)}
              placeholder="0/1D3 等"
            />
            <div className="row gap-sm">
              <input
                value={san.description ?? ''}
                onChange={(e) => updateSan(san.id, 'description', e.target.value)}
                placeholder="描写メモ"
              />
              <button className="ghost" onClick={() => updateField('sanChecks', scene.sanChecks.filter((s) => s.id !== san.id))}>
                削除
              </button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="section-header">
          <h3>BGM</h3>
          <button
            onClick={() =>
              updateField('bgms', [
                ...scene.bgms,
                { id: `bgm-${Date.now()}`, label: 'BGM', localFileName: '', note: '' },
              ])
            }
          >
            + 追加
          </button>
        </div>
        {scene.bgms.length === 0 && <div className="muted">まだありません</div>}
        {scene.bgms.map((bgm) => (
          <div key={bgm.id} className="grid triple">
            <input
              value={bgm.label}
              onChange={(e) => updateBgm(bgm.id, 'label', e.target.value)}
              placeholder="ラベル"
            />
            <input
              value={bgm.localFileName}
              onChange={(e) => updateBgm(bgm.id, 'localFileName', e.target.value)}
              placeholder="ファイル名"
            />
            <div className="row gap-sm">
              <input
                value={bgm.note ?? ''}
                onChange={(e) => updateBgm(bgm.id, 'note', e.target.value)}
                placeholder="備考"
              />
              <button className="ghost" onClick={() => updateField('bgms', scene.bgms.filter((b) => b.id !== bgm.id))}>
                削除
              </button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="section-header">
          <h3>背景</h3>
          <button
            onClick={() =>
              updateField('backgrounds', [
                ...scene.backgrounds,
                { id: `bg-${Date.now()}`, label: '背景', localFileName: '' },
              ])
            }
          >
            + 追加
          </button>
        </div>
        {scene.backgrounds.length === 0 && <div className="muted">まだありません</div>}
        {scene.backgrounds.map((bg) => (
          <div key={bg.id} className="grid triple">
            <input
              value={bg.label}
              onChange={(e) => updateBackground(bg.id, 'label', e.target.value)}
              placeholder="ラベル"
            />
            <input
              value={bg.localFileName}
              onChange={(e) => updateBackground(bg.id, 'localFileName', e.target.value)}
              placeholder="ファイル名"
            />
            <div className="row gap-sm">
              <span className="muted" />
              <button className="ghost" onClick={() => updateField('backgrounds', scene.backgrounds.filter((b) => b.id !== bg.id))}>
                削除
              </button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h3>登場NPC</h3>
        <div className="chips">
          {npcs.map((npc) => (
            <label key={npc.id} className="chip-toggle">
              <input
                type="checkbox"
                checked={scene.npcs.includes(npc.id)}
                onChange={() => toggleNpc(npc.id)}
              />
              <span>{npc.name}</span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3>メモ</h3>
        <textarea
          rows={3}
          value={scene.notes ?? ''}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="その他メモ"
        />
      </section>
    </div>
  );
}
