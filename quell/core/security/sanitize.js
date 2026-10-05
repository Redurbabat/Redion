"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/security/sanitize.ts (npm run bauen:ts). */
const Sanitize = (() => {
    const TAGS = new Set([
        'p', 'br', 'hr', 'div', 'span', 'section', 'article',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'ins', 'mark', 'sub', 'sup', 'small',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'blockquote', 'pre', 'code', 'kbd', 'samp', 'var',
        'a', 'img', 'figure', 'figcaption',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
        'details', 'summary', 'abbr', 'time', 'cite', 'q'
    ]);
    const DROP_WITH_CONTENT = new Set([
        'script', 'style', 'iframe', 'object', 'embed', 'form', 'link', 'meta', 'base',
        'noscript', 'template', 'svg', 'math', 'applet', 'frame', 'frameset'
    ]);
    const ATTRIBUTES = {
        '*': ['title', 'lang', 'dir'],
        a: ['href', 'target', 'rel'],
        img: ['src', 'alt', 'width', 'height'],
        td: ['colspan', 'rowspan'],
        th: ['colspan', 'rowspan', 'scope'],
        time: ['datetime'],
        col: ['span'],
        ol: ['start', 'type']
    };
    const BAD_SCHEME = /^\s*(javascript|vbscript|file|about)\s*:/i;
    const urlOk = (wert) => {
        const w = String(wert || '').replace(/[\x00-\x1f\s]+/g, '');
        if (!w)
            return false;
        if (BAD_SCHEME.test(w))
            return false;
        if (/^data:/i.test(w))
            return /^data:image\/(png|jpe?g|gif|webp|avif|bmp);base64,/i.test(w);
        return true;
    };
    const html = (roh, opt = {}) => {
        const allowedTags = opt.tags || TAGS;
        const allowedAttr = opt.attributes || ATTRIBUTES;
        const template = document.createElement('template');
        template.innerHTML = String(roh ?? '');
        const walk = (node) => {
            [...node.childNodes].forEach(k => {
                if (k.nodeType === 8) {
                    k.remove();
                    return;
                }
                if (k.nodeType !== 1)
                    return;
                const el = k;
                const name = el.tagName.toLowerCase();
                if (DROP_WITH_CONTENT.has(name)) {
                    el.remove();
                    return;
                }
                if (!allowedTags.has(name)) {
                    walk(el);
                    const parent = el.parentNode;
                    while (el.firstChild && parent)
                        parent.insertBefore(el.firstChild, el);
                    el.remove();
                    return;
                }
                const allowed = new Set([...(allowedAttr['*'] || []), ...(allowedAttr[name] || [])]);
                [...el.attributes].forEach(a => {
                    const an = a.name.toLowerCase();
                    if (an.startsWith('on')) {
                        el.removeAttribute(a.name);
                        return;
                    }
                    if (an === 'srcdoc' || an === 'formaction' || an === 'xlink:href') {
                        el.removeAttribute(a.name);
                        return;
                    }
                    if (an === 'style') {
                        const s = String(a.value || '');
                        if (/url\s*\(|expression\s*\(|javascript:/i.test(s))
                            el.removeAttribute(a.name);
                        return;
                    }
                    if (!allowed.has(an)) {
                        el.removeAttribute(a.name);
                        return;
                    }
                    if ((an === 'href' || an === 'src') && !urlOk(a.value))
                        el.removeAttribute(a.name);
                });
                if (name === 'a' && el.getAttribute('target') === '_blank')
                    el.setAttribute('rel', 'noopener noreferrer');
                walk(el);
            });
        };
        walk(template.content);
        return template.innerHTML;
    };
    const textOnly = (roh) => {
        const v = document.createElement('template');
        v.innerHTML = String(roh ?? '');
        DROP_WITH_CONTENT.forEach(t => [...v.content.querySelectorAll(t)].forEach(e => e.remove()));
        return (v.content.textContent || '').replace(/\s+\n/g, '\n').trim();
    };
    const escapeText = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const escapeAttribute = (s) => escapeText(s).replace(/`/g, '&#96;');
    const url = (wert) => urlOk(wert) ? String(wert).trim() : '';
    const attachmentUrl = (wert) => {
        const roh = String(wert || '').trim();
        if (!roh)
            return '';
        const ohneLeer = roh.replace(/[\s\x00-\x1f]/g, '');
        const m = ohneLeer.match(/^([a-z][a-z0-9+.-]*):/i);
        if (!m)
            return roh;
        const scheme = String(m[1]).toLowerCase();
        if (['javascript', 'vbscript', 'file', 'about'].includes(scheme))
            return '';
        if (scheme === 'data' && /^data:(text\/html|image\/svg)/i.test(ohneLeer))
            return '';
        return roh;
    };
    const frameUrl = (wert) => {
        const w = String(wert || '').replace(/[\x00-\x1f\s]/g, '');
        if (!w)
            return '';
        if (/^https?:\/\//i.test(w))
            return String(wert).trim();
        if (/^blob:/i.test(w))
            return String(wert).trim();
        if (/^data:application\/pdf[;,]/i.test(w))
            return String(wert).trim();
        return '';
    };
    const fileName = (s) => String(s ?? 'ohne-namen')
        .replace(/[\/\\:*?"<>|\x00-\x1f]/g, '-')
        .replace(/^\.+/, '')
        .slice(0, 120) || 'ohne-namen';
    const farbe = (wert) => {
        const w = String(wert ?? '').trim();
        if (!w || w.length > 64)
            return '';
        if (/^#[0-9a-f]{3,8}$/i.test(w))
            return w;
        if (/^(rgb|rgba|hsl|hsla)\(\s*[-0-9.,%\s/]+\)$/i.test(w))
            return w;
        if (/^[a-z]+$/i.test(w))
            return w;
        return '';
    };
    return { html, textOnly, escapeText, escapeAttribute, url, urlOk,
        attachmentUrl, frameUrl, fileName, farbe,
        TAGS, DROP_WITH_CONTENT, ATTRIBUTES };
})();
window.Sanitize = Sanitize;
