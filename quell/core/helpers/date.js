"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/helpers/date.ts (npm run bauen:ts). */
const Dates = (() => {
    const MS_DAY = 86400000;
    const parse = (x) => {
        if (x instanceof Date)
            return isNaN(x.getTime()) ? null : x;
        if (typeof x === 'number')
            return new Date(x);
        const s = String(x || '').trim();
        if (!s)
            return null;
        const rein = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (rein)
            return new Date(Number(rein[1]), Number(rein[2]) - 1, Number(rein[3]));
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    };
    const isDate = (x) => parse(x) !== null;
    const two = (n) => String(n).padStart(2, '0');
    const toISO = (d) => (parse(d) || new Date()).toISOString();
    const toDay = (d) => {
        const x = parse(d);
        if (!x)
            return '';
        return x.getFullYear() + '-' + two(x.getMonth() + 1) + '-' + two(x.getDate());
    };
    const startOfDay = (d) => {
        const x = parse(d);
        if (!x)
            return null;
        const y = new Date(x);
        y.setHours(0, 0, 0, 0);
        return y;
    };
    const endOfDay = (d) => {
        const x = parse(d);
        if (!x)
            return null;
        const y = new Date(x);
        y.setHours(23, 59, 59, 999);
        return y;
    };
    const startOfWeek = (d, mondays = true) => {
        const x = startOfDay(d);
        if (!x)
            return null;
        const day = x.getDay();
        const back = mondays ? (day === 0 ? 6 : day - 1) : day;
        x.setDate(x.getDate() - back);
        return x;
    };
    const startOfMonth = (d) => {
        const x = startOfDay(d);
        if (!x)
            return null;
        x.setDate(1);
        return x;
    };
    const endOfMonth = (d) => {
        const x = startOfMonth(d);
        if (!x)
            return null;
        x.setMonth(x.getMonth() + 1);
        x.setDate(0);
        x.setHours(23, 59, 59, 999);
        return x;
    };
    const startOfYear = (d) => {
        const x = startOfDay(d);
        if (!x)
            return null;
        x.setMonth(0, 1);
        return x;
    };
    const addDays = (d, n) => {
        const x = parse(d);
        if (!x)
            return null;
        const y = new Date(x);
        y.setDate(y.getDate() + Number(n || 0));
        return y;
    };
    const addMonths = (d, n) => {
        const x = parse(d);
        if (!x)
            return null;
        const day = x.getDate();
        const y = new Date(x);
        y.setDate(1);
        y.setMonth(y.getMonth() + Number(n || 0));
        const last = new Date(y.getFullYear(), y.getMonth() + 1, 0).getDate();
        y.setDate(Math.min(day, last));
        return y;
    };
    const daysBetween = (a, b) => {
        const x = startOfDay(a), y = startOfDay(b);
        if (!x || !y)
            return 0;
        return Math.round((y.getTime() - x.getTime()) / MS_DAY);
    };
    const isWeekend = (d) => {
        const x = parse(d);
        if (!x)
            return false;
        const t = x.getDay();
        return t === 0 || t === 6;
    };
    const businessDaysBetween = (a, b) => {
        let x = startOfDay(a), y = startOfDay(b);
        if (!x || !y)
            return 0;
        const backwards = x > y;
        if (backwards) {
            const h = x;
            x = y;
            y = h;
        }
        let n = 0;
        const run = new Date(x);
        while (run < y) {
            run.setDate(run.getDate() + 1);
            if (!isWeekend(run))
                n++;
        }
        return backwards ? -n : n;
    };
    const addBusinessDays = (d, n) => {
        let x = startOfDay(d);
        if (!x)
            return null;
        let left = Math.abs(Number(n) || 0);
        const step = (Number(n) || 0) < 0 ? -1 : 1;
        while (left > 0) {
            x = addDays(x, step);
            if (!x)
                return null;
            if (!isWeekend(x))
                left--;
        }
        return x;
    };
    const isoWeek = (d) => {
        const x = startOfDay(d);
        if (!x)
            return 0;
        const t = new Date(x);
        t.setDate(t.getDate() + 4 - (t.getDay() || 7));
        const yearStart = new Date(t.getFullYear(), 0, 1);
        return Math.ceil(((t.getTime() - yearStart.getTime()) / MS_DAY + 1) / 7);
    };
    const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
        'Donnerstag', 'Freitag', 'Samstag'];
    const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
        'August', 'September', 'Oktober', 'November', 'Dezember'];
    const relativeText = (d, now = new Date()) => {
        const x = parse(d);
        if (!x)
            return '';
        const sec = Math.round((now.getTime() - x.getTime()) / 1000);
        if (Math.abs(sec) < 45)
            return 'gerade eben';
        const min = Math.round(sec / 60);
        if (Math.abs(min) < 60)
            return min > 0 ? 'vor ' + min + ' Minuten' : 'in ' + -min + ' Minuten';
        const hrs = Math.round(min / 60);
        if (Math.abs(hrs) < 24)
            return hrs > 0 ? 'vor ' + hrs + ' Stunden' : 'in ' + -hrs + ' Stunden';
        const days = daysBetween(x, now);
        if (days === 1)
            return 'gestern';
        if (days === -1)
            return 'morgen';
        if (Math.abs(days) < 7)
            return days > 0 ? 'vor ' + days + ' Tagen' : 'in ' + -days + ' Tagen';
        return 'am ' + x.getDate() + '. ' + (MONTHS[x.getMonth()] ?? '') +
            (x.getFullYear() !== now.getFullYear() ? ' ' + x.getFullYear() : '');
    };
    return { MS_DAY, WEEKDAYS, MONTHS,
        parse, isDate, toISO, toDay,
        startOfDay, endOfDay, startOfWeek, startOfMonth, endOfMonth, startOfYear,
        addDays, addMonths, daysBetween,
        isWeekend, businessDaysBetween, addBusinessDays,
        isoWeek, relativeText };
})();
window.Dates = Dates;
