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
 * @class Logger
 * @brief Provides structured console logging in a unified text format.
 * @details
 * Produces log messages in the form
 * `[YYYY-MM-DD][HH:MM:SS][LEVEL][SCOPE] message`.
 */
class Logger {
    /**
     * @brief Formats a Date instance as `YYYY-MM-DD`.
     * @param {Date} date Source date object.
     * @returns {string} Formatted date string.
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    /**
     * @brief Formats a Date instance as `HH:MM:SS`.
     * @param {Date} date Source date object.
     * @returns {string} Formatted time string.
     */
    formatTime(date) {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");

        return `${hours}:${minutes}:${seconds}`;
    }

    /**
     * @brief Writes a formatted log record to standard output.
     * @param {string} level Log severity level such as `INFO` or `ERROR`.
     * @param {string} scope Logical subsystem name for the message.
     * @param {string} message Human-readable log message body.
     * @returns {void}
     */
    write(level, scope, message) {
        const now = new Date();
        const date = this.formatDate(now);
        const time = this.formatTime(now);

        console.log(`[${date}][${time}][${level}][${scope}] ${message}`);
    }

    /**
     * @brief Writes an informational log message.
     * @param {string} scope Logical subsystem name.
     * @param {string} message Human-readable message body.
     * @returns {void}
     */
    info(scope, message) {
        this.write("INFO", scope, message);
    }

    /**
     * @brief Writes a warning log message.
     * @param {string} scope Logical subsystem name.
     * @param {string} message Human-readable message body.
     * @returns {void}
     */
    warn(scope, message) {
        this.write("WARN", scope, message);
    }

    /**
     * @brief Writes an error log message.
     * @param {string} scope Logical subsystem name.
     * @param {string} message Human-readable message body.
     * @returns {void}
     */
    error(scope, message) {
        this.write("ERROR", scope, message);
    }
}

export { Logger };
