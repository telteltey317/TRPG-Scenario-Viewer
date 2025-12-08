import type { Scenario } from '../types';

const LOCAL_STORAGE_KEY = 'coc6_scenario';

export interface LoadScenarioResult {
  scenario: Scenario | null;
  errorMessage?: string;
  errorAt?: number;
}

export function loadScenarioFromLocalStorage(): LoadScenarioResult {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return { scenario: null };
  try {
    return { scenario: JSON.parse(raw) as Scenario };
  } catch (error) {
    console.error('Failed to parse scenario from localStorage', error);
    return {
      scenario: null,
      errorMessage: '保存データの読み込みに失敗しました (JSON parse error)',
      errorAt: Date.now(),
    };
  }
}

export function saveScenarioToLocalStorage(scenario: Scenario): void {
  // Surface errors (e.g. storage quota) to callers so they can notify the user.
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scenario));
}

export function exportScenarioToFile(scenario: Scenario): void {
  const blob = new Blob([JSON.stringify(scenario, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${scenario.meta.title || 'scenario'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
