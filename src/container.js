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

import express from "express";
import {
    asClass,
    asFunction,
    asValue,
    createContainer: createAwilixContainer,
    InjectionMode,
    Lifetime,
} from "awilix";

import { AppConfig } from "./app-config.js";
import { Logger } from "./logger.js";
import { TelegramProxyService } from "./telegram-proxy-service.js";
import { ProxyServer } from "./proxy-server.js";

/**
 * @brief Builds a new Express application instance.
 * @returns {import("express").Express} Configured Express application object.
 */
function buildExpressApp() {
    return express();
}

/**
 * @brief Creates and configures the Awilix dependency injection container.
 * @details
 * Registers infrastructure services, runtime configuration, logging, proxy
 * services, and the HTTP server as singleton dependencies.
 * @returns {import("awilix").AwilixContainer} Configured Awilix container.
 */
function createContainer() {
    const container = createAwilixContainer({
        injectionMode: InjectionMode.PROXY,
    });

    container.register({
        env: asValue(process.env),
        fetchImpl: asValue(fetch),
        app: asFunction(buildExpressApp).singleton(),
        config: asClass(AppConfig, { lifetime: Lifetime.SINGLETON }),
        logger: asClass(Logger, { lifetime: Lifetime.SINGLETON }),
        telegramProxyService: asClass(TelegramProxyService, {
            lifetime: Lifetime.SINGLETON,
        }),
        proxyServer: asClass(ProxyServer, { lifetime: Lifetime.SINGLETON }),
    });

    return container;
}

export { createContainer };
