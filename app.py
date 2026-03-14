from flask import Flask, render_template, Response, request
import requests
import socket
import time
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

app = Flask(__name__)

BLACK_URL = "https://raw.githubusercontent.com/igareck/vpn-configs-for-russia/main/BLACK_VLESS_RUS.txt"
WHITE_URL = "https://raw.githubusercontent.com/igareck/vpn-configs-for-russia/main/WHITE-CIDR-RU-checked.txt"

MAX_WORKERS = 15
TEST_TIMEOUT = 5
MAX_LATENCY_MS = 2000


def fetch_keys(url, mode="black"):
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    lines = resp.text.strip().splitlines()
    keys = [line.strip() for line in lines if line.strip().startswith("vless://")]

    if mode == "white":
        keys = [k for k in keys if "russia" not in k.lower()]
    elif mode == "russia":
        keys = [k for k in keys if "russia" in k.lower()]

    return keys


def parse_host_port(key):
    try:
        without_scheme = key[len("vless://"):]
        at_idx = without_scheme.rfind("@")
        after_at = without_scheme[at_idx + 1:]
        host_port = after_at.split("?")[0].split("#")[0]
        if ":" in host_port:
            host, port = host_port.rsplit(":", 1)
            return host.strip("[]"), int(port)
    except Exception:
        pass
    return None, None


def test_key(key):
    host, port = parse_host_port(key)
    if not host:
        return None
    start = time.time()
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(TEST_TIMEOUT)
        result = sock.connect_ex((host, port))
        sock.close()
        elapsed = round((time.time() - start) * 1000, 1)
        if result == 0 and elapsed <= MAX_LATENCY_MS:
            return {"key": key, "host": host, "port": port, "latency_ms": elapsed}
    except Exception:
        pass
    return None


def stream_check(mode):
    labels = {
        "black": "обычного VPN (BLACK)",
        "white": "белых списков (без Russia)",
        "russia": "Москвы/Russia (белые списки)",
    }
    label = labels.get(mode, mode)
    yield "data: " + json.dumps({"type": "status", "msg": "Загружаем ключи с GitHub..."}) + "\n\n"

    url = BLACK_URL if mode == "black" else WHITE_URL
    try:
        keys = fetch_keys(url, mode)
    except Exception as e:
        yield "data: " + json.dumps({"type": "error", "msg": str(e)}) + "\n\n"
        return

    total = len(keys)
    if total == 0:
        yield "data: " + json.dumps({"type": "done", "best": None, "top5": [], "total_working": 0, "total": 0}) + "\n\n"
        return

    yield "data: " + json.dumps({"type": "status", "msg": "Найдено " + str(total) + " ключей для " + label + ". Проверяем..."}) + "\n\n"

    working = []
    done = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(test_key, key): key for key in keys}
        for future in as_completed(futures):
            done += 1
            result = future.result()
            if result:
                working.append(result)
                msg = "[" + str(done) + "/" + str(total) + "] \u2705 " + result["host"] + ":" + str(result["port"]) + " \u2014 " + str(result["latency_ms"]) + " \u043c\u0441"
                yield "data: " + json.dumps({"type": "found", "msg": msg}) + "\n\n"
            else:
                msg = "[" + str(done) + "/" + str(total) + "] \u274c"
                yield "data: " + json.dumps({"type": "progress", "msg": msg}) + "\n\n"

    working.sort(key=lambda x: x["latency_ms"])

    if working:
        best = working[0]
        top5 = working[:5]
        yield "data: " + json.dumps({"type": "done", "best": best["key"], "top5": top5, "total_working": len(working), "total": total}) + "\n\n"
    else:
        yield "data: " + json.dumps({"type": "done", "best": None, "top5": [], "total_working": 0, "total": total}) + "\n\n"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/check")
def check():
    mode = request.args.get("mode", "black")
    return Response(stream_check(mode), mimetype="text/event-stream")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
