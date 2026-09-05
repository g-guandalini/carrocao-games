<template>
  <section class="hid-management">
    <p class="help">Os controles conectados são detectados automaticamente. Para mapear, clique em capturar, aperte o botão físico e escolha a equipe correspondente.</p>

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
        <div class="team-select-wrapper">
          <span class="team-select-swatch" :class="`team-${mappingForm.outputTeam}`" aria-hidden="true"></span>
          <select v-model="mappingForm.outputTeam" class="team-select" aria-label="Equipe do mapeamento" required>
            <option value="blue">Azul</option><option value="red">Vermelho</option><option value="green">Verde</option><option value="yellow">Amarelo</option>
          </select>
        </div>
        <label><input v-model="mappingForm.enabled" type="checkbox" /> Ativo</label>
        <div><button class="primary">Salvar mapeamento</button><button v-if="editingMapping" type="button" @click="resetMapping">Cancelar</button></div>
      </form>
    </div>

    <div class="card table-card"><h3>Dispositivos</h3><table><thead><tr><th>Nome</th><th>Identificador</th><th>Status</th><th></th></tr></thead><tbody><tr v-for="device in devices" :key="device.id"><td>{{ device.name }}</td><td>{{ device.identifier || 'Qualquer' }}</td><td><span :class="['status-icon', device.enabled ? 'success' : 'error']">{{ device.enabled ? '✓' : '✕' }}</span></td><td class="actions"><button class="btn-icon btn-edit" title="Editar dispositivo" aria-label="Editar dispositivo" @click="editDevice(device)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg></button><button class="btn-icon btn-delete" title="Excluir dispositivo" aria-label="Excluir dispositivo" @click="deleteDevice(device.id)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                  <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1h2.5a1 1 0 0 1 1 1v1zM.5 2a.5.5 0 0 0 0 1H1V4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3h.5a.5.5 0 0 0 0-1H.5zM12 4H4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4z"/>
                </svg></button></td></tr><tr v-if="!devices.length"><td colspan="4">Nenhum dispositivo cadastrado.</td></tr></tbody></table></div>
    <div class="card table-card"><h3>Mapeamentos</h3><table><thead><tr><th>Nome</th><th>Dispositivo</th><th>Entrada</th><th>Equipe</th><th>Status</th><th></th></tr></thead><tbody><tr v-for="mapping in mappings" :key="mapping.id"><td>{{ mapping.name }}</td><td>{{ mapping.deviceName || 'Qualquer' }}</td><td><code>{{ mapping.input_code }}</code></td><td><span class="team-color-block" :class="`team-${mapping.outputTeam}`" :title="teamLabel(mapping.outputTeam)" :aria-label="teamLabel(mapping.outputTeam)"></span></td><td><span :class="['status-icon', mapping.enabled ? 'success' : 'error']">{{ mapping.enabled ? '✓' : '✕' }}</span></td><td class="actions"><button class="btn-icon btn-edit" title="Editar mapeamento" aria-label="Editar mapeamento" @click="editMapping(mapping)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg></button><button class="btn-icon btn-delete" title="Excluir mapeamento" aria-label="Excluir mapeamento" @click="deleteMapping(mapping.id)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                  <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1h2.5a1 1 0 0 1 1 1v1zM.5 2a.5.5 0 0 0 0 1H1V4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3h.5a.5.5 0 0 0 0-1H.5zM12 4H4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4z"/>
                </svg></button></td></tr><tr v-if="!mappings.length"><td colspan="6">Nenhum mapeamento cadastrado.</td></tr></tbody></table></div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';

