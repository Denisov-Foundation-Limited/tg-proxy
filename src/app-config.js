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
 * @class AppConfig
 * @brief Stores runtime configuration for the proxy application.
 * @details
 * Reads environment variables once during startup and exposes normalized
 * configuration values to the rest of the application.
 */
class AppConfig {
    /**
     * @brief Creates an application configuration instance.
     * @param {Object} dependencies Object with constructor dependencies.
     * @param {NodeJS.ProcessEnv|Object<string, string|undefined>} dependencies.env
     * Environment variables used to configure the application.
     */
    constructor({ env }) {
        this.port = Number(env.PORT) || 5000;
        this.telegramApiBase = (
            env.TELEGRAM_API_BASE || "https://api.telegram.org"
        ).replace(/\/+$/, "");
    }
}

export { AppConfig };
