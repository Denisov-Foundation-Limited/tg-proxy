/**********************************************************************/
/*                                                                    */
/* Telegram HTTP proxy server for ESP microcontrollers                */
/*                                                                    */
/* Copyright (C) 2026 Denisov Foundation Limited                      */
/* License: GPLv3                                                     */
/* Written by Sergey Denisov aka LittleBuster                         */
/* Email: DenisovFoundationLtd@gmail.com                              */
/*                                                                    */
/**********************************************************************/

import { Readable } from "stream";

/**
 * @class TelegramProxyService
 * @brief Proxies incoming HTTP requests to the Telegram Bot API.
 * @details
 * Preserves method, headers, and streaming request bodies while copying the
 * upstream response back to the original client.
 */
class TelegramProxyService {
    /**
     * @brief Creates the Telegram proxy service.
     * @param {Object} dependencies Object with constructor dependencies.
     * @param {import("./app-config.js").AppConfig} dependencies.config Runtime configuration.
     * @param {typeof fetch} dependencies.fetchImpl Fetch implementation used for upstream requests.
     * @param {import("./logger.js").Logger} dependencies.logger Logger instance.
     */
    constructor({ config, fetchImpl, logger }) {
        this.config = config;
        this.fetchImpl = fetchImpl;
        this.logger = logger;
    }

    /**
     * @brief Builds the full Telegram API target URL for an incoming request.
     * @param {import("express").Request} req Incoming client request.
     * @returns {string} Fully qualified upstream Telegram API URL.
     */
    buildTargetUrl(req) {
        const path = req.originalUrl || req.url || "/";
        return `${this.config.telegramApiBase}${path}`;
    }

    /**
     * @brief Filters hop-by-hop headers before forwarding the request upstream.
     * @param {import("http").IncomingHttpHeaders} headers Original request headers.
     * @returns {import("http").IncomingHttpHeaders} Forwarded header object.
     */
    filterRequestHeaders(headers) {
        const forwardedHeaders = { ...headers };

        delete forwardedHeaders.host;
        delete forwardedHeaders.connection;
        delete forwardedHeaders["content-length"];

        return forwardedHeaders;
    }

    /**
     * @brief Copies upstream response headers to the client response.
     * @param {Headers} upstreamHeaders Headers received from the upstream response.
     * @param {import("express").Response} res Outgoing Express response.
     * @returns {void}
     */
    copyResponseHeaders(upstreamHeaders, res) {
        upstreamHeaders.forEach((value, key) => {
            if (key.toLowerCase() === "transfer-encoding") {
                return;
            }

            res.setHeader(key, value);
        });
    }

    /**
     * @brief Forwards the incoming request to the Telegram API and streams back the response.
     * @param {import("express").Request} req Incoming client request.
     * @param {import("express").Response} res Outgoing client response.
     * @returns {Promise<void>} Resolves when the request lifecycle is completed.
     */
    async proxy(req, res) {
        const controller = new AbortController();
        const targetUrl = this.buildTargetUrl(req);
        const requestLabel = `${req.method} ${req.originalUrl || req.url || "/"}`;

        this.logger.info("PROXY", `Forward request: ${requestLabel}`);

        req.on("aborted", () => {
            this.logger.warn("PROXY", `Client aborted request: ${requestLabel}`);
            controller.abort();
        });

        res.on("close", () => {
            if (!res.writableEnded) {
                this.logger.warn("PROXY", `Response closed before completion: ${requestLabel}`);
                controller.abort();
            }
        });

        try {
            const hasBody = !["GET", "HEAD"].includes(req.method.toUpperCase());
            const upstreamResponse = await this.fetchImpl(targetUrl, {
                method: req.method,
                headers: this.filterRequestHeaders(req.headers),
                body: hasBody ? Readable.toWeb(req) : undefined,
                duplex: hasBody ? "half" : undefined,
                signal: controller.signal,
            });

            res.status(upstreamResponse.status);
            this.copyResponseHeaders(upstreamResponse.headers, res);

            this.logger.info(
                "PROXY",
                `Upstream response: ${requestLabel} status: ${upstreamResponse.status}`
            );

            if (!upstreamResponse.body) {
                res.end();
                return;
            }

            Readable.fromWeb(upstreamResponse.body).pipe(res);
        } catch (error) {
            if (controller.signal.aborted) {
                return;
            }

            this.logger.error(
                "PROXY",
                `Proxy error: ${requestLabel} message: ${error.message}`
            );

            res.status(502).json({
                ok: false,
                error: "Bad Gateway",
                message: error.message,
            });
        }
    }
}

export { TelegramProxyService };
