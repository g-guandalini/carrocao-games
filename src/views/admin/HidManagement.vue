<template>
  <section class="hid-management">
    <p class="help">Os controles conectados são detectados automaticamente. Para mapear, clique em capturar, aperte o botão físico e depois pressione a tecla de saída.</p>

    <div v-if="detectedDevices.length" class="card detected-card">
      <h3>Controles detectados</h3>
      <div v-for="device in detectedDevices" :key="device.identifier" class="detected-device">
        <span>{{ device.name }}</span><small>{{ device.identifier }}</small>
        <button v-if="!findSavedDevice(device.identifier)" class="primary" @click="saveDetectedDevice(device)">Cadastrar</button>
        <span v-else class="detected-ok">Cadastrado</span>
      </div>
    </div>

    <div class="forms-grid">
      <form class="card" @submit.prevent="saveDevice">
        <h3>{{ editingDevice ? 'Editar dispositivo' : 'Novo dispositivo' }}</h3>
        <input v-model="deviceForm.name" placeholder="Nome (ex.: Controle Xbox)" required />
        <input v-model="deviceForm.identifier" placeholder="GUID SDL (opcional)" />
        <select v-model="deviceForm.driverType"><option value="sdl">SDL / Pygame</option></select>
        <label><input v-model="deviceForm.enabled" type="checkbox" /> Ativo</label>
        <div><button class="primary">Salvar dispositivo</button><button v-if="editingDevice" type="button" @click="resetDevice">Cancelar</button></div>
      </form>

      <form class="card" @submit.prevent="saveMapping">
        <h3>{{ editingMapping ? 'Editar mapeamento' : 'Novo mapeamento' }}</h3>
        <input v-model="mappingForm.name" placeholder="Nome (ex.: Botão A)" required />
        <select v-model="mappingForm.deviceId"><option value="">Qualquer dispositivo</option><option v-for="device in devices" :key="device.id" :value="String(device.id)">{{ device.name }}</option></select>
        <div class="capture-row"><input v-model="mappingForm.inputCode" placeholder="Entrada (ex.: button:0)" required /><button type="button" @click="toggleCapture" :class="{ capturing: captureMode !== 'idle' }">{{ captureLabel }}</button></div>
        <input v-model="mappingForm.outputKey" placeholder="Tecla de saída (ex.: 1)" required />
        <label><input v-model="mappingForm.enabled" type="checkbox" /> Ativo</label>
        <div><button class="primary">Salvar mapeamento</button><button v-if="editingMapping" type="button" @click="resetMapping">Cancelar</button></div>
      </form>
    </div>

    <div class="card table-card"><h3>Dispositivos</h3><table><thead><tr><th>Nome</th><th>Identificador</th><th>Status</th><th></th></tr></thead><tbody><tr v-for="device in devices" :key="device.id"><td>{{ device.name }}</td><td>{{ device.identifier || 'Qualquer' }}</td><td>{{ device.enabled ? 'Ativo' : 'Inativo' }}</td><td><button @click="editDevice(device)">Editar</button><button class="danger" @click="deleteDevice(device.id)">Excluir</button></td></tr><tr v-if="!devices.length"><td colspan="4">Nenhum dispositivo cadastrado.</td></tr></tbody></table></div>
    <div class="card table-card"><h3>Mapeamentos</h3><table><thead><tr><th>Nome</th><th>Dispositivo</th><th>Entrada</th><th>Tecla</th><th>Status</th><th></th></tr></thead><tbody><tr v-for="mapping in mappings" :key="mapping.id"><td>{{ mapping.name }}</td><td>{{ mapping.deviceName || 'Qualquer' }}</td><td><code>{{ mapping.input_code }}</code></td><td><code>{{ mapping.output_key }}</code></td><td>{{ mapping.enabled ? 'Ativo' : 'Inativo' }}</td><td><button @click="editMapping(mapping)">Editar</button><button class="danger" @click="deleteMapping(mapping.id)">Excluir</button></td></tr><tr v-if="!mappings.length"><td colspan="6">Nenhum mapeamento cadastrado.</td></tr></tbody></table></div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';

