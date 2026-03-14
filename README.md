# tg-proxy

HTTP proxy для Telegram Bot API на `Node.js`, `Express` и `Awilix`.

Сервис принимает обычные HTTP-запросы на своей стороне и прозрачно пересылает их в `https://api.telegram.org`, сохраняя:

- HTTP method
- request path
- query string
- request headers
- streaming body

Проект рассчитан на простой запуск в Docker и на использование как промежуточного прокси для устройств, скриптов и микроконтроллеров.

## Возможности

- проксирование `GET`, `POST` и других HTTP методов через один catch-all маршрут
- поддержка стриминга request body и response body
- health endpoint: `/health`
- dependency injection через `Awilix`
- структурированное логирование через отдельный `Logger`
- контейнерный запуск через `Dockerfile` и `docker-compose.yml`
- код на ES Modules

## Быстрый старт

### Локально

Требуется `Node.js 20+`.

```bash
npm install
npm start
```

После старта сервер по умолчанию слушает `5000` порт.

Проверка:

```bash
curl http://localhost:5000/health
```

Пример запроса к Telegram Bot API через прокси:

```bash
curl http://localhost:5000/bot<TELEGRAM_BOT_TOKEN>/getMe
```

Пример `POST`:

```bash
curl \
  -H "Content-Type: application/json" \
  -d '{"offset":0,"limit":1,"timeout":0}' \
  http://localhost:5000/bot<TELEGRAM_BOT_TOKEN>/getUpdates
```

### Через Docker Compose

```bash
docker compose up -d --build
```

Проверка:

```bash
curl http://localhost:5000/health
```

Логи:

```bash
docker logs -f tg-proxy
```

Остановка:

```bash
docker compose down
```

## Переменные окружения

| Переменная | По умолчанию | Описание |
|---|---:|---|
| `PORT` | `5000` | Порт HTTP-сервера |
| `TELEGRAM_API_BASE` | `https://api.telegram.org` | Базовый URL Telegram Bot API |

## Архитектура

### Обзор компонентов

```text
+-------------------+
|   Client Device   |
| curl / script /   |
| ESP / service     |
+---------+---------+
          |
          v
+-------------------+
|   Express Server  |
|   ProxyServer     |
+---------+---------+
          |
          v
+-------------------+
| TelegramProxy     |
| Service           |
+---------+---------+
          |
          v
+-------------------+
| api.telegram.org  |
+-------------------+
```

### DI-схема

```text
+----------------------+
| Awilix Container     |
+----------------------+
| env                  |
| fetchImpl            |
| app                  |
| config               |
| logger               |
| telegramProxyService |
| proxyServer          |
+----------------------+
```

### Поток обработки запроса

```text
Client Request
    |
    v
ProxyServer.app.all("*")
    |
    v
TelegramProxyService.proxy(req, res)
    |
    +--> buildTargetUrl()
    +--> filterRequestHeaders()
    +--> fetch(upstream)
    +--> copyResponseHeaders()
    +--> stream upstream body -> client
```

## Структура проекта

```text
.
├── Dockerfile
├── docker-compose.yml
├── package.json
├── README.md
├── server.js
└── src
    ├── app-config.js
    ├── container.js
    ├── logger.js
    ├── proxy-server.js
    └── telegram-proxy-service.js
```

### Назначение файлов

- `server.js` — entrypoint приложения
- `src/container.js` — регистрация зависимостей в `Awilix`
- `src/app-config.js` — чтение и нормализация конфигурации
- `src/logger.js` — единый формат логирования
- `src/proxy-server.js` — HTTP-сервер и маршруты
- `src/telegram-proxy-service.js` — логика проксирования запросов в Telegram API

## Логирование

Формат логов:

```text
[2026-03-14][21:02:58][INFO][STACK] Sync master unit: Дом item: avr enabled: false
```

Текущий формат:

```text
[YYYY-MM-DD][HH:MM:SS][LEVEL][SCOPE] message
```

Примеры:

```text
[2026-03-14][21:02:58][INFO][SERVER] Telegram proxy listening on port 5000
[2026-03-14][21:03:01][INFO][PROXY] Forward request: POST /bot123:getUpdates
[2026-03-14][21:03:01][ERROR][PROXY] Proxy error: POST /bot123:getUpdates message: fetch failed
```

## Технологии

- `Node.js 20+`
- `Express`
- `Awilix`
- встроенный `fetch` из Node.js
- Docker / Docker Compose

## Поведение прокси

Сервис:

- использует `app.all("*")` для обработки всех маршрутов
- проксирует путь как есть
- удаляет hop-by-hop заголовки вроде `host` и `connection`
- использует стриминг для тела запроса и ответа
- отменяет upstream-запрос при обрыве клиентского соединения

## Замечания по эксплуатации

- после изменения кода в Docker-среде нужно делать `docker compose up -d --build`, иначе контейнер продолжит работать со старым образом
- если локально возникают ошибки Node, связанные с системной установкой, Docker-сценарий остаётся предпочтительным способом запуска
- для production можно добавить reverse proxy, IP whitelist, auth и rate limiting

## Примеры запросов

### Проверка состояния

```bash
curl http://localhost:5000/health
```

### Telegram `getMe`

```bash
curl http://localhost:5000/bot<TELEGRAM_BOT_TOKEN>/getMe
```

### Telegram `getUpdates`

```bash
curl \
  -H "Content-Type: application/json" \
  -d '{"offset":0,"limit":1,"timeout":0,"allowed_updates":["message"]}' \
  http://localhost:5000/bot<TELEGRAM_BOT_TOKEN>/getUpdates
```

## Docker

### Dockerfile

Образ:

- базируется на `node:20-alpine`
- устанавливает production dependencies
- копирует `server.js`, `src/` и `README.md`
- экспонирует порт `5000`

### Compose

Сервис `tg-proxy`:

- собирается из локального `Dockerfile`
- публикует `5000:5000`
- передаёт `PORT=5000`
- перезапускается через `unless-stopped`

## Лицензия

Проект распространяется под `GPLv3`. Подробности в файле `LICENSE`.
