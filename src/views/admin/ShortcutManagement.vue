<template>
  <section class="shortcut-management">
    <p class="help">Configure as teclas usadas pelos jogos. A mesma tecla não pode ser repetida dentro do mesmo contexto.</p>

    <div v-for="(items, context) in groupedShortcuts" :key="context" class="shortcut-group">
      <h3>{{ context }}</h3>
      <div v-for="shortcut in items" :key="shortcut.id" class="shortcut-row">
        <div class="shortcut-description">
          <strong>{{ shortcut.label }}</strong>
          <small>{{ shortcut.code }}</small>
        </div>
        <input
          :value="shortcut.keyValue"
          :disabled="savingId === shortcut.id"
          aria-label="Tecla do atalho"
          @keydown.prevent="captureKey($event, shortcut)"
        />
        <label class="enabled"><input :checked="shortcut.enabled === 1" type="checkbox" @change="toggleEnabled($event, shortcut)" /> Ativo</label>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { loadShortcuts, normalizeShortcutKey, shortcutStore, type Shortcut } from '../../store/shortcutStore';

const API = `${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/shortcuts`;
const savingId = ref<number | null>(null);
const groupedShortcuts = computed(() => shortcutStore.shortcuts.reduce<Record<string, Shortcut[]>>((groups, shortcut) => {
  (groups[shortcut.context] ||= []).push(shortcut);
  return groups;
}, {}));

const request = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Não foi possível salvar o atalho.');
  return body;
};

const save = async (shortcut: Shortcut) => {
  savingId.value = shortcut.id;
  try {
    const updated = await request(`${API}/${shortcut.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyValue: shortcut.keyValue, enabled: !!shortcut.enabled }),
    });
    Object.assign(shortcut, updated);
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'Não foi possível salvar o atalho.');
    await loadShortcuts();
  } finally { savingId.value = null; }
};

const captureKey = async (event: KeyboardEvent, shortcut: Shortcut) => {
  const key = event.key === ' ' ? 'Space' : event.key === 'Esc' ? 'Escape' : normalizeShortcutKey(event.key);
  shortcut.keyValue = key;
  await save(shortcut);
};

const toggleEnabled = async (event: Event, shortcut: Shortcut) => {
  shortcut.enabled = (event.target as HTMLInputElement).checked ? 1 : 0;
  await save(shortcut);
};

onMounted(() => loadShortcuts().catch(error => window.alert(error.message)));
</script>

<style scoped>
.shortcut-management { display: flex; flex-direction: column; gap: 18px; color: #34495e; }
.help { margin: 0; }
.shortcut-group { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
.shortcut-group h3 { margin: 0; padding: 12px 16px; background: #f7fafc; }
.shortcut-row { display: grid; grid-template-columns: minmax(0, 1fr) 120px auto; align-items: center; gap: 14px; padding: 12px 16px; border-top: 1px solid #edf2f7; }
.shortcut-description { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.shortcut-description small { color: #718096; }
.shortcut-row input:not([type=checkbox]) { width: 100%; padding: 8px; text-align: center; border: 1px solid #cbd5e0; border-radius: 4px; font-weight: 600; }
.enabled { white-space: nowrap; }
@media (max-width: 600px) { .shortcut-row { grid-template-columns: 1fr 90px; } .enabled { grid-column: 1 / -1; } }
</style>
