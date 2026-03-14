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

/**
 * @class ProxyServer
 * @brief Wraps the Express application and configures HTTP routes.
 * @details
 * Exposes a health endpoint and forwards all other requests to the Telegram
 * proxy service.
 */
class ProxyServer {
    /**
     * @brief Creates the HTTP proxy server wrapper.
     * @param {Object} dependencies Object with constructor dependencies.
     * @param {import("express").Express} dependencies.app Express application.
     * @param {import("./app-config.js").AppConfig} dependencies.config Runtime configuration.
     * @param {import("./logger.js").Logger} dependencies.logger Logger instance.
     * @param {import("./telegram-proxy-service.js").TelegramProxyService}
     * dependencies.telegramProxyService Request forwarding service.
     */
    constructor({ app, config, logger, telegramProxyService }) {
        this.app = app;
        this.config = config;
        this.logger = logger;
        this.telegramProxyService = telegramProxyService;
        this.configureRoutes();
    }

    /**
     * @brief Registers all HTTP routes for the application.
     * @details
     * Adds a lightweight `/health` endpoint and a catch-all route that proxies
     * all other requests to the Telegram API.
     * @returns {void}
     */
    configureRoutes() {
        this.app.get("/health", (_req, res) => {
            res.json({
                ok: true,
                target: this.config.telegramApiBase,
            });
        });

        this.app.all("*", (req, res) => {
            this.telegramProxyService.proxy(req, res);
        });
    }

    /**
     * @brief Starts the HTTP server and begins listening on the configured port.
     * @returns {void}
     */
    start() {
        this.app.listen(this.config.port, () => {
            this.logger.info(
                "SERVER",
                `Telegram proxy listening on port ${this.config.port}`
            );
            this.logger.info(
                "SERVER",
                `Forwarding requests to ${this.config.telegramApiBase}`
            );
        });
    }
}

export { ProxyServer };
