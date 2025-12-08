import { useEffect, useMemo, useState } from 'react';
import type { FlowEdge, FlowNodeLayout, Npc, Scene, SceneId, Scenario, SkillTemplate } from '../types';
import { emptyScenario } from '../types';
import { loadScenarioFromLocalStorage, saveScenarioToLocalStorage } from '../lib/storage';
import { sampleScenario } from '../lib/sampleScenario';

interface ScenarioState {
  scenario: Scenario;
  setScenario: (next: Scenario) => void;
  undo: () => void;
  canUndo: boolean;
  selectedSceneId: SceneId | null;
  selectScene: (id: SceneId | null) => void;
  addScene: () => void;
  updateScene: (scene: Scene) => void;
  deleteScene: (id: SceneId) => void;
  addFlowEdge: (edge: Omit<FlowEdge, 'id'>) => void;
  updateFlowEdge: (edge: FlowEdge) => void;
  deleteFlowEdge: (id: string) => void;
  setFlowLayout: (layout: FlowNodeLayout[]) => void;
  selectedNpcId: string | null;
  selectNpc: (id: string | null) => void;
  addNpc: () => void;
  updateNpc: (npc: Npc) => void;
  deleteNpc: (id: string) => void;
  addSkillTemplate: (template: SkillTemplate) => void;
  updateSkillTemplate: (template: SkillTemplate) => void;
  deleteSkillTemplate: (id: string) => void;
  loadCoc6Templates: (templates: SkillTemplate[]) => void;
  errorMessage: string | null;
  errorAt: number | null;
  clearError: () => void;
  lastSavedAt: number | null;
  resetToSample: () => void;
  resetToEmpty: () => void;
}

