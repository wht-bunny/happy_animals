# VLESS Key Checker

Автоматический сервис для поиска рабочих VLESS-ключей с проверкой доступности серверов.

🌐 **Сайт:** [tiagorrg.github.io/vless-checker](https://tiagorrg.github.io/vless-checker/)

---

## Как пользоваться

Просто открой сайт и выбери нужный режим:

| Режим | Описание |
|---|---|
| **Обычный VPN** | Ключи для полного туннелирования трафика |
| **Белые списки** | Ключи для доступа только к заблокированным сайтам (без Russia-серверов) |
| **Россия (Москва)** | Ключи через московские серверы для белых списков |

Нажми кнопку **Копировать** и вставь ключ в своё VPN-приложение (v2rayTUN, Hiddify, Streisand и др.).

---

## Источник данных

Ключи берутся из репозитория [igareck/vpn-configs-for-russia](https://github.com/igareck/vpn-configs-for-russia):

- **Обычный VPN** — `BLACK_VLESS_RUS.txt`
- **Белые списки / Россия** — `WHITE-CIDR-RU-checked.txt`

---

## Как работает

1. **GitHub Actions** запускает скрипт `check_and_save.py` каждые 30 минут
2. Скрипт загружает ключи с GitHub, проверяет TCP-доступность каждого сервера и замеряет задержку
3. Результаты сохраняются в `docs/keys.json`
4. **GitHub Pages** отдаёт статичный сайт, который читает `keys.json` и показывает лучшие ключи

> **Важно:** проверка выполняется с серверов GitHub (США), поэтому задержки могут отличаться от реальных из твоей сети.

---

## Локальный запуск

```bash
git clone https://github.com/tiagorrg/vless-checker.git
cd vless-checker
python3 -m venv venv
source venv/bin/activate
pip install requests
python3 checker.py
```

---

## Структура проекта

```
vless-checker/
├── checker.py          # Оригинальный скрипт для запуска в терминале
├── check_and_save.py   # Скрипт для GitHub Actions (сохраняет в JSON)
├── docs/
│   ├── index.html      # Статичный сайт (GitHub Pages)
│   └── keys.json       # Актуальные рабочие ключи (обновляется автоматически)
└── .github/
    └── workflows/
        └── check_keys.yml  # Расписание автоматической проверки
```
