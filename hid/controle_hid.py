"""Controlador unificado para botoeiras HID e controles Xbox/PS2 via SDL.

As entradas são lidas pelo Pygame e os mapeamentos são carregados do SQLite
através da API local do Carroção Games.
"""
import json
import os
import time
import urllib.request
import urllib.error

import pygame

API_URL = os.environ.get("CARROCAO_HID_API", "http://127.0.0.1:3001/api/hid/config")
pressed = set()


def load_mappings():
    with urllib.request.urlopen(API_URL, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


def send_key_event(key):
    payload = json.dumps({'key': key}).encode('utf-8')
    request = urllib.request.Request(
        API_URL.replace('/api/hid/config', '/api/hid/events'),
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(request, timeout=2):
        return


def device_identifier(joystick):
    try:
        return joystick.get_guid()
    except (AttributeError, pygame.error):
        return joystick.get_name()


def matching_mapping(mappings, identifier, name, input_code):
    candidates = [m for m in mappings if m.get("inputCode") == input_code]
    # A tela de administração identifica o controle pela Gamepad API do
    # navegador, enquanto o Pygame fornece o GUID SDL. Eles não são o mesmo
    # valor, mesmo quando representam o mesmo controle. Quando há somente um
    # mapeamento para essa entrada, ele é seguro e deve ser usado como fallback.
    exact = [m for m in candidates if m.get("deviceIdentifier") and m["deviceIdentifier"] == identifier]
    if exact:
        return exact[0]
    normalized_name = name.casefold()
    named = [m for m in candidates if m.get("deviceName") and (
        normalized_name in m["deviceName"].casefold() or
        m["deviceName"].casefold() in normalized_name
    )]
    if named:
        return named[0]
    generic = next((m for m in candidates if not m.get("deviceIdentifier") and not m.get("deviceName")), None)
    return generic or (candidates[0] if len(candidates) == 1 else None)


def joystick_for_event(event, devices):
    """Resolve eventos SDL novos e antigos para o joystick correspondente."""
    instance_id = getattr(event, "instance_id", None)
    joystick = devices.get(instance_id)
    if joystick:
        return joystick

    # Pygame 1.x/alguns drivers expõem o índice em `joy`, não `instance_id`.
    joy_index = getattr(event, "joy", None)
    if joy_index is not None:
        for candidate in devices.values():
            if getattr(candidate, "get_id", lambda: None)() == joy_index:
                return candidate
    return None


def main():
    try:
        mappings = load_mappings()
    except Exception as error:
        print(f"Não foi possível carregar os mapeamentos do Carroção Games: {error}")
        return 1
    last_mapping_reload = time.monotonic()

    pygame.init()
    pygame.joystick.init()
    devices = {}

    def register(index):
        joystick = pygame.joystick.Joystick(index)
        joystick.init()
        instance_id = joystick.get_instance_id()
        devices[instance_id] = joystick
        print(f"Dispositivo detectado: {joystick.get_name()} ({device_identifier(joystick)})")

    for index in range(pygame.joystick.get_count()):
        register(index)

    print("Controlador HID ativo. Pressione Ctrl+C para encerrar.")
    try:
        while True:
            if time.monotonic() - last_mapping_reload >= 2:
                try:
                    mappings = load_mappings()
                    last_mapping_reload = time.monotonic()
                except Exception as error:
                    # Mantém a última configuração válida se o backend estiver
                    # momentaneamente indisponível.
                    print(f"Não foi possível atualizar os mapeamentos: {error}")
            for event in pygame.event.get():
                if event.type == pygame.JOYDEVICEADDED:
                    register(event.device_index)
                elif event.type == pygame.JOYDEVICEREMOVED:
                    devices.pop(event.instance_id, None)
                elif event.type == pygame.JOYBUTTONDOWN:
                    joystick = joystick_for_event(event, devices)
                    if not joystick:
                        continue
                    mapping = matching_mapping(mappings, device_identifier(joystick), joystick.get_name(), f"button:{event.button}")
                    if mapping and mapping["id"] not in pressed:
                        print(f"Botão {event.button}: equipe {mapping['outputKey']} -> evento interno")
                        try:
                            send_key_event(mapping["outputKey"])
                        except (OSError, urllib.error.URLError) as error:
                            print(f"Não foi possível enviar o evento da botoeira: {error}")
                        pressed.add(mapping["id"])
                elif event.type == pygame.JOYBUTTONUP:
                    joystick = joystick_for_event(event, devices)
                    if not joystick:
                        continue
                    mapping = matching_mapping(mappings, device_identifier(joystick), joystick.get_name(), f"button:{event.button}")
                    if mapping:
                        pressed.discard(mapping["id"])
            time.sleep(0.005)
    except KeyboardInterrupt:
        return 0
    finally:
        pressed.clear()
        pygame.quit()


if __name__ == "__main__":
    raise SystemExit(main())