export function useScenarioStore(): ScenarioState {
  const [scenario, setScenarioState] = useState<Scenario>(() => {
    const { scenario: stored } = loadScenarioFromLocalStorage();
    return stored ?? sampleScenario;
  });
  const [history, setHistory] = useState<Scenario[]>([]);

  const [selectedSceneId, setSelectedSceneId] = useState<SceneId | null>(
    scenario.scenes[0]?.id ?? null,
  );
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(
    scenario.npcs[0]?.id ?? null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    const { errorMessage } = loadScenarioFromLocalStorage();
    return errorMessage ?? null;
  });
  const [errorAt, setErrorAt] = useState<number | null>(() => {
    const { errorAt } = loadScenarioFromLocalStorage();
    return errorAt ?? null;
  });
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      saveScenarioToLocalStorage(scenario);
      setLastSavedAt(Date.now());
    } catch (error) {
      console.error(error);
      setErrorMessage('ローカル保存に失敗しました');
      setErrorAt(Date.now());
    }
  }, [scenario]);

  // Sync selection when scenario changes
  useEffect(() => {
    if (selectedSceneId && scenario.scenes.every((s) => s.id !== selectedSceneId)) {
      setSelectedSceneId(scenario.scenes[0]?.id ?? null);
    }
    if (selectedNpcId && scenario.npcs.every((n) => n.id !== selectedNpcId)) {
      setSelectedNpcId(scenario.npcs[0]?.id ?? null);
    }
  }, [scenario, selectedSceneId, selectedNpcId]);

  const pushHistory = () => {
    setHistory((prev) => [...prev.slice(-19), scenario]);
  };

  const api = useMemo<ScenarioState>(() => ({
    scenario,
    setScenario: setScenarioState,
    undo: () => {
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        setScenarioState(last);
        return prev.slice(0, -1);
      });
    },
    canUndo: history.length > 0,
    selectedSceneId,
    selectScene: setSelectedSceneId,
    addScene: () => {
      pushHistory();
      const newScene: Scene = {
        id: `scene-${Date.now()}`,
        title: '新規シーン',
        type: 'etc',
        unlockCondition: '',
        locationNameNote: '',
        description: '',
        info: '',
        skillHints: [],
        sanChecks: [],
        bgms: [],
        backgrounds: [],
        npcs: [],
        npcLines: [],
        notes: '',
      };
      setScenarioState((prev) => ({ ...prev, scenes: [...prev.scenes, newScene] }));
      setSelectedSceneId(newScene.id);
    },
    updateScene: (scene: Scene) => {
      pushHistory();
      setScenarioState((prev) => {
        const prevScene = prev.scenes.find((s) => s.id === scene.id);
        const scenes = prev.scenes.map((s) => (s.id === scene.id ? scene : s));

        const npcs = prev.npcs.map((npc) => {
          const inNew = scene.npcs.includes(npc.id);
          const inPrev = prevScene?.npcs.includes(npc.id) ?? false;
          let appearScenes = npc.appearScenes;
          if (inNew && !appearScenes.includes(scene.id)) {
            appearScenes = [...appearScenes, scene.id];
          }
          if (!inNew && inPrev && appearScenes.includes(scene.id)) {
            appearScenes = appearScenes.filter((sid) => sid !== scene.id);
          }
          return appearScenes === npc.appearScenes ? npc : { ...npc, appearScenes };
        });

        return { ...prev, scenes, npcs };
      });
    },
    deleteScene: (id: SceneId) => {
      pushHistory();
      setScenarioState((prev) => {
        const scenes = prev.scenes.filter((s) => s.id !== id);
        const flowEdges = prev.flowEdges.filter((e) => e.from !== id && e.to !== id);
        const flowLayout = prev.flowLayout.filter((n) => n.sceneId !== id);
        const npcs = prev.npcs.map((npc) => ({
          ...npc,
          appearScenes: npc.appearScenes.filter((sid) => sid !== id),
        }));
        return { ...prev, scenes, flowEdges, flowLayout, npcs };
      });
      setSelectedSceneId((current) => {
        if (current === id) {
          const fallback = scenario.scenes.find((s) => s.id !== id)?.id ?? null;
          return fallback;
        }
        return current;
      });
    },
    addFlowEdge: (edge: Omit<FlowEdge, 'id'>) => {
      pushHistory();
      const newEdge: FlowEdge = { ...edge, id: `edge-${Date.now()}` };
      setScenarioState((prev) => ({ ...prev, flowEdges: [...prev.flowEdges, newEdge] }));
    },
    updateFlowEdge: (edge: FlowEdge) => {
      pushHistory();
      setScenarioState((prev) => ({
        ...prev,
        flowEdges: prev.flowEdges.map((e) => (e.id === edge.id ? edge : e)),
      }));
    },
    deleteFlowEdge: (id: string) => {
      pushHistory();
      setScenarioState((prev) => ({
        ...prev,
        flowEdges: prev.flowEdges.filter((e) => e.id !== id),
      }));
    },
    setFlowLayout: (layout: FlowNodeLayout[]) => {
      pushHistory();
      setScenarioState((prev) => ({ ...prev, flowLayout: layout }));
    },
    selectedNpcId,
    selectNpc: setSelectedNpcId,
    addNpc: () => {
      pushHistory();
      const newNpc: Npc = {
        id: `npc-${Date.now()}`,
        name: '新規NPC',
        role: 'other',
        skills: [],
        qa: [],
        appearScenes: [],
      };
      setScenarioState((prev) => ({ ...prev, npcs: [...prev.npcs, newNpc] }));
      setSelectedNpcId(newNpc.id);
    },
    updateNpc: (npc: Npc) => {
      pushHistory();
      setScenarioState((prev) => ({
        ...prev,
        npcs: prev.npcs.map((n) => (n.id === npc.id ? npc : n)),
      }));
    },
    deleteNpc: (id: string) => {
      pushHistory();
      setScenarioState((prev) => ({
        ...prev,
        npcs: prev.npcs.filter((n) => n.id !== id),
        scenes: prev.scenes.map((s) => ({
          ...s,
          npcs: s.npcs.filter((npcId) => npcId !== id),
          npcLines: s.npcLines.filter((line) => line.npcId !== id),
        })),
      }));
      setSelectedNpcId((current) => (current === id ? null : current));
    },
    addSkillTemplate: (template: SkillTemplate) => {
      pushHistory();
      setScenarioState((prev) => ({ ...prev, skillTemplates: [...prev.skillTemplates, template] }));
    },
    updateSkillTemplate: (template: SkillTemplate) => {
      pushHistory();
      setScenarioState((prev) => ({
        ...prev,
        skillTemplates: prev.skillTemplates.map((t) => (t.id === template.id ? template : t)),
      }));
    },
    deleteSkillTemplate: (id: string) => {
      pushHistory();
      setScenarioState((prev) => ({
        ...prev,
        skillTemplates: prev.skillTemplates.filter((t) => t.id !== id),
      }));
    },
    loadCoc6Templates: (templates: SkillTemplate[]) => {
      pushHistory();
      setScenarioState((prev) => ({ ...prev, skillTemplates: templates }));
    },
    errorMessage,
    errorAt,
    clearError: () => {
      setErrorMessage(null);
      setErrorAt(null);
    },
    lastSavedAt,
    resetToSample: () => {
      pushHistory();
      setScenarioState(sampleScenario);
      setErrorMessage(null);
      setErrorAt(null);
      setLastSavedAt(null);
    },
    resetToEmpty: () => {
      pushHistory();
      setScenarioState(emptyScenario);
      setErrorMessage(null);
      setErrorAt(null);
      setLastSavedAt(null);
    },
  }), [scenario, selectedSceneId, selectedNpcId, errorMessage, errorAt, lastSavedAt]);

  return api;
}
