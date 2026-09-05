import { reactive } from 'vue';

export type Shortcut = {
  id: number;
  code: string;
  label: string;
  context: string;
  keyValue: string;
  enabled: number;
};

export const shortcutStore = reactive({ shortcuts: [] as Shortcut[], loaded: false });

export const loadShortcuts = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/shortcuts`);
    if (!response.ok) throw new Error('Falha ao carregar atalhos.');
    shortcutStore.shortcuts = await response.json();
  } finally {
    shortcutStore.loaded = true;
  }
};

export const getShortcut = (code: string, fallback: string) =>
  shortcutStore.shortcuts.find(shortcut => shortcut.code === code)?.keyValue || fallback;

export const matchesShortcut = (event: KeyboardEvent, code: string, fallback: string) => {
  const saved = shortcutStore.shortcuts.find(shortcut => shortcut.code === code);
  if (saved && !saved.enabled) return false;
  const configured = saved?.keyValue || fallback;
  if (configured === 'Space') return event.code === 'Space' || event.key === ' ';
  if (configured === 'Escape') return event.code === 'Escape' || event.key === 'Escape';
  return event.key.toLowerCase() === configured.toLowerCase();
};

export const normalizeShortcutKey = (value: string) => {
  if (value === ' ') return 'Space';
  if (value === 'Esc') return 'Escape';
  return value.length === 1 ? value.toUpperCase() : value;
};
