"""Controlador unificado para botoeiras HID e controles Xbox/PS2 via SDL.

As entradas são lidas pelo Pygame e os mapeamentos são carregados do SQLite
através da API local do Carroção Games.
"""
import json
import os
import time
import urllib.request

import pygame
from pynput.keyboard import Controller, Key

API_URL = os.environ.get("CARROCAO_HID_API", "http://127.0.0.1:3001/api/hid/config")
keyboard = Controller()
pressed = {}


def load_mappings():
    with urllib.request.urlopen(API_URL, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


def key_object(value):
    return getattr(Key, value) if isinstance(value, str) and hasattr(Key, value) else value


def device_identifier(joystick):
    try:
        return joystick.get_guid()
    except (AttributeError, pygame.error):
        return joystick.get_name()


def matching_mapping(mappings, identifier, name, input_code):
    candidates = [m for m in mappings if m.get("inputCode") == input_code]
    exact = [m for m in candidates if m.get("deviceIdentifier") and m["deviceIdentifier"] == identifier]
    if exact:
        return exact[0]
    normalized_name = name.casefold()
    named = [m for m in candidates if m.get("deviceName") and (
        normalized_name in m["deviceName"].casefold() or
        m["deviceName"].casefold() in normalized_name
    )]
    return named[0] if named else next((m for m in candidates if not m.get("deviceIdentifier") and not m.get("deviceName")), None)


def main():
    try:
        mappings = load_mappings()
    except Exception as error:
        print(f"Não foi possível carregar os mapeamentos do Carroção Games: {error}")
        return 1

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
            for event in pygame.event.get():
                if event.type == pygame.JOYDEVICEADDED:
                    register(event.device_index)
                elif event.type == pygame.JOYDEVICEREMOVED:
                    devices.pop(event.instance_id, None)
                elif event.type == pygame.JOYBUTTONDOWN:
                    joystick = devices.get(event.instance_id)
                    if not joystick:
                        continue
                    mapping = matching_mapping(mappings, device_identifier(joystick), joystick.get_name(), f"button:{event.button}")
                    if mapping and mapping["id"] not in pressed:
                        key = key_object(mapping["outputKey"])
                        keyboard.press(key)
                        pressed[mapping["id"]] = key
                elif event.type == pygame.JOYBUTTONUP:
                    joystick = devices.get(event.instance_id)
                    if not joystick:
                        continue
                    mapping = matching_mapping(mappings, device_identifier(joystick), joystick.get_name(), f"button:{event.button}")
                    if mapping and mapping["id"] in pressed:
                        keyboard.release(pressed.pop(mapping["id"]))
            time.sleep(0.005)
    except KeyboardInterrupt:
        return 0
    finally:
        for key in pressed.values():
            keyboard.release(key)
        pygame.quit()


if __name__ == "__main__":
    raise SystemExit(main())
