import type { NpcStats } from '../types';

// Compute CoC6 damage bonus from STR+SIZ table
export function calcDamageBonus(stats?: NpcStats): string | undefined {
  if (!stats) return undefined;
  const sum = (stats.STR ?? 0) + (stats.SIZ ?? 0);
  if (!sum) return undefined;
  if (sum <= 12) return '-1D6';
  if (sum <= 16) return '-1D4';
  if (sum <= 24) return 'なし';
  if (sum <= 32) return '+1D4';
  if (sum <= 40) return '+1D6';
  if (sum <= 56) return '+2D6';
  if (sum <= 72) return '+3D6';
  if (sum <= 88) return '+4D6';
  return '+5D6以上';
}

// Merge weapon damage text with damage bonus text
export function mergeDamageWithDb(damage?: string, db?: string): string | undefined {
  if (!damage) return undefined;
  if (!damage.toUpperCase().includes('DB')) {
    // No placeholder, return original or append db if explicitly given and not "なし"
    if (db && db !== 'なし') {
      const normalizedDb = db.startsWith('+') || db.startsWith('-') ? db : `+${db}`;
      return `${damage}${normalizedDb.startsWith('-') ? normalizedDb : `+${normalizedDb.replace(/^\+/, '')}`}`;
    }
    return damage;
  }

  if (!db) return damage;
  if (db === 'なし') {
    return damage.replace(/([+−-]?)\s*DB/gi, '').replace(/\+\-/g, '-').replace(/\-\+/g, '-').replace(/\+\+/g, '+');
  }

  const normalizedDb = db.replace(/^\+/, '');
  const replaced = damage.replace(/DB/gi, normalizedDb);
  return replaced.replace(/\+\-/g, '-').replace(/\-\+/g, '-').replace(/\+\+/g, '+');
}
