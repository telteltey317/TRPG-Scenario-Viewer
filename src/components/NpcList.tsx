import { useEffect, useMemo, useState } from 'react';
import type { Npc } from '../types';
import './NpcList.css';

type Props = {
  npcs: Npc[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
};

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore in restrictive environments
  }
}

export function NpcList({ npcs, selectedId, onSelect, onAdd, onDelete }: Props) {
  const [query, setQuery] = useState(() => safeGet('npc_filter_query') ?? '');
  const [roleFilter, setRoleFilter] = useState<'all' | Npc['role']>(() => {
    const saved = safeGet('npc_filter_role');
    return saved === 'client' || saved === 'enemy' || saved === 'mob' || saved === 'other' ? saved : 'all';
  });

  useEffect(() => {
    safeSet('npc_filter_query', query);
  }, [query]);

  useEffect(() => {
    safeSet('npc_filter_role', roleFilter);
  }, [roleFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return npcs.filter((npc) => {
      if (roleFilter !== 'all' && npc.role !== roleFilter) return false;
      if (!q) return true;
      const haystack = [
        npc.name,
        npc.ruby ?? '',
        npc.memo ?? '',
        npc.qa.map((qa) => `${qa.question} ${qa.answer}`).join(' '),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [npcs, query, roleFilter]);

  return (
    <div className="npc-list">
      <div className="npc-list__header">
        <div>
          <h2>NPC一覧</h2>
          <span className="npc-list__count">
            {filtered.length}件 / {npcs.length}件
          </span>
        </div>
        <button onClick={onAdd}>+ 新規NPC</button>
      </div>
      <div className="npc-list__filters">
        <input
          placeholder="検索 (名前/メモ/ルビ)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)}>
          <option value="all">役割すべて</option>
          <option value="client">client</option>
          <option value="enemy">enemy</option>
          <option value="mob">mob</option>
          <option value="other">other</option>
        </select>
        <button
          className="ghost"
          onClick={() => {
            setQuery('');
            setRoleFilter('all');
          }}
        >
          クリア
        </button>
      </div>
      <div className="npc-list__scroll">
        <ul>
          {filtered.map((npc) => (
            <li
              key={npc.id}
              className={npc.id === selectedId ? 'selected' : ''}
              onClick={() => onSelect(npc.id)}
            >
              <div className="npc-list__row">
                <div>
                  <div className="npc-list__name">{npc.name}</div>
                  <div className="npc-list__meta">
                    <span className={`badge role-${npc.role}`}>{npc.role}</span>
                    {npc.appearScenes.length > 0 && (
                      <span className="muted">登場 {npc.appearScenes.length}シーン</span>
                    )}
                  </div>
                </div>
                <button
                  className="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(npc.id);
                  }}
                >削除</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
