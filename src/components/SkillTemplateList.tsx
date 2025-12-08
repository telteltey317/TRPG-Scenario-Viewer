import { useEffect, useMemo, useState } from 'react';
import type { SkillTemplate } from '../types';
import './SkillTemplateList.css';

type Props = {
  templates: SkillTemplate[];
  onAdd: (template: SkillTemplate) => void;
  onUpdate: (template: SkillTemplate) => void;
  onDelete: (id: string) => void;
  onLoadPreset: () => void;
};

export function SkillTemplateList({ templates, onAdd, onUpdate, onDelete, onLoadPreset }: Props) {
  const [query, setQuery] = useState(() => {
    try {
      return localStorage.getItem('tpl_filter_query') ?? '';
    } catch {
      return '';
    }
  });
  const addBlank = (category: 'general' | 'combat') => {
    onAdd({
      id: `tpl-${Date.now()}`,
      name: '新しい技能',
      defaultValue: undefined,
      category,
      calcStat: undefined,
      calcMultiplier: undefined,
      damage: category === 'combat' ? '' : undefined,
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem('tpl_filter_query', query);
    } catch {
      // ignore when storage is unavailable
    }
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((tpl) => tpl.name.toLowerCase().includes(q));
  }, [templates, query]);

  return (
    <div className="template-list">
      <div className="template-list__header">
        <div>
          <h2>技能テンプレート</h2>
          <span className="muted">{filtered.length}件 / {templates.length}件</span>
        </div>
        <div className="row gap-sm">
          <button
            onClick={() => {
              onLoadPreset();
              setQuery('');
            }}
          >
            CoC6技能テンプレ読み込み
          </button>
          <button onClick={() => addBlank('general')}>+ 一般追加</button>
          <button onClick={() => addBlank('combat')}>+ 戦闘追加</button>
        </div>
      </div>
      <div className="template-list__filters">
        <input
          placeholder="検索 (技能名)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="ghost" onClick={() => setQuery('')}>
          クリア
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>技能名</th>
            <th style={{ width: '140px' }}>カテゴリ</th>
            <th style={{ width: '120px' }}>初期値</th>
            <th style={{ width: '160px' }}>基準ステータス</th>
            <th style={{ width: '90px' }}>倍率</th>
            <th style={{ width: '140px' }}>ダメージ(戦闘)</th>
            <th style={{ width: '80px' }}></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((tpl) => (
            <tr key={tpl.id}>
              <td data-label="技能名">
                <input
                  value={tpl.name}
                  onChange={(e) => onUpdate({ ...tpl, name: e.target.value })}
                />
              </td>
              <td data-label="カテゴリ">
                <select
                  value={tpl.category ?? 'general'}
                  onChange={(e) =>
                    onUpdate({
                      ...tpl,
                      category: e.target.value as any,
                    })
                  }
                >
                  <option value="general">一般</option>
                  <option value="combat">戦闘</option>
                </select>
              </td>
              <td data-label="初期値">
                <input
                  type="number"
                  value={tpl.defaultValue ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      ...tpl,
                      defaultValue: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </td>
              <td data-label="基準ステータス">
                <input
                  value={tpl.calcStat ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      ...tpl,
                      calcStat: e.target.value || undefined,
                    })
                  }
                  placeholder="例: DEX / LuckBase"
                  list="stat-suggestions"
                />
              </td>
              <td data-label="倍率">
                <input
                  type="number"
                  value={tpl.calcMultiplier ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      ...tpl,
                      calcMultiplier:
                        e.target.value === '' ? undefined : Number(e.target.value) || 0,
                    })
                  }
                />
              </td>
              <td data-label="ダメージ(戦闘)">
                <input
                  value={tpl.damage ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      ...tpl,
                      damage: e.target.value || undefined,
                    })
                  }
                  placeholder={tpl.category === 'combat' ? '1D6+DB など' : ''}
                  disabled={(tpl.category ?? 'general') !== 'combat'}
                />
              </td>
              <td data-label="操作">
                <button className="ghost" onClick={() => onDelete(tpl.id)}>
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <datalist id="stat-suggestions">
        {['STR','CON','POW','DEX','APP','SIZ','INT','EDU','HP','MP','SAN'].map((k) => (
          <option key={k} value={k} />
        ))}
      </datalist>
    </div>
  );
}
