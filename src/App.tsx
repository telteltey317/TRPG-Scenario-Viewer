import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { SceneDetail } from './components/SceneDetail';
import { SceneList } from './components/SceneList';
import { NpcList } from './components/NpcList';
import { NpcDetail } from './components/NpcDetail';
import { SkillTemplateList } from './components/SkillTemplateList';
import { FlowView } from './components/FlowView';
import { exportScenarioToFile } from './lib/storage';
import { useScenarioStore } from './store/scenarioStore';
import { coc6SkillTemplates } from './lib/coc6Templates';
import type { Scenario, SceneType } from './types';
import { ToastStack, type ToastItem, type ToastKind } from './components/Toast';
import { ScenarioMetaEditor } from './components/ScenarioMetaEditor';
import './App.css';

function validateScenario(raw: unknown): Scenario {
  if (typeof raw !== 'object' || raw === null) throw new Error('not an object');
  const obj = raw as any;
  if (!obj.meta || typeof obj.meta.title !== 'string') throw new Error('meta.title missing');
  const baseScenario: Scenario = {
    meta: {
      title: obj.meta.title,
      system: obj.meta.system ?? 'CoC6',
      author: obj.meta.author,
      estimatedHours: obj.meta.estimatedHours,
      playerCountHint: obj.meta.playerCountHint,
      notes: obj.meta.notes,
    },
    scenes: Array.isArray(obj.scenes) ? obj.scenes : [],
    npcs: Array.isArray(obj.npcs) ? obj.npcs : [],
    locations: Array.isArray(obj.locations) ? obj.locations : [],
    flowEdges: Array.isArray(obj.flowEdges) ? obj.flowEdges : [],
    flowLayout: Array.isArray(obj.flowLayout) ? obj.flowLayout : [],
    skillTemplates: Array.isArray(obj.skillTemplates) ? obj.skillTemplates : [],
  };
  // minimal per-item checks
  baseScenario.scenes = baseScenario.scenes
    .filter((s: any) => s && typeof s.id === 'string' && typeof s.title === 'string')
    .map((s: any) => ({
      ...s,
      type: s.type ?? 'etc',
      chapter: typeof s.chapter === 'string' ? s.chapter : '',
      npcs: Array.isArray(s.npcs) ? s.npcs : [],
      skillHints: Array.isArray(s.skillHints) ? s.skillHints : [],
      sanChecks: Array.isArray(s.sanChecks) ? s.sanChecks : [],
      bgms: Array.isArray(s.bgms) ? s.bgms : [],
      backgrounds: Array.isArray(s.backgrounds) ? s.backgrounds : [],
      npcLines: Array.isArray(s.npcLines) ? s.npcLines : [],
    }));
  baseScenario.npcs = baseScenario.npcs
    .filter((n: any) => n && typeof n.id === 'string' && typeof n.name === 'string')
    .map((n: any) => ({
      ...n,
      skills: Array.isArray(n.skills) ? n.skills : [],
      qa: Array.isArray(n.qa) ? n.qa : [],
      appearScenes: Array.isArray(n.appearScenes) ? n.appearScenes : [],
    }));
  baseScenario.locations = baseScenario.locations ?? [];
  baseScenario.flowEdges = baseScenario.flowEdges ?? [];
  baseScenario.flowLayout = baseScenario.flowLayout ?? [];
  baseScenario.skillTemplates = baseScenario.skillTemplates ?? [];
  const chaptersFromScenes = new Set<string>();
  baseScenario.scenes.forEach((s) => {
    if (s.chapter && typeof s.chapter === 'string' && s.chapter.trim()) {
      chaptersFromScenes.add(s.chapter.trim());
    }
  });
  baseScenario.chapters = Array.isArray(obj.chapters)
    ? [...new Set([...obj.chapters.filter((c: any) => typeof c === 'string' && c.trim()), ...chaptersFromScenes])]
    : [...chaptersFromScenes];
  if (baseScenario.scenes.length === 0) throw new Error('scenes missing');
  return baseScenario;
}
function App() {
  const [activeTab, setActiveTab] = useState<'meta' | 'scene' | 'npc' | 'template' | 'flow'>('scene');
  const [sceneSearch, setSceneSearch] = useState('');
  const [sceneTypeFilter, setSceneTypeFilter] = useState<'all' | SceneType>('all');
  const {
    scenario,
    setScenario,
    selectedSceneId,
    selectScene,
    addScene,
    updateScene,
    deleteScene,
    addFlowEdge,
    updateFlowEdge,
    deleteFlowEdge,
    setFlowLayout,
    selectedNpcId,
    selectNpc,
    addNpc,
    updateNpc,
    deleteNpc,
    addSkillTemplate,
    updateSkillTemplate,
    deleteSkillTemplate,
    addChapter,
    loadCoc6Templates,
    errorMessage,
    errorAt,
    clearError,
    lastSavedAt,
    resetToSample,
    resetToEmpty,
    undo,
    canUndo,
  } = useScenarioStore();
  const [importError, setImportError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastSavedToastAt = useRef<number>(0);
  const lastSavedSeen = useRef<number | null>(null);
  const toastTimers = useRef<number[]>([]);
  const presetAutoLoaded = useRef(false);

  const pushToast = (message: string, kind: ToastKind = 'info', duration = 4200) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, kind }]);
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    toastTimers.current.push(timer);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    toastTimers.current.forEach((timer) => window.clearTimeout(timer));
    toastTimers.current = [];
  };

  const selectedScene = scenario.scenes.find((s) => s.id === selectedSceneId);

  useEffect(() => {
    document.title = scenario.meta.title
      ? `${scenario.meta.title} | TRPGシナリオビューワ`
      : 'TRPGシナリオビューワ';
  }, [scenario.meta.title]);

  useEffect(() => {
    if (!lastSavedAt) return;
    if (lastSavedSeen.current === null) {
      lastSavedSeen.current = lastSavedAt;
      return;
    }
    const now = Date.now();
    if (now - lastSavedToastAt.current > 8000) {
      pushToast('ローカルに保存しました', 'success', 2600);
      lastSavedToastAt.current = now;
    }
    lastSavedSeen.current = lastSavedAt;
  }, [lastSavedAt]);

  useEffect(() => {
    if (errorMessage) {
      pushToast(errorMessage, 'error', 6000);
    }
  }, [errorMessage, errorAt]);

  useEffect(() => {
    if (importError) {
      pushToast(importError, 'error', 6000);
    }
  }, [importError]);

  // If only the small sample templates are present, auto-load the full CoC6 preset once.
  useEffect(() => {
    if (presetAutoLoaded.current) return;
    if (scenario.skillTemplates.length <= 4) {
      loadCoc6Templates(coc6SkillTemplates);
      presetAutoLoaded.current = true;
      pushToast('CoC6技能テンプレートを読み込みました', 'info', 2500);
    }
  }, [scenario.skillTemplates.length, loadCoc6Templates]);

  useEffect(() => () => {
    toastTimers.current.forEach((timer) => window.clearTimeout(timer));
    toastTimers.current = [];
  }, []);

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const data = validateScenario(raw);
      setScenario(data);
      setImportError(null);
      selectScene(data.scenes?.[0]?.id ?? null);
      pushToast('JSONを読み込みました', 'success');
    } catch (err) {
      console.error(err);
      setImportError('JSONの読み込みに失敗しました');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <div className="eyebrow">CoC6 Scenario Viewer</div>
          <h1>{scenario.meta.title}</h1>
          {scenario.meta.author && <div className="meta">Author: {scenario.meta.author}</div>}
        </div>
        <div className="header-actions">
          {lastSavedAt && (
            <span className="save-chip">保存 {new Date(lastSavedAt).toLocaleTimeString()}</span>
          )}
          <button onClick={undo} disabled={!canUndo}>Undo</button>
          <button onClick={resetToSample}>サンプル読込</button>
          <button onClick={resetToEmpty}>空にする</button>
          <button
            onClick={() => {
              exportScenarioToFile(scenario);
              pushToast('JSONを書き出しました', 'info');
            }}
          >
            JSONエクスポート
          </button>
          <label className="import-button">
            JSON読込
            <input
              type="file"
              accept="application/json"
              ref={fileInputRef}
              onChange={handleImport}
            />
          </label>
          <button onClick={() => setShowHelp((v) => !v)}>{showHelp ? 'ヘルプを隠す' : 'ヘルプ表示'}</button>
        </div>
      </header>

      {showHelp && (
        <div className="help-panel">
          <h3>クイックヘルプ</h3>
          <ul>
            <li>シーンは章(チャプター)を入力すると一覧でグループ化されます。</li>
            <li>フロー: 上部フォームで矢印追加、AND一括で並行→合流を登録。グラフはノードドラッグで移動、背景ドラッグでパン、＋/−でズーム。</li>
            <li>JSON入出力: ヘッダーのエクスポート/読込を利用。フォーマットは下記概要、詳細は Json_format.md を参照。</li>
            <li>Undoボタンで直前の変更を戻せます。</li>
          </ul>
          <h4>JSONフォーマット概要</h4>
          <pre className="help-pre">{`
{
  meta: { title, system?, author?, estimatedHours?, playerCountHint?, notes? },
  scenes: [ { id, title, type, chapter?, unlockCondition?, ... } ],
  npcs:   [ { id, name, role, skills, appearScenes, ... } ],
  flowEdges: [ { id, from, to, type, condition?, note? } ],
  flowLayout: [ { sceneId, x, y } ],
  skillTemplates: [ { id, name, category, defaultValue?, calcStat?, calcMultiplier?, damage? } ]
}
`}</pre>
          <div className="muted small">詳細仕様はリポジトリの Json_format.md を参照してください。</div>
        </div>
      )}

      {(errorMessage || importError) && (
        <div
          className="banner banner-warning"
          onClick={() => {
            clearError();
            setImportError(null);
          }}
        >
          <div>
            {errorMessage ?? importError}
            {errorAt && <span className="muted"> ({new Date(errorAt).toLocaleTimeString()})</span>}
          </div>
          <span className="banner-dismiss">×</span>
        </div>
      )}

      <div className="tab-bar">
        <button
          className={activeTab === 'meta' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('meta')}
        >
          シナリオ情報
        </button>
        <button
          className={activeTab === 'scene' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('scene')}
        >
          シーン
        </button>
        <button
          className={activeTab === 'npc' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('npc')}
        >
          NPC
        </button>
        <button
          className={activeTab === 'template' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('template')}
        >
          技能テンプレ
        </button>
        <button
          className={activeTab === 'flow' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('flow')}
        >
          フロー
        </button>
      </div>

      <div className="app__body">
        <div className="app__sidebar">
          <SceneList
            scenes={scenario.scenes}
            selectedId={selectedSceneId}
            onSelect={selectScene}
            onAdd={addScene}
            chapters={scenario.chapters ?? []}
            onAddChapter={addChapter}
            searchText={sceneSearch}
            onSearchTextChange={setSceneSearch}
            typeFilter={sceneTypeFilter}
            onTypeFilterChange={(v) => setSceneTypeFilter(v as 'all' | SceneType)}
          />
        </div>
        <div className="app__content">
          {activeTab === 'meta' && (
            <ScenarioMetaEditor
              meta={scenario.meta}
              onChange={(meta) => setScenario({ ...scenario, meta })}
            />
          )}

          {activeTab === 'scene' && (
            <SceneDetail
              scene={selectedScene}
              npcs={scenario.npcs}
              availableChapters={scenario.chapters ?? []}
              onChange={updateScene}
              onDelete={deleteScene}
            />
          )}

          {activeTab === 'npc' && (
            <div className="npc-panel">
              <div className="npc-panel__list">
                <NpcList
                  npcs={scenario.npcs}
                  selectedId={selectedNpcId}
                  onSelect={(id) => selectNpc(id)}
                  onAdd={addNpc}
                  onDelete={deleteNpc}
                />
              </div>
              <div className="npc-panel__detail">
                <NpcDetail
                  npc={scenario.npcs.find((n) => n.id === selectedNpcId)}
                  scenes={scenario.scenes}
                  skillTemplates={scenario.skillTemplates}
                  onChange={updateNpc}
                />
              </div>
            </div>
          )}

          {activeTab === 'template' && (
            <SkillTemplateList
              templates={scenario.skillTemplates}
              onAdd={addSkillTemplate}
              onUpdate={updateSkillTemplate}
              onDelete={deleteSkillTemplate}
              onLoadPreset={() => loadCoc6Templates(coc6SkillTemplates)}
            />
          )}

          {activeTab === 'flow' && (
            <FlowView
              scenes={scenario.scenes}
              edges={scenario.flowEdges}
              layout={scenario.flowLayout}
              chapters={scenario.chapters ?? []}
              onAddEdge={addFlowEdge}
              onUpdateEdge={updateFlowEdge}
              onDeleteEdge={deleteFlowEdge}
              onAutoLayout={setFlowLayout}
              onSelectScene={selectScene}
            />
          )}
        </div>
      </div>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
