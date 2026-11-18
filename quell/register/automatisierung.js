"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/automatisierung.ts (npm run bauen:ts). */
const RegisterAutomatisierung = (() => {
    const handlers = new Map();
    const melde = (name, handler) => {
        if (!window.RedionDesktop?.onAutomationRequest || window.RedionDesktop.automationSupported === false)
            return;
        if (handlers.has(name))
            throw new Error('Automatisierungsaktion doppelt: ' + name);
        handlers.set(name, handler);
    };
    const ausfuehren = async (name, input, context) => {
        const handler = handlers.get(name);
        if (!handler)
            context.error('UNSUPPORTED_ACTION');
        context.check();
        return handler(input, context);
    };
    return { melde, ausfuehren, namen: () => [...handlers.keys()] };
})();
Register.automatisierung = RegisterAutomatisierung;
