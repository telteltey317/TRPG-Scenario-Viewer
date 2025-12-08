import { useMemo, useState } from 'react';
import type { Npc, Scene, SkillTemplate } from '../types';
import { calcDamageBonus, mergeDamageWithDb } from '../lib/combat';
import { CocofoliaExportPanel } from './CocofoliaExportPanel';
import './NpcDetail.css';

type Props = {
  npc: Npc | undefined;
  scenes: Scene[];
  skillTemplates: SkillTemplate[];
  onChange: (npc: Npc) => void;
};

const statKeys: (keyof NonNullable<Npc['stats']>)[] = [
  'STR', 'CON', 'POW', 'DEX', 'APP', 'SIZ', 'INT', 'EDU', 'HP', 'MP', 'SAN',
];

const derivedTemplateConfig: Record<string, { stat: keyof NonNullable<Npc['stats']>; mult: number }> = {
  dodge: { stat: 'DEX', mult: 2 },
  nativeLang: { stat: 'EDU', mult: 5 },
  luck: { stat: 'POW', mult: 5 },
};

export function NpcDetail({ npc, scenes, skillTemplates, onChange }: Props) {
  if (!npc) {
    return <div className="npc-detail">NPCが選択されていません。</div>;
  }

  const nameError = npc.name.trim() === '';

  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [customCalcName, setCustomCalcName] = useState('新しい技能');
  const [customCalcStat, setCustomCalcStat] = useState<string>('DEX');
  const [customCalcMult, setCustomCalcMult] = useState(5);

  const updateField = <K extends keyof Npc>(key: K, value: Npc[K]) => {
    onChange({ ...npc, [key]: value });
  };

  const getStatValue = (statName: string | undefined, stats: Npc['stats'] | undefined, extraStats: Npc['extraStats'] | undefined): number | undefined => {
    if (!statName) return undefined;
    const base = stats?.[statName as keyof Npc['stats']];
    if (base != null) return base;
    const extra = extraStats?.find((s) => s.name === statName);
    return extra?.value;
  };

  const applyCalcToSkills = (
    skills: Npc['skills'],
    stats: NonNullable<Npc['stats']> | undefined,
    extraStats: Npc['extraStats'] | undefined,
  ): Npc['skills'] =>
    skills.map((s) => {
      if (s.calcStat && s.calcMultiplier != null) {
        const base = getStatValue(s.calcStat, stats, extraStats);
        const nextVal = base != null ? base * s.calcMultiplier : undefined;
        return nextVal === s.value ? s : { ...s, value: nextVal };
      }
      return s;
    });

  const updateStat = (key: keyof NonNullable<Npc['stats']>, value: number | undefined) => {
    const nextStats = { ...(npc.stats ?? {}) };
    if (value == null || Number.isNaN(value)) {
      delete nextStats[key];
    } else {
      nextStats[key] = value;
    }
    const nextSkills = applyCalcToSkills(npc.skills, nextStats, npc.extraStats);
    onChange({ ...npc, stats: nextStats, skills: nextSkills });
  };

  const computeValueFromStats = (tplId: string): number | undefined => {
    const stats = npc.stats ?? {};
    const tpl = skillTemplates.find((t) => t.id === tplId);
    const stat = tpl?.calcStat ?? derivedTemplateConfig[tplId]?.stat;
    const mult = tpl?.calcMultiplier ?? derivedTemplateConfig[tplId]?.mult;
    if (stat && mult != null) {
      const base = getStatValue(stat, stats, npc.extraStats);
      return base != null ? base * mult : undefined;
    }
    return undefined;
  };

  const updateSkill = (id: string, field: 'name' | 'value' | 'note' | 'damage', value: string) => {
    const nextSkills = npc.skills.map((s) =>
      s.id === id
        ? {
            ...s,
            [field]:
              field === 'value'
                ? value === ''
                  ? undefined
                  : Number(value)
                : value,
          }
        : s,
    );
    updateField('skills', nextSkills);
  };

  const removeSkill = (id: string) => {
    updateField('skills', npc.skills.filter((s) => s.id !== id));
  };

  const addSkillFromTemplate = (templateId: string) => {
    if (!templateId) return;
    const template = skillTemplates.find((t) => t.id === templateId);
    if (!template) return;
    const conf = {
      stat: template.calcStat ?? derivedTemplateConfig[template.id]?.stat,
      mult: template.calcMultiplier ?? derivedTemplateConfig[template.id]?.mult,
    };
    const newSkill = {
      id: `skill-${Date.now()}`,
      name: template.name,
      value: computeValueFromStats(template.id) ?? template.defaultValue,
      templateId: template.id,
      category: template.category ?? 'general',
      damage: template.damage,
      calcStat: conf.stat,
      calcMultiplier: conf.mult,
    };
    updateField('skills', [...npc.skills, newSkill]);
  };

  const addEmptySkill = (category: 'general' | 'combat' = 'general') => {
    const newSkill = { id: `skill-${Date.now()}`, name: '新しい技能', value: undefined, category };
    updateField('skills', [...npc.skills, newSkill]);
  };

  const addSkillsFromTemplates = (ids: string[]) => {
    const existingTemplateIds = new Set(npc.skills.map((s) => s.templateId).filter(Boolean));
    const timestamp = Date.now();
    const newSkills = ids
      .map((id, idx) => {
        const tpl = skillTemplates.find((t) => t.id === id);
        if (!tpl || existingTemplateIds.has(tpl.id)) return null;
        const conf = {
          stat: tpl.calcStat ?? derivedTemplateConfig[tpl.id]?.stat,
          mult: tpl.calcMultiplier ?? derivedTemplateConfig[tpl.id]?.mult,
        };
        return {
          id: `skill-${timestamp}-${idx}`,
          name: tpl.name,
          value: computeValueFromStats(tpl.id) ?? tpl.defaultValue,
          templateId: tpl.id,
          category: tpl.category ?? 'general',
          damage: tpl.damage,
          calcStat: conf.stat,
          calcMultiplier: conf.mult,
        };
      })
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    if (newSkills.length > 0) {
      updateField('skills', [...npc.skills, ...newSkills]);
    }
  };

  const updateQa = (id: string, field: 'question' | 'answer', value: string) => {
    const next = npc.qa.map((q) => (q.id === id ? { ...q, [field]: value } : q));
    updateField('qa', next);
  };

  const addQa = () => {
    updateField('qa', [...npc.qa, { id: `qa-${Date.now()}`, question: '', answer: '' }]);
  };

  const removeQa = (id: string) => {
    updateField('qa', npc.qa.filter((q) => q.id !== id));
  };

  const toggleAppearScene = (sceneId: string) => {
    const exists = npc.appearScenes.includes(sceneId);
    const next = exists
      ? npc.appearScenes.filter((s) => s !== sceneId)
      : [...npc.appearScenes, sceneId];
    updateField('appearScenes', next);
  };

  const filteredTemplates = useMemo(
    () =>
      skillTemplates.filter((tpl) =>
        tpl.name.toLowerCase().includes(templateSearch.toLowerCase().trim()),
      ),
    [skillTemplates, templateSearch],
  );

  const addCustomCalculatedSkill = () => {
    const stats = npc.stats ?? {};
    const base = getStatValue(customCalcStat, stats, npc.extraStats);
    const value = base != null ? base * customCalcMult : undefined;
    const newSkill = {
      id: `skill-${Date.now()}`,
      name: customCalcName || '新しい技能',
      value,
      calcStat: customCalcStat,
      calcMultiplier: customCalcMult,
      category: 'general' as const,
    };
    updateField('skills', [...npc.skills, newSkill]);
  };

  const damageBonus = calcDamageBonus(npc.stats);

  const hitPoints = (() => {
    const stats = npc.stats ?? {};
    if (stats.CON == null || stats.SIZ == null) return undefined;
    return Math.ceil((stats.CON + stats.SIZ) / 2);
  })();

  const magicPoints = (() => {
    const stats = npc.stats ?? {};
    if (stats.POW == null) return undefined;
    return stats.POW;
  })();

  return (
    <div className="npc-detail">
      <header>
        <div>
          <div className="eyebrow">NPC detail</div>
          <h2>
            <input
              value={npc.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="名前"
              className={nameError ? 'input-error' : ''}
            />
            {nameError && <div className="error-text">名前は必須です</div>}
          </h2>
        </div>
        <div className="row gap-sm">
          <label>
            ルビ
            <input
              value={npc.ruby ?? ''}
              onChange={(e) => updateField('ruby', e.target.value)}
              placeholder="ふりがな"
            />
          </label>
          <label>
            役割
            <select
              value={npc.role}
              onChange={(e) => updateField('role', e.target.value as Npc['role'])}
            >
              <option value="client">client</option>
              <option value="enemy">enemy</option>
              <option value="mob">mob</option>
              <option value="other">other</option>
            </select>
          </label>
        </div>
      </header>

      <section>
        <h3>ステータス</h3>
        <div className="grid stats-grid">
          {statKeys.map((key) => (
            <label key={key}>
              {key}
              <input
                type="number"
                value={npc.stats?.[key] ?? ''}
                onChange={(e) => updateStat(key, e.target.value === '' ? undefined : Number(e.target.value))}
              />
            </label>
          ))}
        </div>
        <div className="derived-stats">
          <label className="derived-item">
            HP (CON+SIZ)/2
            <input
              type="number"
              value={npc.stats?.HP ?? hitPoints ?? ''}
              placeholder={hitPoints !== undefined ? String(hitPoints) : ''}
              onChange={(e) =>
                updateStat('HP', e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
          </label>
          <label className="derived-item">
            MP (POW)
            <input
              type="number"
              value={npc.stats?.MP ?? magicPoints ?? ''}
              placeholder={magicPoints !== undefined ? String(magicPoints) : ''}
              onChange={(e) =>
                updateStat('MP', e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
          </label>
          <div className="derived-item readonly">
            <div>ダメージボーナス (STR+SIZ)</div>
            <div className="db-value">{damageBonus ?? '-'}</div>
          </div>
        </div>
        <div className="section-header subsection">
          <h4>追加ステータス</h4>
          <button
            onClick={() =>
              updateField('extraStats', [
                ...(npc.extraStats ?? []),
                { id: `xstat-${Date.now()}`, name: '新ステータス', value: undefined },
              ])
            }
          >
            + 追加
          </button>
        </div>
        {(npc.extraStats ?? []).length === 0 && <div className="muted small">未追加</div>}
        {(npc.extraStats ?? []).map((ex) => (
          <div key={ex.id} className="row gap-sm extra-stat-row">
            <input
              value={ex.name}
              onChange={(e) =>
                updateField(
                  'extraStats',
                  (npc.extraStats ?? []).map((s) => (s.id === ex.id ? { ...s, name: e.target.value } : s)),
                )
              }
              placeholder="ステータス名"
            />
            <input
              type="number"
              value={ex.value ?? ''}
              onChange={(e) =>
                updateField(
                  'extraStats',
                  (npc.extraStats ?? []).map((s) =>
                    s.id === ex.id ? { ...s, value: e.target.value === '' ? undefined : Number(e.target.value) } : s,
                  ),
                )
              }
              placeholder="値"
            />
            <button
              className="ghost"
              onClick={() =>
                updateField('extraStats', (npc.extraStats ?? []).filter((s) => s.id !== ex.id))
              }
            >
              削除
            </button>
          </div>
        ))}
      </section>

      <section>
        <div className="section-header">
          <h3>技能</h3>
          <div className="skill-stack">
            <div className="skill-row">
              <select onChange={(e) => { addSkillFromTemplate(e.target.value); e.target.value = ''; }} defaultValue="">
                <option value="">テンプレから追加</option>
                {skillTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} {computeValueFromStats(tpl.id) ?? tpl.defaultValue ?? ''}
                  </option>
                ))}
              </select>
              <button onClick={() => { setSelectedTemplateIds([]); setShowTemplatePicker(true); }}>
                複数選択で追加
              </button>
              <button onClick={() => addEmptySkill('general')}>+ 自由追加(一般)</button>
              <button onClick={() => addEmptySkill('combat')}>+ 自由追加(戦闘)</button>
            </div>

            <div className="custom-calc">
              <span className="muted small">カスタム計算</span>
              <input
                value={customCalcName}
                onChange={(e) => setCustomCalcName(e.target.value)}
                placeholder="技能名"
              />
              <select
                value={customCalcStat}
                onChange={(e) => setCustomCalcStat(e.target.value)}
              >
                {statKeys.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <span>×</span>
              <input
                type="number"
                value={customCalcMult}
                onChange={(e) => setCustomCalcMult(Number(e.target.value) || 0)}
                className="calc-mult"
              />
              <button onClick={addCustomCalculatedSkill}>追加</button>
            </div>
          </div>
        </div>
        <table className="skill-table">
          <thead>
            <tr>
              <th>技能名</th>
              <th>値</th>
              <th>メモ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {npc.skills.filter((s) => s.category !== 'combat').map((skill) => (
              <tr key={skill.id}>
                <td>
                  <input
                    value={skill.name}
                    onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                  />
                </td>
                <td className="num">
                  <input
                    type="number"
                    value={skill.value ?? ''}
                    onChange={(e) => updateSkill(skill.id, 'value', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={skill.note ?? ''}
                    onChange={(e) => updateSkill(skill.id, 'note', e.target.value)}
                  />
                </td>
                <td>
                  <button className="ghost" onClick={() => removeSkill(skill.id)}>
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4 className="skill-subtitle">戦闘技能</h4>
        <table className="skill-table">
          <thead>
            <tr>
              <th>技能名</th>
              <th>値</th>
              <th>ダメージ</th>
              <th>ダメージ(計)</th>
              <th>メモ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {npc.skills.filter((s) => s.category === 'combat').map((skill) => (
              <tr key={skill.id}>
                <td>
                  <input
                    value={skill.name}
                    onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                  />
                </td>
                <td className="num">
                  <input
                    type="number"
                    value={skill.value ?? ''}
                    onChange={(e) => updateSkill(skill.id, 'value', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    placeholder="1D6+DB など"
                    value={skill.damage ?? ''}
                    onChange={(e) => updateSkill(skill.id, 'damage', e.target.value)}
                  />
                </td>
                <td className="damage-readonly">
                  {mergeDamageWithDb(skill.damage, damageBonus) ?? '-'}
                </td>
                <td>
                  <input
                    value={skill.note ?? ''}
                    onChange={(e) => updateSkill(skill.id, 'note', e.target.value)}
                  />
                </td>
                <td>
                  <button className="ghost" onClick={() => removeSkill(skill.id)}>
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <div className="section-header">
          <h3>Q&A</h3>
          <button onClick={addQa}>+ 追加</button>
        </div>
        {npc.qa.length === 0 && <div className="muted">まだありません</div>}
        {npc.qa.map((qa) => (
          <div key={qa.id} className="qa-row">
            <label>
              質問
              <input
                value={qa.question}
                onChange={(e) => updateQa(qa.id, 'question', e.target.value)}
              />
            </label>
            <label>
              回答
              <input
                value={qa.answer}
                onChange={(e) => updateQa(qa.id, 'answer', e.target.value)}
              />
            </label>
            <button className="ghost" onClick={() => removeQa(qa.id)}>
              削除
            </button>
          </div>
        ))}
      </section>

      <section>
        <h3>メモ</h3>
        <textarea
          rows={4}
          value={npc.memo ?? ''}
          onChange={(e) => updateField('memo', e.target.value)}
          placeholder="性格やRP方針など"
        />
      </section>

      <section>
        <h3>登場シーン</h3>
        <div className="chips">
          {scenes.map((scene) => (
            <label key={scene.id} className="chip-toggle">
              <input
                type="checkbox"
                checked={npc.appearScenes.includes(scene.id)}
                onChange={() => toggleAppearScene(scene.id)}
              />
              <span>{scene.title}</span>
            </label>
          ))}
        </div>
      </section>

      <CocofoliaExportPanel npc={npc} />

      {showTemplatePicker && (
        <div className="modal-backdrop" onClick={() => setShowTemplatePicker(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>技能テンプレを選択</h3>
              <span className="muted">既存テンプレ重複はスキップ</span>
            </div>
            <div className="modal__body">
              <div className="template-filters">
                <input
                  placeholder="テンプレ検索"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                />
                <button
                  className="ghost"
                  onClick={() => {
                    const ids = filteredTemplates.map((t) => t.id);
                    const allSelected = ids.every((id) => selectedTemplateIds.includes(id));
                    setSelectedTemplateIds(allSelected ? [] : ids);
                  }}
                >
                  全選択/解除
                </button>
              </div>
              <div className="template-grid">
                {filteredTemplates.map((tpl) => {
                  const checked = selectedTemplateIds.includes(tpl.id);
                  return (
                    <label key={tpl.id} className="template-tile">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTemplateIds((prev) => [...prev, tpl.id]);
                          } else {
                            setSelectedTemplateIds((prev) => prev.filter((id) => id !== tpl.id));
                          }
                        }}
                      />
                      <div>
                        <div className="template-tile__name">{tpl.name}</div>
                        <div className="muted">
                          初期値 {computeValueFromStats(tpl.id) ?? tpl.defaultValue ?? '-'}%
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="modal__footer">
              <button
                onClick={() => {
                  addSkillsFromTemplates(selectedTemplateIds);
                  setShowTemplatePicker(false);
                }}
              >
                追加する
              </button>
              <button className="ghost" onClick={() => setShowTemplatePicker(false)}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
