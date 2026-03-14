const express = require("express");
const { Readable } = require("stream");

const app = express();

const port = Number(process.env.PORT) || 5000;
const telegramApiBase = (
  process.env.TELEGRAM_API_BASE || "https://api.telegram.org"
).replace(/\/+$/, "");

function buildTargetUrl(req) {
  const path = req.originalUrl || req.url || "/";
  return `${telegramApiBase}${path}`;
}

function filterRequestHeaders(headers) {
  const forwardedHeaders = { ...headers };

  delete forwardedHeaders.host;
  delete forwardedHeaders.connection;
  delete forwardedHeaders["content-length"];

  return forwardedHeaders;
}

function copyResponseHeaders(upstreamHeaders, res) {
  upstreamHeaders.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") {
      return;
    }

    res.setHeader(key, value);
  });
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    target: telegramApiBase,
  });
});

app.all("*", async (req, res) => {
  const controller = new AbortController();
  const targetUrl = buildTargetUrl(req);

  req.on("aborted", () => {
    controller.abort();
  });

  res.on("close", () => {
    if (!res.writableEnded) {
      controller.abort();
    }
  });

  try {
    const hasBody = !["GET", "HEAD"].includes(req.method.toUpperCase());
    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers: filterRequestHeaders(req.headers),
      body: hasBody ? Readable.toWeb(req) : undefined,
      duplex: hasBody ? "half" : undefined,
      signal: controller.signal,
    });

    res.status(upstreamResponse.status);
    copyResponseHeaders(upstreamResponse.headers, res);

    if (!upstreamResponse.body) {
      res.end();
      return;
    }

    Readable.fromWeb(upstreamResponse.body).pipe(res);
  } catch (error) {
    if (controller.signal.aborted) {
      return;
    }

    res.status(502).json({
      ok: false,
      error: "Bad Gateway",
      message: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Telegram proxy listening on port ${port}`);
  console.log(`Forwarding requests to ${telegramApiBase}`);
});
