# JSONフォーマット仕様（詳細）

## Scenario ルート
```
{
  meta: Meta,
  scenes: Scene[],
  npcs: Npc[],
  locations: Location[],
  flowEdges: FlowEdge[],
  flowLayout: FlowNodeLayout[],
  skillTemplates: SkillTemplate[],
  chapters: string[]
}
```

### Meta
- `title`: string (必須)
- `system`: string (例: "CoC6"。未指定可)
- `author`: string | undefined
- `estimatedHours`: number | undefined (目安プレイ時間)
- `playerCountHint`: string | undefined (推奨PL数など)
- `notes`: string | undefined (KP向けメモ)

### Scene
- `id`: string (必須, ユニーク)
- `title`: string (必須)
- `type`: "intro" | "investigation" | "combat" | "climax" | "epilogue" | "etc"
- `chapter`: string (章/チャプター。空文字=未分類)
- `unlockCondition`: string | undefined (このシーンに入る条件)
- `locationId`: string | undefined (将来の場所参照用)
- `locationNameNote`: string | undefined (場所メモ直書き)
- `description`: string | undefined (KP用描写)
- `info`: string | undefined (内部情報、真相など)
- `skillHints`: SceneSkillHint[]
- `sanChecks`: SceneSanCheck[]
- `bgms`: SceneBgmEntry[]
- `backgrounds`: SceneBackgroundEntry[]
- `npcs`: string[] (Npc.id の配列)
- `npcLines`: SceneNpcLine[]
- `notes`: string | undefined

### FlowEdge
- `id`: string (ユニーク。読み込み時に欠けていてもアプリ側で補完されません)
- `from`: SceneId
- `to`: SceneId
- `type`: "normal" | "optional" | "badEnd"
- `condition`: string | undefined (矢印上に表示したい条件)
- `note`: string | undefined (補足)

### FlowNodeLayout
- `sceneId`: string
- `x`: number
- `y`: number
ノード配置を保存するための座標。欠けているシーンは自動配置されます。

### Npc (主要フィールド)
- `id`: string, `name`: string, `role`: "client"|"enemy"|"mob"|"other"
- `skills`: Skill[] (一般/戦闘両方を含む。戦闘判定はカテゴリで判別)
- `qa`: Qa[] (質問/回答)
- `appearScenes`: SceneId[] (登場シーン)
- そのほかステータスやメモ、ポートレート等は任意

### SkillTemplate
- `id`: string
- `name`: string
- `category`: "general" | "combat"
- `defaultValue`: number | undefined (初期値)
- `calcStat`: string | undefined (基準ステータス名を文字列で。例: "DEX" や "LuckBase")
- `calcMultiplier`: number | undefined (calcStatに掛ける倍率)
- `damage`: string | undefined (categoryがcombatのときのみ有効、例: "1D6+DB")

### バリデーションと補完
`src/App.tsx` の `validateScenario()` で最低限チェック・補完します。
- ルートはオブジェクトで `meta.title` が文字列必須。
- `scenes`/`npcs`/`flowEdges` などは配列であること。
- Scene/NPC は `id` と `title`/`name` が文字列必須。
- `type` が無いシーンは `etc`、`chapter` が無い場合は空文字をセット。
- `chapters` が無い場合は Scene 内の chapter 値から重複なしで生成。
- 配列でないフィールドは空配列に置き換え。
- シーンが0件の場合はエラーで読込失敗。

### 既知の制約
- FlowEdge の `id` が欠けていても自動生成しません。事前に振ってください。
- `locations` は現在 UI 未対応ですが JSON に保持されます。
- 追加フィールドは読み込み時に保持されますが UI からは編集できません。

### 保存/読み込み
- ローカル保存: ブラウザのLocalStorage (`scenario`) に自動保存。
- エクスポート: `exportScenarioToFile` で現在の状態をそのままJSON出力。
- インポート: バリデーション後に全体を置き換え。シーンが0件だとエラーになります。

不足している詳細や追加したいフィールドがあればお知らせください。
