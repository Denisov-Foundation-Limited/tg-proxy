# tg-proxy

Простой HTTP proxy для Telegram Bot API на `Node.js + Express`.

## Запуск локально

```bash
npm install
npm start
```

По умолчанию сервис слушает `5000` порт и проксирует запросы на `https://api.telegram.org`.

Пример:

```bash
curl http://localhost:5000/bot<TELEGRAM_BOT_TOKEN>/getMe
```

## Переменные окружения

- `PORT` - порт HTTP-сервера, по умолчанию `5000`
- `TELEGRAM_API_BASE` - базовый URL Telegram API, по умолчанию `https://api.telegram.org`

## Docker

```bash
docker compose up --build
```
