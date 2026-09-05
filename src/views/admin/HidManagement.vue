<template>
  <section class="hid-management">
    <p class="help">Cadastre os controles e associe cada entrada a uma tecla do jogo. Use <code>button:0</code>, <code>button:1</code> etc. para botões SDL.</p>

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
        <input v-model="mappingForm.inputCode" placeholder="Entrada (ex.: button:0)" required />
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
import { onMounted, reactive, ref } from 'vue';

const API = `${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/hid`;
type Device = { id: number; name: string; identifier: string | null; driver_type: string; enabled: number };
type Mapping = { id: number; device_id: number | null; name: string; input_code: string; output_key: string; enabled: number; deviceName?: string };
const devices = ref<Device[]>([]); const mappings = ref<Mapping[]>([]);
const editingDevice = ref<number | null>(null); const editingMapping = ref<number | null>(null);
const deviceForm = reactive({ name: '', identifier: '', driverType: 'sdl', enabled: true });
const mappingForm = reactive({ deviceId: '', name: '', inputCode: '', outputKey: '', enabled: true });
const request = async (url: string, options?: RequestInit) => { const response = await fetch(url, options); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Erro na operação.'); return body; };
const load = async () => { devices.value = await request(`${API}/devices`); mappings.value = await request(`${API}/mappings`); };
const saveDevice = async () => { await request(`${API}/devices${editingDevice.value ? `/${editingDevice.value}` : ''}`, { method: editingDevice.value ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deviceForm) }); resetDevice(); await load(); };
const saveMapping = async () => { await request(`${API}/mappings${editingMapping.value ? `/${editingMapping.value}` : ''}`, { method: editingMapping.value ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...mappingForm, deviceId: mappingForm.deviceId || null }) }); resetMapping(); await load(); };
const editDevice = (device: Device) => { editingDevice.value = device.id; Object.assign(deviceForm, { name: device.name, identifier: device.identifier || '', driverType: device.driver_type, enabled: !!device.enabled }); };
const editMapping = (mapping: Mapping) => { editingMapping.value = mapping.id; Object.assign(mappingForm, { deviceId: mapping.device_id ? String(mapping.device_id) : '', name: mapping.name, inputCode: mapping.input_code, outputKey: mapping.output_key, enabled: !!mapping.enabled }); };
const resetDevice = () => { editingDevice.value = null; Object.assign(deviceForm, { name: '', identifier: '', driverType: 'sdl', enabled: true }); };
const resetMapping = () => { editingMapping.value = null; Object.assign(mappingForm, { deviceId: '', name: '', inputCode: '', outputKey: '', enabled: true }); };
const deleteDevice = async (id: number) => { if (window.confirm('Excluir este dispositivo e seus mapeamentos?')) { await request(`${API}/devices/${id}`, { method: 'DELETE' }); await load(); } };
const deleteMapping = async (id: number) => { if (window.confirm('Excluir este mapeamento?')) { await request(`${API}/mappings/${id}`, { method: 'DELETE' }); await load(); } };
onMounted(() => load().catch(error => window.alert(error.message)));
</script>

<style scoped>
.hid-management { display: flex; flex-direction: column; gap: 18px; color: #34495e; }.help { margin: 0; }.forms-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }.card { display: flex; flex-direction: column; gap: 10px; padding: 18px; border: 1px solid #e2e8f0; border-radius: 8px; }.card h3 { margin: 0 0 4px; }.card input:not([type=checkbox]), .card select { padding: 9px; border: 1px solid #cbd5e0; border-radius: 4px; }.card button { width: fit-content; padding: 8px 12px; border: 0; border-radius: 4px; cursor: pointer; }.primary { background: #2c7a7b; color: white; }.danger { color: #c53030; margin-left: 6px; }.table-card { overflow-x: auto; } table { width: 100%; border-collapse: collapse; } th, td { padding: 9px; text-align: left; border-bottom: 1px solid #edf2f7; } code { background: #edf2f7; padding: 2px 4px; border-radius: 3px; }
</style>
