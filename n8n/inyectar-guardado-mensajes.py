#!/usr/bin/env python3
"""
Modifica el flow de WhatsApp para guardar cada mensaje (entrante y saliente)
en el backend via POST /api/whatsapp/mensaje.

Estrategia: fan-out paralelo. Los nodos de guardado se conectan como
SEGUNDA salida de TWILIO WEBHOOK (entrantes) y de cada ENVIAR* (salientes).
Si el guardado falla, el flow del bot no se ve afectado.

Input:  n8n/flujo-whatsapp.json
Output: n8n/flujo-whatsapp-modificado.json
"""

import json
import os
import sys
import uuid
from pathlib import Path

SRC = Path(__file__).parent / "flujo-whatsapp.json"
DST = Path(__file__).parent / "flujo-whatsapp-modificado.json"

BACKEND_URL = os.environ.get(
    "BACKEND_URL",
    "https://sopo.jfv2a2.easypanel.host/api/whatsapp/mensaje",
)
# La API key debe coincidir con N8N_API_KEY del backend (ver .env.example).
# Exportar antes de correr el script: export N8N_API_KEY=...
API_KEY = os.environ.get("N8N_API_KEY")
if not API_KEY:
    sys.exit("Falta la variable de entorno N8N_API_KEY (misma que usa el backend)")


def nuevo_id():
    return str(uuid.uuid4())


def nodo_guardado(name, position, body_json_expr):
    """Crea un nodo HTTP Request que llama al endpoint de guardado."""
    return {
        "parameters": {
            "method": "POST",
            "url": BACKEND_URL,
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [
                    {"name": "X-API-Key", "value": API_KEY},
                    {"name": "Content-Type", "value": "application/json"},
                ]
            },
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": body_json_expr,
            "options": {},
        },
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.3,
        "position": position,
        "id": nuevo_id(),
        "name": name,
        # Que los fallos no interrumpan el flujo
        "continueOnFail": True,
        "onError": "continueRegularOutput",
    }


def body_entrante():
    """Body JSON para guardar mensajes entrantes (desde TWILIO WEBHOOK)."""
    return (
        '={\n'
        '  "direccion": "in",\n'
        '  "message_sid": "{{ $json.body.MessageSid }}",\n'
        '  "from": "{{ $json.body.From }}",\n'
        '  "to": "{{ $json.body.To }}",\n'
        '  "body": {{ JSON.stringify($json.body.Body || "") }},\n'
        '  "num_media": {{ parseInt($json.body.NumMedia || "0") }},\n'
        '  "media_url": "{{ $json.body.MediaUrl0 || \'\' }}",\n'
        '  "media_content_type": "{{ $json.body.MediaContentType0 || \'\' }}",\n'
        '  "status": "received"\n'
        '}'
    )


def body_saliente():
    """Body JSON para guardar mensajes salientes (respuesta de Twilio API)."""
    return (
        '={\n'
        '  "direccion": "out",\n'
        '  "message_sid": "{{ $json.sid || \'\' }}",\n'
        '  "from": "{{ $json.from || \'\' }}",\n'
        '  "to": "{{ $json.to || \'\' }}",\n'
        '  "body": {{ JSON.stringify($json.body || "") }},\n'
        '  "num_media": 0,\n'
        '  "status": "{{ $json.status || \'sent\' }}"\n'
        '}'
    )


def es_twilio_messages(node):
    """True si el nodo envía un mensaje vía Twilio API (POST a Messages.json)."""
    params = node.get("parameters", {})
    if node.get("type") != "n8n-nodes-base.httpRequest":
        return False
    url = str(params.get("url", ""))
    return "api.twilio.com" in url and "/Messages.json" in url


def main():
    flow = json.loads(SRC.read_text())

    nodes = flow["nodes"]
    connections = flow.setdefault("connections", {})

    # Mapa rápido: nombre → nodo
    by_name = {n["name"]: n for n in nodes}

    # ── 1. Guardado entrante (fan-out de TWILIO WEBHOOK) ─────────────────
    webhook = by_name.get("TWILIO WEBHOOK")
    if not webhook:
        sys.exit("No se encontró el nodo TWILIO WEBHOOK")

    wx, wy = webhook["position"]
    guardado_in = nodo_guardado(
        "GUARDAR MENSAJE ENTRANTE",
        [wx + 40, wy + 260],
        body_entrante(),
    )
    nodes.append(guardado_in)

    # Añadir como segunda salida paralela del webhook
    conn_web = connections.setdefault("TWILIO WEBHOOK", {"main": [[]]})
    if not conn_web["main"]:
        conn_web["main"] = [[]]
    conn_web["main"][0].append({
        "node": "GUARDAR MENSAJE ENTRANTE",
        "type": "main",
        "index": 0,
    })

    # ── 2. Guardado saliente (fan-out de cada nodo Twilio sender) ────────
    salientes = [n for n in nodes if es_twilio_messages(n)]
    print(f"Nodos Twilio de envío encontrados: {len(salientes)}")

    for i, sender in enumerate(salientes, 1):
        sx, sy = sender["position"]
        nombre_save = f"GUARDAR SALIENTE {i:02d}"
        save_node = nodo_guardado(
            nombre_save,
            [sx + 20, sy + 180],
            body_saliente(),
        )
        nodes.append(save_node)

        conn_sender = connections.setdefault(sender["name"], {"main": [[]]})
        if not conn_sender.get("main"):
            conn_sender["main"] = [[]]
        # Asegurar que existe al menos la primera rama
        while len(conn_sender["main"]) < 1:
            conn_sender["main"].append([])
        conn_sender["main"][0].append({
            "node": nombre_save,
            "type": "main",
            "index": 0,
        })
        print(f"  ✓ {sender['name']:35s} → {nombre_save}")

    # Renombrar para evitar conflicto al importar
    flow["name"] = flow.get("name", "") + " (con guardado)"

    DST.write_text(json.dumps(flow, ensure_ascii=False, indent=2))
    print(f"\n✅ Flow modificado guardado en: {DST}")
    print(f"   Total de nodos añadidos: {1 + len(salientes)}")


if __name__ == "__main__":
    main()
