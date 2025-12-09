export type SceneId = string;
export type NpcId = string;
export type SkillId = string;
export type LocationId = string;
export type FlowEdgeId = string;
export type SkillCategory = 'general' | 'combat';

export interface ScenarioMeta {
  title: string;
  system: 'CoC6';
  author?: string;
  estimatedHours?: number;
  playerCountHint?: string;
  notes?: string;
}

export interface SkillTemplate {
  id: SkillId;
  name: string;
  defaultValue?: number;
  category?: SkillCategory;
  calcStat?: string;
  calcMultiplier?: number;
  damage?: string;
}

export interface SkillEntry {
  id: string;
  name: string;
  value?: number;
  note?: string;
  templateId?: SkillId;
  category?: SkillCategory;
  calcStat?: string;
  calcMultiplier?: number;
  damage?: string;
}

export interface NpcQaItem {
  id: string;
  question: string;
  answer: string;
}

export interface NpcStats {
  STR?: number;
  CON?: number;
  POW?: number;
  DEX?: number;
  APP?: number;
  SIZ?: number;
  INT?: number;
  EDU?: number;
  HP?: number;
  MP?: number;
  SAN?: number;
}

export type NpcRole = 'client' | 'enemy' | 'mob' | 'other';

export interface Npc {
  id: NpcId;
  name: string;
  ruby?: string;
  role: NpcRole;
  stats?: NpcStats;
  extraStats?: { id: string; name: string; value?: number }[];
  skills: SkillEntry[];
  memo?: string;
  qa: NpcQaItem[];
  portraitLocalName?: string;
  tokenLocalName?: string;
  appearScenes: SceneId[];
}

export interface SceneSkillHint {
  id: string;
  name: string;
  effect?: string;
  failureNote?: string;
}

export interface SceneSanCheck {
  id: string;
  trigger: string;
  value: string;
  description?: string;
}

export interface SceneBgmEntry {
  id: string;
  label: string;
  localFileName: string;
  note?: string;
}

export interface SceneBackgroundEntry {
  id: string;
  label: string;
  localFileName: string;
}

export interface SceneNpcLine {
  id: string;
  npcId: NpcId;
  line: string;
}

export type SceneType =
  | 'intro'
  | 'investigation'
  | 'combat'
  | 'climax'
  | 'epilogue'
  | 'etc';

export interface Scene {
  id: SceneId;
  title: string;
  type: SceneType;
  chapter?: string;
  unlockCondition?: string;
  locationId?: LocationId;
  locationNameNote?: string;
  description?: string;
  info?: string;
  skillHints: SceneSkillHint[];
  sanChecks: SceneSanCheck[];
  bgms: SceneBgmEntry[];
  backgrounds: SceneBackgroundEntry[];
  npcs: NpcId[];
  npcLines: SceneNpcLine[];
  notes?: string;
}

export type FlowEdgeType = 'normal' | 'optional' | 'badEnd';

export interface FlowEdge {
  id: FlowEdgeId;
  from: SceneId;
  to: SceneId;
  type: FlowEdgeType;
  condition?: string;
  note?: string;
}

export interface FlowNodeLayout {
  sceneId: SceneId;
  x: number;
  y: number;
}

export interface LocationNode {
  id: LocationId;
  name: string;
  memo?: string;
  sceneIds: SceneId[];
  x: number;
  y: number;
}

export interface Scenario {
  meta: ScenarioMeta;
  npcs: Npc[];
  scenes: Scene[];
  locations: LocationNode[];
  flowEdges: FlowEdge[];
  flowLayout: FlowNodeLayout[];
  skillTemplates: SkillTemplate[];
  chapters?: string[];
}

export const emptyScenario: Scenario = {
  meta: {
    title: 'Untitled Scenario',
    system: 'CoC6',
  },
  npcs: [],
  scenes: [],
  locations: [],
  flowEdges: [],
  flowLayout: [],
  skillTemplates: [],
  chapters: [],
};
