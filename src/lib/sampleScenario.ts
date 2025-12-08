import type { Scenario } from '../types';

export const sampleScenario: Scenario = {
  meta: {
    title: '霧の街の短い夜',
    system: 'CoC6',
    author: 'Sample KP',
    estimatedHours: 2,
    playerCountHint: '2-3 players',
    notes: 'デモ用のミニシナリオです。',
  },
  skillTemplates: [
    { id: 'spot', name: '目星', defaultValue: 25 },
    { id: 'listen', name: '聞き耳', defaultValue: 25 },
    { id: 'psychology', name: '心理学', defaultValue: 5 },
    { id: 'occult', name: 'オカルト', defaultValue: 5 },
  ],
  npcs: [
    {
      id: 'npc-reiko',
      name: '三条 麗子',
      role: 'client',
      stats: { DEX: 11, POW: 13, SAN: 55, HP: 10, MP: 13 },
      skills: [
        { id: 's1', name: '目星', value: 55, templateId: 'spot' },
        { id: 's2', name: '図書館', value: 40 },
      ],
      memo: '古書店の店主。霧の中で何かを見たという。',
      qa: [
        {
          id: 'q1',
          question: '見たものは何だったか？',
          answer: '大きな鳥のような影が屋根から屋根へ移動していた。',
        },
      ],
      portraitLocalName: 'reiko.png',
      tokenLocalName: 'reiko_token.png',
      appearScenes: ['scene-intro', 'scene-library'],
    },
    {
      id: 'npc-crow',
      name: '黒翼の怪鳥',
      role: 'enemy',
      stats: { DEX: 15, POW: 18, SAN: 0, HP: 18, MP: 18 },
      skills: [
        { id: 's3', name: 'かぎ爪', value: 60 },
        { id: 's4', name: '跳躍', value: 50 },
      ],
      memo: '正体は深きもの。夜にだけ姿を現す。',
      qa: [],
      appearScenes: ['scene-rooftop'],
    },
  ],
  scenes: [
    {
      id: 'scene-intro',
      title: '霧の書店',
      type: 'intro',
      unlockCondition: '開始時',
      description: 'KP読み上げ用の導入。書店に濃い霧が入り込み、不穏な足音が遠くで響く。',
      info: '麗子から依頼を受ける。霧の夜に現れる怪鳥の調査。',
      skillHints: [
        {
          id: 'hint-spot',
          name: '目星',
          effect: '店内の棚に黒い羽が挟まっているのを見つける。',
        },
      ],
      sanChecks: [],
      bgms: [
        { id: 'bgm-calm', label: '日常', localFileName: 'calm_piano.mp3' },
      ],
      backgrounds: [
        { id: 'bg-book', label: '書店', localFileName: 'bookstore.jpg' },
      ],
      npcs: ['npc-reiko'],
      npcLines: [
        {
          id: 'line-reiko',
          npcId: 'npc-reiko',
          line: '「昨夜、黒い鳥が屋根を走っていたの。見間違いじゃないわ」',
        },
      ],
      notes: 'ここで技能テンプレの追加ダイアログを試せると良い。',
    },
    {
      id: 'scene-library',
      title: '市立図書館の調査',
      type: 'investigation',
      unlockCondition: '麗子の証言を元に調査に向かう',
      description: '古い新聞記事を調べると、過去にも霧の夜に行方不明が出ていると分かる。',
      info: '怪鳥は実は深きもの。ルルイエの伝承が絡む。',
      skillHints: [
        {
          id: 'hint-library',
          name: '図書館',
          effect: '1920年代の行方不明事件の記事を発見。',
        },
        {
          id: 'hint-psychology',
          name: '心理学',
          effect: '麗子が何かを隠していると気付く。',
        },
      ],
      sanChecks: [],
      bgms: [
        { id: 'bgm-invest', label: '静かな調査', localFileName: 'investigation.mp3' },
      ],
      backgrounds: [],
      npcs: ['npc-reiko'],
      npcLines: [],
      notes: '情報提示用シーン。',
    },
    {
      id: 'scene-rooftop',
      title: '屋上での対峙',
      type: 'climax',
      unlockCondition: '夜、霧の濃い時間帯にビル屋上へ向かう',
      description: '霧の向こうから黒い翼が広がり、怪鳥が姿を現す。',
      info: '戦闘、もしくは封印の儀式で対処可能。',
      skillHints: [
        {
          id: 'hint-ritual',
          name: 'オカルト',
          effect: '封印の手順を思い出す。',
          failureNote: '失敗すると時間を浪費し、敵の先制を許す。',
        },
      ],
      sanChecks: [
        {
          id: 'san-rooftop',
          trigger: '怪鳥の姿を目撃',
          value: '0/1D6',
          description: '翼の下に覗く鱗だらけの腕。',
        },
      ],
      bgms: [
        { id: 'bgm-battle', label: '戦闘', localFileName: 'battle_theme.mp3', note: 'クライマックス用' },
      ],
      backgrounds: [
        { id: 'bg-rooftop', label: '屋上', localFileName: 'rooftop.jpg' },
      ],
      npcs: ['npc-crow'],
      npcLines: [],
      notes: 'SANチェックと戦闘。',
    },
  ],
  locations: [],
  flowEdges: [
    { id: 'edge-1', from: 'scene-intro', to: 'scene-library', type: 'normal' },
    { id: 'edge-2', from: 'scene-library', to: 'scene-rooftop', type: 'optional', note: '封印の儀式を調べた場合' },
  ],
  flowLayout: [
    { sceneId: 'scene-intro', x: 100, y: 120 },
    { sceneId: 'scene-library', x: 320, y: 120 },
    { sceneId: 'scene-rooftop', x: 540, y: 120 },
  ],
};
