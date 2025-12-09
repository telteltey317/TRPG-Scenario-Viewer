import { useState } from 'react';
import type { Scene } from '../types';
import './SceneList.css';

type Props = {
  scenes: Scene[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  chapters: string[];
  onAddChapter: (name: string) => void;
  searchText: string;
  onSearchTextChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
};

export function SceneList({
  scenes,
  selectedId,
  onSelect,
  onAdd,
  chapters,
  onAddChapter,
  searchText,
  onSearchTextChange,
  typeFilter,
  onTypeFilterChange,
}: Props) {
  const [newChapter, setNewChapter] = useState('');
  const filtered = scenes.filter((scene) => {
    if (typeFilter !== 'all' && scene.type !== typeFilter) return false;
    if (!searchText.trim()) return true;
    const text = searchText.toLowerCase();
    const haystack = [
      scene.title,
      scene.description,
      scene.info,
      scene.unlockCondition,
      scene.locationNameNote,
      ...scene.skillHints.map((h) => h.name),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(text);
  });

  const chapterOrder = [...chapters, '未分類'];
  const grouped = filtered.reduce<Map<string, Scene[]>>((map, scene) => {
    const key = (scene.chapter && scene.chapter.trim()) || '未分類';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(scene);
    return map;
  }, new Map());

  return (
    <div className="scene-list">
      <div className="scene-list__header">
        <div className="scene-list__title">
          <h2>シーン一覧</h2>
          <span className="scene-list__count">{scenes.length}件</span>
        </div>
        <button onClick={onAdd}>+ 新規シーン</button>
      </div>

      <div className="chapter-add">
        <input
          placeholder="章を追加 (例: 第1章 導入)"
          value={newChapter}
          onChange={(e) => setNewChapter(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAddChapter(newChapter);
              setNewChapter('');
            }
          }}
        />
        <button
          onClick={() => {
            onAddChapter(newChapter);
            setNewChapter('');
          }}
        >
          章追加
        </button>
      </div>

      <div className="scene-list__filters">
        <input
          placeholder="タイトル/技能/メモで検索"
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
        />
        <select value={typeFilter} onChange={(e) => onTypeFilterChange(e.target.value)}>
          <option value="all">すべて</option>
          <option value="intro">intro</option>
          <option value="investigation">investigation</option>
          <option value="combat">combat</option>
          <option value="climax">climax</option>
          <option value="epilogue">epilogue</option>
          <option value="etc">etc</option>
        </select>
      </div>

      <div className="scene-list__scroll">
        {chapterOrder.filter((c) => grouped.has(c)).map((chapter) => (
          <div key={chapter} className="scene-group">
            <div className="scene-group__header">{chapter}</div>
            <ul>
              {(grouped.get(chapter) ?? []).map((scene) => (
                <li
                  key={scene.id}
                  className={scene.id === selectedId ? 'selected' : ''}
                  onClick={() => onSelect(scene.id)}
                >
                  <div className="scene-list__title">{scene.title}</div>
                  <div className="scene-list__meta">
                    <span className={`badge badge-${scene.type}`}>{scene.type}</span>
                    {scene.locationNameNote && <span className="muted">@ {scene.locationNameNote}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {filtered.length === 0 && <div className="muted empty">該当するシーンがありません</div>}
      </div>
    </div>
  );
}
