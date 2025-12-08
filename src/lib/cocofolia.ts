import type { SkillEntry, Npc } from '../types';
import { calcDamageBonus, mergeDamageWithDb } from './combat';

export interface CommandOptions {
  secret?: boolean; // trueなら先頭にSを付ける
}

// 技能1件分のコマンドを生成する
export function buildSkillCommand(
  skill: SkillEntry,
  opts: CommandOptions = {},
): string {
  const valuePart = skill.value != null ? `<=${skill.value}` : '';
  const base = `CCB${valuePart} 【${skill.name}】`;
  return opts.secret ? `S${base}` : base;
}

export interface NpcCommandOptions extends CommandOptions {
  includeSanCommands?: boolean; // SANチェック系コマンドを追加するか
}

// 1NPC分のチャットパレット文字列を生成する
export function buildNpcCommands(
  npc: Npc,
  opts: NpcCommandOptions = {},
): string {
  const lines: string[] = [];
  const db = calcDamageBonus(npc.stats);

  for (const skill of npc.skills) {
    lines.push(buildSkillCommand(skill, opts));
    if (skill.category === 'combat' && skill.damage) {
      const dmgExpr = mergeDamageWithDb(skill.damage, db);
      if (dmgExpr) {
        const base = `${dmgExpr} 【${skill.name}ダメージ】`;
        lines.push(opts.secret ? `S${base}` : base);
      }
    }
  }

  if (opts.includeSanCommands) {
    const sanBase = `1d100<={SAN} 【SANチェック】`;
    lines.push(opts.secret ? `S${sanBase}` : sanBase);
  }

  return lines.join('\n');
}

export interface CharacterStatus {
  label: string;
  value: number;
  max: number;
}

export interface CharacterParam {
  label: string;
  value: string;
}

export interface CharacterClipboardData {
  kind: 'character';
  data: {
    name: string;
    memo?: string;
    initiative?: number;
    status?: CharacterStatus[];
    params?: CharacterParam[];
    commands?: string;
  };
}

export function buildCocofoliaText(
  npc: Npc,
  opts: NpcCommandOptions = {},
): string {
  const status: CharacterStatus[] = [];
  const params: CharacterParam[] = [];
  const db = calcDamageBonus(npc.stats);

  if (npc.stats) {
    const { HP, MP, SAN, ...rest } = npc.stats;
    if (HP != null) status.push({ label: 'HP', value: HP, max: HP });
    if (MP != null) status.push({ label: 'MP', value: MP, max: MP });
    if (SAN != null) status.push({ label: 'SAN', value: SAN, max: SAN });

    Object.entries(rest).forEach(([key, value]) => {
      if (value != null) params.push({ label: key, value: String(value) });
    });
  }

  if (db) {
    params.push({ label: 'DB', value: db });
  }

  for (const skill of npc.skills) {
    const value = skill.value != null ? String(skill.value) : '';
    params.push({ label: skill.name, value });
  }

  const qaText = npc.qa
    .map((q) => `Q: ${q.question}\nA: ${q.answer}`)
    .join('\n');

  const memo = [npc.memo, qaText].filter(Boolean).join('\n\n');

  const clipboardData: CharacterClipboardData = {
    kind: 'character',
    data: {
      name: npc.name,
      memo: memo || undefined,
      initiative: npc.stats?.DEX,
      status: status.length ? status : undefined,
      params: params.length ? params : undefined,
      commands: buildNpcCommands(npc, opts),
    },
  };

  return JSON.stringify(clipboardData, null, 2);
}
