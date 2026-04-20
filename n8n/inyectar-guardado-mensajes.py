#!/usr/bin/env python3
"""
Añade UN SOLO nodo de guardado al flow de WhatsApp, colgado como segunda
salida del TWILIO WEBHOOK. Ese nodo captura todos los mensajes ENTRANTES
y los envía al backend para alimentar las estadísticas.

Los mensajes salientes (respuestas del bot) NO se guardan en la BD:
el hilo completo se consulta en vivo a Twilio desde el dashboard.

Uso:
  export N8N_API_KEY=<misma clave que el backend>
  export BACKEND_URL=https://sopo.jfv2a2.easypanel.host/api/whatsapp/mensaje  # opcional
  python3 n8n/inyectar-guardado-mensajes.py

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
API_KEY = os.environ.get("N8N_API_KEY")
if not API_KEY:
    sys.exit("Falta la variable de entorno N8N_API_KEY (misma que usa el backend)")


def nuevo_id():
    return str(uuid.uuid4())


def body_entrante():
    """Body JSON para guardar mensajes entrantes desde el TWILIO WEBHOOK."""
    return (
        '={\n'
        '  "direccion": "in",\n'
        '  "message_sid": "{{ $json.body.MessageSid }}",\n'
        '  "from": "{{ $json.body.From }}",\n'
        '  "to": "{{ $json.body.To }}",\n'
        '  "body": {{ JSON.stringify($json.body.Body || "") }},\n'
        '  "num_media": {{ parseInt($json.body.NumMedia || "0") }},\n'
        '  "media_content_type": "{{ $json.body.MediaContentType0 || \'\' }}",\n'
        '  "status": "received"\n'
        '}'
    )


def nodo_guardado(name, position):
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
            "jsonBody": body_entrante(),
            "options": {},
        },
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.3,
        "position": position,
        "id": nuevo_id(),
        "name": name,
        "continueOnFail": True,
        "onError": "continueRegularOutput",
    }


def main():
    flow = json.loads(SRC.read_text())

    nodes = flow["nodes"]
    connections = flow.setdefault("connections", {})

    by_name = {n["name"]: n for n in nodes}
    webhook = by_name.get("TWILIO WEBHOOK")
    if not webhook:
        sys.exit("No se encontró el nodo TWILIO WEBHOOK")

    # Si ya hay un nodo de guardado antiguo (de la versión con fan-out), lo quitamos.
    viejos = [n for n in nodes if n["name"].startswith("GUARDAR ")]
    if viejos:
        print(f"Quitando {len(viejos)} nodos GUARDAR antiguos…")
        nombres_viejos = {n["name"] for n in viejos}
        flow["nodes"] = [n for n in nodes if n["name"] not in nombres_viejos]
        nodes = flow["nodes"]
        # También limpiamos conexiones hacia esos nodos
        for src, conf in list(connections.items()):
            if src in nombres_viejos:
                del connections[src]
                continue
            for idx, rama in enumerate(conf.get("main", [])):
                conf["main"][idx] = [c for c in rama if c.get("node") not in nombres_viejos]

    # Añadimos el único nodo de guardado entrante
    wx, wy = webhook["position"]
    guardado_in = nodo_guardado("GUARDAR MENSAJE ENTRANTE", [wx + 40, wy + 260])
    nodes.append(guardado_in)

    conn_web = connections.setdefault("TWILIO WEBHOOK", {"main": [[]]})
    if not conn_web.get("main"):
        conn_web["main"] = [[]]
    # Aseguramos que no dupliquemos si el script se corre dos veces
    conn_web["main"][0] = [c for c in conn_web["main"][0] if c.get("node") != "GUARDAR MENSAJE ENTRANTE"]
    conn_web["main"][0].append({
        "node": "GUARDAR MENSAJE ENTRANTE",
        "type": "main",
        "index": 0,
    })

    if not flow.get("name", "").endswith(" (con guardado)"):
        flow["name"] = flow.get("name", "") + " (con guardado)"

    DST.write_text(json.dumps(flow, ensure_ascii=False, indent=2))
    print(f"✅ Flow modificado: {DST}")
    print(f"   Nodos añadidos: 1 (GUARDAR MENSAJE ENTRANTE)")


if __name__ == "__main__":
    main()