const API = `${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/hid`;
type Device = { id: number; name: string; identifier: string | null; driver_type: string; enabled: number };
type Mapping = { id: number; device_id: number | null; name: string; input_code: string; output_key: string; outputTeam: string; enabled: number; deviceName?: string };
type DetectedDevice = { identifier: string; name: string };
const devices = ref<Device[]>([]); const mappings = ref<Mapping[]>([]); const detectedDevices = ref<DetectedDevice[]>([]);
const editingDevice = ref<number | null>(null); const editingMapping = ref<number | null>(null);
const deviceForm = reactive({ name: '', identifier: '', driverType: 'sdl', enabled: true });
const mappingForm = reactive({ deviceId: '', name: '', inputCode: '', outputTeam: 'blue', enabled: true });
const captureMode = ref<'idle' | 'input'>('idle');
const previousButtons = new Map<string, boolean[]>();
let gamepadTimer: ReturnType<typeof setInterval> | null = null;
const captureLabel = computed(() => captureMode.value === 'input' ? 'Aperte o botão...' : 'Capturar entrada');
const request = async (url: string, options?: RequestInit) => { const response = await fetch(url, options); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Erro na operação.'); return body; };
const load = async () => { devices.value = await request(`${API}/devices`); mappings.value = await request(`${API}/mappings`); };
const findSavedDevice = (identifier: string) => devices.value.find(device => device.identifier === identifier);
const saveDetectedDevice = async (device: DetectedDevice) => { await request(`${API}/devices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: device.name, identifier: device.identifier, driverType: 'sdl' }) }); await load(); };
const saveDevice = async () => { await request(`${API}/devices${editingDevice.value ? `/${editingDevice.value}` : ''}`, { method: editingDevice.value ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deviceForm) }); resetDevice(); await load(); };
const saveMapping = async () => { await request(`${API}/mappings${editingMapping.value ? `/${editingMapping.value}` : ''}`, { method: editingMapping.value ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...mappingForm, deviceId: mappingForm.deviceId || null }) }); resetMapping(); await load(); };
const editDevice = (device: Device) => { editingDevice.value = device.id; Object.assign(deviceForm, { name: device.name, identifier: device.identifier || '', driverType: device.driver_type, enabled: !!device.enabled }); };
const editMapping = (mapping: Mapping) => { editingMapping.value = mapping.id; Object.assign(mappingForm, { deviceId: mapping.device_id ? String(mapping.device_id) : '', name: mapping.name, inputCode: mapping.input_code, outputTeam: mapping.outputTeam || 'blue', enabled: !!mapping.enabled }); };
const resetDevice = () => { editingDevice.value = null; Object.assign(deviceForm, { name: '', identifier: '', driverType: 'sdl', enabled: true }); };
const resetMapping = () => { editingMapping.value = null; Object.assign(mappingForm, { deviceId: '', name: '', inputCode: '', outputTeam: 'blue', enabled: true }); captureMode.value = 'idle'; };
const deleteDevice = async (id: number) => { if (window.confirm('Excluir este dispositivo e seus mapeamentos?')) { await request(`${API}/devices/${id}`, { method: 'DELETE' }); await load(); } };
const deleteMapping = async (id: number) => { if (window.confirm('Excluir este mapeamento?')) { await request(`${API}/mappings/${id}`, { method: 'DELETE' }); await load(); } };
const teamLabel = (team: string) => ({ blue: 'Azul', red: 'Vermelho', green: 'Verde', yellow: 'Amarelo' }[team] || 'Equipe');
const toggleCapture = () => { captureMode.value = captureMode.value === 'idle' ? 'input' : 'idle'; };
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
        captureMode.value = 'idle';
      }
    });
    previousButtons.set(pad.id, pad.buttons.map(button => button.pressed));
  }
};
onMounted(() => { load().catch(error => window.alert(error.message)); gamepadTimer = setInterval(pollGamepads, 100); });
onUnmounted(() => { if (gamepadTimer) clearInterval(gamepadTimer); });
</script>

<style scoped>
.hid-management { display: flex; flex-direction: column; gap: 18px; color: #34495e; }.help { margin: 0; }.forms-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }.card { display: flex; flex-direction: column; gap: 10px; padding: 18px; border: 1px solid #e2e8f0; border-radius: 8px; }.card h3 { margin: 0 0 4px; }.card input:not([type=checkbox]), .card select { padding: 9px; border: 1px solid #cbd5e0; border-radius: 4px; }.card button { width: fit-content; padding: 8px 12px; border: 0; border-radius: 4px; cursor: pointer; }.primary { background: #2c7a7b; color: white; }.danger { color: #c53030; margin-left: 6px; }.capture-row { display: flex; gap: 8px; }.capture-row input { min-width: 0; flex: 1; }.capture-row .capturing { background: #c53030; color: white; }.detected-device { display: flex; align-items: center; gap: 12px; padding: 8px 0; }.detected-device small { color: #718096; flex: 1; }.detected-ok { color: #2f855a; }.table-card { overflow-x: auto; } table { width: 100%; border-collapse: collapse; } th, td { padding: 9px; text-align: left; border-bottom: 1px solid #edf2f7; } code { background: #edf2f7; padding: 2px 4px; border-radius: 3px; }
.team-color-block { display: inline-block; width: 34px; height: 24px; border-radius: 5px; border: 1px solid rgba(0, 0, 0, 0.15); box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.25); vertical-align: middle; }
.team-blue { background: #3498db; }.team-red { background: #e74c3c; }.team-green { background: #2ecc71; }.team-yellow { background: #f1c40f; }
.team-select-wrapper { position: relative; width: 100%; }
.team-select { width: 100%; padding-left: 54px !important; color: transparent; background: #fff; font-weight: 600; }
.team-select option { color: #34495e; background: #fff; }
.team-select-swatch { position: absolute; z-index: 1; left: 12px; top: 50%; width: 30px; height: 20px; border-radius: 4px; border: 1px solid rgba(0, 0, 0, 0.18); transform: translateY(-50%); pointer-events: none; }
.actions { white-space: nowrap; }.btn-icon { background: none !important; border: none; cursor: pointer; padding: 5px !important; margin: 0 2px; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 4px; }
.btn-icon svg { width: 16px; height: 16px; }.btn-edit { color: #ffc107; }.btn-edit:hover { background: #ffedb8 !important; color: #e0a800; }.btn-edit svg { fill: #ffc107; }.btn-delete { color: #dc3545; }.btn-delete:hover { background: #f5c6cb !important; color: #c82333; }.btn-delete svg { fill: #dc3545; }
.status-icon { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; font-weight: 700; }.status-icon.success { color: #1e7e34; background: #d4edda; }.status-icon.error { color: #c82333; background: #f5c6cb; }
</style>
