"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/spring.ts (npm run bauen:ts). */
const RedionSpring = (() => {
    const MAX_BOUNCE = 0.95;
    const PRESETS = {
        press: { duration: 0.32, bounce: 0.3 },
        snappy: { duration: 0.36, bounce: 0.14 },
        smooth: { duration: 0.5, bounce: 0 },
        bouncy: { duration: 0.5, bounce: 0.36 },
        gentle: { duration: 0.62, bounce: 0.1 },
    };
    const TOKENS = {
        press: '--feder-druck', snappy: '--feder-knapp', smooth: '--feder-sanft',
        bouncy: '--feder-lebhaft', gentle: '--feder-weich',
    };
    const fromPerceptual = ({ duration, bounce }) => {
        if (!(duration > 0))
            throw new RangeError(`Spring duration must be > 0, got ${duration}`);
        const b = Math.min(MAX_BOUNCE, Math.max(-MAX_BOUNCE, bounce));
        const ratio = b >= 0 ? 1 - b : 1 / (1 + b);
        const omega = (2 * Math.PI) / duration;
        return { stiffness: omega * omega, damping: 2 * ratio * omega, mass: 1 };
    };
    const dampingRatio = ({ stiffness, damping, mass }) => damping / (2 * Math.sqrt(stiffness * mass));
    const assertPhysical = ({ stiffness, damping, mass }) => {
        if (!(stiffness > 0) || !(mass > 0) || !(damping >= 0))
            throw new RangeError(`Invalid spring: stiffness=${stiffness} damping=${damping} mass=${mass}`);
    };
    const solve = (params, from, to, initialVelocity = 0) => {
        assertPhysical(params);
        const x0 = from - to;
        const v0 = initialVelocity;
        if (x0 === 0 && v0 === 0)
            return () => ({ value: to, velocity: 0 });
        const omega0 = Math.sqrt(params.stiffness / params.mass);
        const zeta = dampingRatio(params);
        if (Math.abs(zeta - 1) < 1e-6) {
            const b = v0 + omega0 * x0;
            return (t) => {
                const e = Math.exp(-omega0 * t);
                return { value: to + e * (x0 + b * t), velocity: e * (v0 - omega0 * b * t) };
            };
        }
        if (zeta < 1) {
            const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
            const decay = zeta * omega0;
            const b = (v0 + decay * x0) / omegaD;
            return (t) => {
                const e = Math.exp(-decay * t);
                const cos = Math.cos(omegaD * t);
                const sin = Math.sin(omegaD * t);
                return {
                    value: to + e * (x0 * cos + b * sin),
                    velocity: e * ((omegaD * b - decay * x0) * cos - (decay * b + omegaD * x0) * sin),
                };
            };
        }
        const s = zeta + Math.sqrt(zeta * zeta - 1);
        const r1 = -omega0 / s;
        const r2 = -omega0 * s;
        const c2 = (v0 - r1 * x0) / (r2 - r1);
        const c1 = x0 - c2;
        return (t) => {
            const e1 = c1 * Math.exp(r1 * t);
            const e2 = c2 * Math.exp(r2 * t);
            return { value: to + e1 + e2, velocity: r1 * e1 + r2 * e2 };
        };
    };
    const settle = (params, from, to, initialVelocity = 0, { restDelta = 0.001, restSpeed = 0.01, maxDuration = 10 } = {}) => {
        const at = solve(params, from, to, initialVelocity);
        const step = 1 / 1000;
        for (let t = 0; t < maxDuration; t += step) {
            const s = at(t);
            if (Math.abs(s.value - to) <= restDelta && Math.abs(s.velocity) <= restSpeed)
                return Math.round(t * 1000) / 1000;
        }
        return maxDuration;
    };
    const toLinearEasing = (params, { maxPoints = 48, precision = 4 } = {}) => {
        if (!(maxPoints >= 2))
            throw new RangeError(`maxPoints must be >= 2, got ${maxPoints}`);
        const maxDuration = 10;
        const duration = settle(params, 0, 1, 0, { restDelta: 0.0005, restSpeed: 0.01, maxDuration });
        const at = solve(params, 0, 1, 0);
        const end = at(duration);
        if (Math.abs(end.value - 1) > 0.005)
            throw new RangeError(`Spring does not settle within ${maxDuration}s; use a stiffer or more damped spring`);
        const count = Math.min(maxPoints, Math.max(12, Math.ceil(duration * 60) + 1));
        const factor = 10 ** precision;
        const points = [];
        for (let i = 0; i < count; i += 1) {
            const t = (i / (count - 1)) * duration;
            const v = i === 0 ? 0 : i === count - 1 ? 1 : Math.round(at(t).value * factor) / factor;
            points.push(String(v));
        }
        return { easing: `linear(${points.join(', ')})`, duration };
    };
    const preset = (name) => fromPerceptual(PRESETS[name]);
    const velocityTracker = ({ windowMs = 100 } = {}) => {
        let samples = [];
        return {
            add(value, time) {
                samples.push({ value, time });
                const cutoff = time - windowMs * 4;
                while (samples.length > 2 && (samples[0]?.time ?? cutoff) < cutoff)
                    samples.shift();
            },
            velocity(now) {
                if (samples.length < 2)
                    return 0;
                const last = samples[samples.length - 1];
                if (!last || now - last.time > windowMs)
                    return 0;
                let i = samples.length - 1;
                while (i > 0 && last.time - (samples[i - 1]?.time ?? -Infinity) <= windowMs)
                    i -= 1;
                let reference = samples[i];
                if (reference === last) {
                    const previous = samples[samples.length - 2];
                    if (!previous || last.time - previous.time > windowMs * 2)
                        return 0;
                    reference = previous;
                }
                if (!reference)
                    return 0;
                const dt = (last.time - reference.time) / 1000;
                if (dt <= 0)
                    return 0;
                const v = (last.value - reference.value) / dt;
                return Number.isFinite(v) ? v : 0;
            },
            reset() { samples = []; },
        };
    };
    const rubberband = (overshoot, dimension, constant = 0.55) => {
        if (overshoot === 0 || dimension <= 0)
            return 0;
        return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
    };
    const rubberbandClamp = (value, min, max, dimension, constant = 0.55) => {
        if (value < min)
            return min - rubberband(min - value, dimension, constant);
        if (value > max)
            return max + rubberband(value - max, dimension, constant);
        return value;
    };
    const sample = (params, from, to, initialVelocity = 0, stepMs = 8) => {
        const seconds = settle(params, from, to, initialVelocity, { restDelta: Math.max(0.01, Math.abs(to - from) * 0.001), restSpeed: 1 });
        const at = solve(params, from, to, initialVelocity);
        const duration = Math.max(stepMs, Math.round(seconds * 1000));
        const values = [];
        for (let t = 0; t < duration; t += stepMs)
            values.push(at(t / 1000).value);
        values.push(to);
        return { values, duration };
    };
    const token = (name) => {
        try {
            const style = getComputedStyle(document.documentElement);
            const easing = style.getPropertyValue(TOKENS[name]).trim();
            const raw = style.getPropertyValue(TOKENS[name] + '-dauer').trim();
            const n = parseFloat(raw);
            if (easing && Number.isFinite(n))
                return { easing, duration: /ms$/.test(raw) ? n : n * 1000 };
        }
        catch { }
        const selbst = toLinearEasing(preset(name));
        return { easing: selbst.easing, duration: Math.round(selbst.duration * 1000) };
    };
    return {
        PRESETS, TOKENS,
        fromPerceptual, dampingRatio, solve, settle, toLinearEasing, preset,
        velocityTracker, rubberband, rubberbandClamp,
        sample, token,
    };
})();
window.RedionSpring = RedionSpring;
