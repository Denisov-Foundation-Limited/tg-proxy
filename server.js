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

import { createContainer } from "./src/container.js";

/**
 * @file server.js
 * @brief Application entry point.
 * @details
 * Creates the dependency injection container, resolves the HTTP proxy server
 * instance, and starts listening for incoming requests.
 */

const container = createContainer();
const app = container.resolve("proxyServer");

app.start();