const API = `${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/hid`;
type Device = { id: number; name: string; identifier: string | null; driver_type: string; enabled: number };
type Mapping = { id: number; device_id: number | null; name: string; input_code: string; output_key: string; enabled: number; deviceName?: string };
type DetectedDevice = { identifier: string; name: string };
const devices = ref<Device[]>([]); const mappings = ref<Mapping[]>([]); const detectedDevices = ref<DetectedDevice[]>([]);
const editingDevice = ref<number | null>(null); const editingMapping = ref<number | null>(null);
const deviceForm = reactive({ name: '', identifier: '', driverType: 'sdl', enabled: true });
const mappingForm = reactive({ deviceId: '', name: '', inputCode: '', outputKey: '', enabled: true });
const captureMode = ref<'idle' | 'input' | 'output'>('idle');
const previousButtons = new Map<string, boolean[]>();
let gamepadTimer: ReturnType<typeof setInterval> | null = null;
const captureLabel = computed(() => captureMode.value === 'input' ? 'Aperte o botão...' : captureMode.value === 'output' ? 'Pressione a tecla...' : 'Capturar entrada');
const request = async (url: string, options?: RequestInit) => { const response = await fetch(url, options); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Erro na operação.'); return body; };
const load = async () => { devices.value = await request(`${API}/devices`); mappings.value = await request(`${API}/mappings`); };
const findSavedDevice = (identifier: string) => devices.value.find(device => device.identifier === identifier);
const saveDetectedDevice = async (device: DetectedDevice) => { await request(`${API}/devices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: device.name, identifier: device.identifier, driverType: 'sdl' }) }); await load(); };
const saveDevice = async () => { await request(`${API}/devices${editingDevice.value ? `/${editingDevice.value}` : ''}`, { method: editingDevice.value ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deviceForm) }); resetDevice(); await load(); };
const saveMapping = async () => { await request(`${API}/mappings${editingMapping.value ? `/${editingMapping.value}` : ''}`, { method: editingMapping.value ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...mappingForm, deviceId: mappingForm.deviceId || null }) }); resetMapping(); await load(); };
const editDevice = (device: Device) => { editingDevice.value = device.id; Object.assign(deviceForm, { name: device.name, identifier: device.identifier || '', driverType: device.driver_type, enabled: !!device.enabled }); };
const editMapping = (mapping: Mapping) => { editingMapping.value = mapping.id; Object.assign(mappingForm, { deviceId: mapping.device_id ? String(mapping.device_id) : '', name: mapping.name, inputCode: mapping.input_code, outputKey: mapping.output_key, enabled: !!mapping.enabled }); };
const resetDevice = () => { editingDevice.value = null; Object.assign(deviceForm, { name: '', identifier: '', driverType: 'sdl', enabled: true }); };
const resetMapping = () => { editingMapping.value = null; Object.assign(mappingForm, { deviceId: '', name: '', inputCode: '', outputKey: '', enabled: true }); captureMode.value = 'idle'; };
const deleteDevice = async (id: number) => { if (window.confirm('Excluir este dispositivo e seus mapeamentos?')) { await request(`${API}/devices/${id}`, { method: 'DELETE' }); await load(); } };
const deleteMapping = async (id: number) => { if (window.confirm('Excluir este mapeamento?')) { await request(`${API}/mappings/${id}`, { method: 'DELETE' }); await load(); } };
const toggleCapture = () => { captureMode.value = captureMode.value === 'idle' ? 'input' : 'idle'; };
const captureOutput = (event: KeyboardEvent) => { if (captureMode.value !== 'output') return; event.preventDefault(); event.stopPropagation(); mappingForm.outputKey = event.key; captureMode.value = 'idle'; window.removeEventListener('keydown', captureOutput, true); };
const pollGamepads = () => {
  const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) as Gamepad[] : [];
  detectedDevices.value = pads.map(pad => ({ identifier: pad.id, name: pad.id }));
  for (const pad of pads) {
    const previous = previousButtons.get(pad.id) || [];
    pad.buttons.forEach((button, index) => {
      if (button.pressed && !previous[index] && captureMode.value === 'input') {
        const saved = findSavedDevice(pad.id);
        if (saved) mappingForm.deviceId = String(saved.id);
        mappingForm.inputCode = `button:${index}`;
        mappingForm.name = mappingForm.name || `Botão ${index}`;
        captureMode.value = 'output';
        window.addEventListener('keydown', captureOutput, true);
      }
    });
    previousButtons.set(pad.id, pad.buttons.map(button => button.pressed));
  }
};
onMounted(() => { load().catch(error => window.alert(error.message)); gamepadTimer = setInterval(pollGamepads, 100); });
onUnmounted(() => { if (gamepadTimer) clearInterval(gamepadTimer); window.removeEventListener('keydown', captureOutput, true); });
</script>

<style scoped>
.hid-management { display: flex; flex-direction: column; gap: 18px; color: #34495e; }.help { margin: 0; }.forms-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }.card { display: flex; flex-direction: column; gap: 10px; padding: 18px; border: 1px solid #e2e8f0; border-radius: 8px; }.card h3 { margin: 0 0 4px; }.card input:not([type=checkbox]), .card select { padding: 9px; border: 1px solid #cbd5e0; border-radius: 4px; }.card button { width: fit-content; padding: 8px 12px; border: 0; border-radius: 4px; cursor: pointer; }.primary { background: #2c7a7b; color: white; }.danger { color: #c53030; margin-left: 6px; }.capture-row { display: flex; gap: 8px; }.capture-row input { min-width: 0; flex: 1; }.capture-row .capturing { background: #c53030; color: white; }.detected-device { display: flex; align-items: center; gap: 12px; padding: 8px 0; }.detected-device small { color: #718096; flex: 1; }.detected-ok { color: #2f855a; }.table-card { overflow-x: auto; } table { width: 100%; border-collapse: collapse; } th, td { padding: 9px; text-align: left; border-bottom: 1px solid #edf2f7; } code { background: #edf2f7; padding: 2px 4px; border-radius: 3px; }
</style>
