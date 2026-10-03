"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/symbole.ts (npm run bauen:ts). */
window.Register = window.Register || {};
Register.symbole = (() => {
    const ZEICHEN = {
        search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
        command: '<path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/>',
        today: '<rect x="3.2" y="5" width="17.6" height="16" rx="2.6"/>' +
            '<path d="M3.2 10h17.6M8.2 3v4M15.8 3v4"/>' +
            '<rect x="9.4" y="13" width="5.2" height="4.6" rx="1.1"/>',
        learn: '<path d="M12 4 2.5 8.5 12 13l9.5-4.5z"/><path d="M6.5 10.8v4.4c0 .5 2.5 2.3 5.5 2.3' +
            's5.5-1.8 5.5-2.3v-4.4"/><path d="M21.5 8.5v5"/>',
        workspace: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/>' +
            '<rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/>' +
            '<rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/>' +
            '<rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
        library: '<path d="M4 4.5h5.2A2.8 2.8 0 0 1 12 7.3v12a2.4 2.4 0 0 0-2.4-2.4H4z"/>' +
            '<path d="M20 4.5h-5.2A2.8 2.8 0 0 0 12 7.3v12a2.4 2.4 0 0 1 2.4-2.4H20z"/>',
        tasks: '<rect x="3.5" y="3.5" width="17" height="17" rx="3.2"/><path d="m8 12.2 2.6 2.6L16.4 9"/>',
        inbox: '<path d="M3.5 13.5h4l1.6 2.6h5.8l1.6-2.6h4"/>' +
            '<path d="M6 4.5h12l3 9v4.2a2.8 2.8 0 0 1-2.8 2.8H5.8A2.8 2.8 0 0 1 3 17.7V13.5z"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        minus: '<path d="M5 12h14"/>',
        home: '<path d="m3.5 10.4 8.5-6.6 8.5 6.6"/>' +
            '<path d="M5.8 9.2v9.2a2 2 0 0 0 2 2h8.4a2 2 0 0 0 2-2V9.2"/>' +
            '<path d="M10 20.4v-5.6h4v5.6"/>',
        chat: '<path d="M20.5 12.2c0 4-3.8 7.2-8.5 7.2a9.8 9.8 0 0 1-2.7-.37L4.2 20.5l1.3-3.6' +
            'A6.8 6.8 0 0 1 3.5 12.2C3.5 8.2 7.3 5 12 5s8.5 3.2 8.5 7.2z"/>',
        mic: '<rect x="9" y="2.8" width="6" height="11.4" rx="3"/>' +
            '<path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3.2M8.8 21.2h6.4"/>',
        upload: '<path d="M12 15.5V3.8"/><path d="m7.8 8 4.2-4.2L16.2 8"/>' +
            '<path d="M4 15v3.6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V15"/>',
        trash: '<path d="M3.8 6.2h16.4"/><path d="M9.5 6.2V4.4a1.4 1.4 0 0 1 1.4-1.4h2.2a1.4 1.4 0 0 1 1.4 1.4v1.8"/>' +
            '<path d="M6.2 6.2 7 19.6a2 2 0 0 0 2 1.9h6a2 2 0 0 0 2-1.9l.8-13.4"/>' +
            '<path d="M10.4 10.2v7M13.6 10.2v7"/>',
        help: '<circle cx="12" cy="12" r="9"/>' +
            '<path d="M9.4 9.3a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.2-2.6 4"/>' +
            '<path d="M12 17.4h.01"/>',
        sparkle: '<path d="M12 3.2 13.7 9l5.8 1.7-5.8 1.7L12 18.2l-1.7-5.8L4.5 10.7 10.3 9z"/>' +
            '<path d="M18.6 3v3.2M17 4.6h3.2"/>',
        pencil: '<path d="M16.5 3.9a2.1 2.1 0 0 1 3 3L8.9 17.5l-4 1 1-4z"/><path d="M14.6 5.8l3 3"/>',
        inkHand: '<path d="M8 12V5a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-6a1.5 1.5 0 0 1 3 0v7-3a1.5 1.5 0 0 1 3 0v6c0 4-3 6-6 6h-2c-2 0-3-1-4-3l-4-5a1.5 1.5 0 0 1 2-2l2 1z"/>',
        inkLasso: '<ellipse cx="12" cy="10" rx="9" ry="6" stroke-dasharray="3 3"/><path d="M7 14c-4 7 4 9 6 4"/>',
        inkPointer: '<path d="M5.6 3.4 18 11.2l-5.4 1.3-2.6 5.1z"/><path d="m12.4 12.6 5.4 6"/>',
        inkConnector: '<circle cx="5.4" cy="18.6" r="2.3"/><circle cx="18.6" cy="5.4" r="2.3"/>' +
            '<path d="M7.4 16.6C9 11 11 9 16.6 7.4" stroke-dasharray="3 2.6"/>',
        inkMarker: '<path d="m13 3 7 7-8 8-7-7zM5 11l-2 7 3 3 6-3M3 21h7"/>',
        inkEraser: '<path d="m14 3 7 7-10 11H6l-4-4zM8 11l8 8M11 21h10"/>',
        inkText: '<path d="M3.8 7V4.4h16.4V7"/><path d="M12 4.4v15.2"/><path d="M8.4 19.6h7.2"/>',
        inkTextFix: '<path d="M3.4 5.2h17.2"/>' +
            '<rect x="3.4" y="9" width="9.6" height="4.6" rx="1.2"/>' +
            '<path d="M3.4 18h8"/>' +
            '<path d="m15.8 18.4 1-3.2 4.4-4.4 2.2 2.2-4.4 4.4z"/>',
        inkShapes: '<path d="m7 3 5 8H2z"/><circle cx="17" cy="7" r="4"/><rect x="4" y="15" width="7" height="6" rx="1"/><circle cx="18" cy="18" r="3"/>',
        inkPen: '<path d="m16.5 2.9 4.6 4.6-1.9 1.9-4.6-4.6z"/>' +
            '<path d="m14.6 4.8 4.6 4.6-8.6 8.6-6.1 1.5 1.5-6.1z"/>' +
            '<path d="m5.5 14.9 3.6 3.6"/>',
        inkNote: '<path d="M4.2 5.4a1.6 1.6 0 0 1 1.6-1.6h12.4a1.6 1.6 0 0 1 1.6 1.6v8.4L13.8 19.8H5.8a1.6 1.6 0 0 1-1.6-1.6z"/>' +
            '<path d="M19.8 13.8h-4.4a1.6 1.6 0 0 0-1.6 1.6v4.4"/>',
        inkLaser: '<circle cx="12" cy="12" r="2.2"/>' +
            '<path d="M12 3.4v3M12 17.6v3M3.4 12h3M17.6 12h3"/>' +
            '<path d="m5.9 5.9 2.1 2.1M16 16l2.1 2.1M18.1 5.9 16 8M8 16l-2.1 2.1"/>',
        inkRuler: '<rect x="1.6" y="7.4" width="20.8" height="9.2" rx="1.8" ' +
            'transform="rotate(-20 12 12)"/>' +
            '<path d="m7.1 8.6 1.2 2.4M10.6 7.3l1.2 2.4M14.1 6.1l1.2 2.4M17.6 4.8l1.2 2.4"/>',
        inkCover: '<rect x="2.6" y="9" width="18.8" height="6" rx="1.6"/>' +
            '<path d="M5.4 5.6h13.2M5.4 18.4h13.2"/>',
        inkSymbol: '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="3"/>' +
            '<path d="M13.2 6.8 8.6 13h3.4l-.8 4.6 4.6-6.2h-3.4z"/>',
        inkStamp: '<path d="M8.4 10.4V7.2a3.6 3.6 0 0 1 7.2 0v3.2"/>' +
            '<path d="M4.6 14.4h14.8l-.8-2.2a2 2 0 0 0-1.9-1.4H7.3a2 2 0 0 0-1.9 1.4z"/>' +
            '<rect x="4.6" y="17.4" width="14.8" height="3.4" rx="1.4"/>',
        penFountain: '<path d="M12 20.8c-3.7-3.8-5.6-7.2-5.6-10.4A5.6 5.6 0 0 1 12 4.8' +
            'a5.6 5.6 0 0 1 5.6 5.6c0 3.2-1.9 6.6-5.6 10.4z"/>' +
            '<path d="M12 8.6v8.8"/><circle cx="12" cy="11" r="1.1"/>',
        penBall: '<path d="M9.2 6.4a2.8 2.8 0 0 1 5.6 0v8.4H9.2Z"/>' +
            '<path d="M9.2 14.8h5.6L12 19.2Z"/>' +
            '<circle cx="12" cy="20.6" r="1.1"/>' +
            '<path d="M14.8 6.6h1.6v5"/>',
        penBrush: '<path d="M9.8 3.4 3.4 9.8"/>' +
            '<path d="m6.6 6.6 7.2 7.2a3.2 3.2 0 0 1 .9 1.7l.4 2.2-2.2-.4a3.2 3.2 0 0 1-1.7-.9z"/>' +
            '<path d="M15.6 15.4c1.5 1.5 1.1 3.6 3.6 4.6-1 .6-2.2.8-3.3.4-1.6-.5-2.5-2-2.1-3.5"/>',
        penPencil: '<path d="M19 2.6 21.4 5 10.6 15.8 3.6 20.4 8.2 13.4Z"/>' +
            '<path d="M17 4.6 19.4 7M8.2 13.4 10.6 15.8"/>',
        penEarth: '<path d="M12 3.4v9.2"/><path d="M5.6 12.6h12.8M7.8 16.2h8.4M10 19.8h4"/>',
        penWire: '<path d="M3.4 8.2h17.2M3.4 12h17.2M3.4 15.8h17.2"/>' +
            '<circle cx="16.4" cy="8.2" r="1.5"/><circle cx="12" cy="12" r="1.5"/>' +
            '<circle cx="7.6" cy="15.8" r="1.5"/>',
        eraseAll: '<circle cx="12" cy="12" r="7.4"/>',
        eraseHalf: '<circle cx="12" cy="12" r="7.4"/><path d="M12 4.6v14.8"/>' +
            '<path d="M12 4.6a7.4 7.4 0 0 1 0 14.8" fill="currentColor" stroke="none"/>',
        eraseMarker: '<path d="m13 3.6 6.4 6.4-7.4 7.4-6.4-6.4z"/><path d="M5.2 12.4 3.4 19l6.6-1.8"/>',
        dockTop: '<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.6"/>' +
            '<path d="M3.4 8.4h17.2" stroke-width="2.4"/>',
        dockLeft: '<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.6"/>' +
            '<path d="M8.4 3.4v17.2" stroke-width="2.4"/>',
        dockRight: '<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.6"/>' +
            '<path d="M15.6 3.4v17.2" stroke-width="2.4"/>',
        dockBottom: '<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.6"/>' +
            '<path d="M3.4 15.6h17.2" stroke-width="2.4"/>',
        eraserAuto: '<path d="M5 15.2 12.6 7.6a2 2 0 0 1 2.8 0l3 3a2 2 0 0 1 0 2.8L15.6 17H8.4z"/>' +
            '<path d="M4 20.4h16"/>' +
            '<path d="M17.6 4.6h3v3" stroke-width="1.6"/>',
        dockFree: '<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.6"/>' +
            '<rect x="8.6" y="9.8" width="6.8" height="4.4" rx="1.4" stroke-width="2.2"/>',
        formLine: '<path d="M4.6 19.4 19.4 4.6"/>',
        formArrow: '<path d="M3.6 12h15.6M14 6.8 19.4 12 14 17.2"/>',
        formRect: '<rect x="3.6" y="5.6" width="16.8" height="12.8"/>',
        formEllipse: '<ellipse cx="12" cy="12" rx="8.6" ry="6.6"/>',
        formTriangle: '<path d="M12 4.4 20.6 19.6H3.4z"/>',
        formRoundrect: '<rect x="5.4" y="7.4" width="13.2" height="9.2" rx="4.6"/>',
        formCurve: '<path d="M3.4 17.6c4.4 0 5.2-11.2 9.4-11.2s4.4 11.2 7.8 11.2"/>',
        scissors: '<circle cx="6.4" cy="6.4" r="2.6"/><circle cx="6.4" cy="17.6" r="2.6"/>' +
            '<path d="M8.6 8.2 20 19.4M20 4.6 8.6 15.8"/>',
        layerUp: '<rect x="7.4" y="3.2" width="9.2" height="9.2" rx="1.8"/>' +
            '<path d="M4.4 11.4v7.4a2 2 0 0 0 2 2h7.4"/>',
        layerDown: '<rect x="7.4" y="11.6" width="9.2" height="9.2" rx="1.8"/>' +
            '<path d="M19.6 12.6V5.2a2 2 0 0 0-2-2h-7.4"/>',
        alignLeft: '<path d="M3.6 5.6h16.8M3.6 10.4h10.6M3.6 15.2h16.8M3.6 20h10.6"/>',
        alignCenter: '<path d="M3.6 5.6h16.8M6.7 10.4h10.6M3.6 15.2h16.8M6.7 20h10.6"/>',
        alignRight: '<path d="M3.6 5.6h16.8M9.8 10.4h10.6M3.6 15.2h16.8M9.8 20h10.6"/>',
        ordnen: '<path d="M9.2 5.8h11.4M9.2 12h11.4M9.2 18.2h11.4"/>' +
            '<path d="m3.2 8.6 2.2-2.6 2.2 2.6M5.4 6v12M3.2 15.4l2.2 2.6 2.2-2.6"/>',
        scribble: '<path d="M2.8 15.6c2.6-4.4 4.6 3 7-1.6s4.6 3 7-1.6 3.2 1.2 4.4-1.2"/>',
        shapeSnap: '<circle cx="12" cy="12" r="7.4" stroke-dasharray="3.4 2.6"/>' +
            '<path d="M12 4.6v14.8M4.6 12h14.8"/>',
        inkImage: '<rect x="3.2" y="4.6" width="17.6" height="14.8" rx="2.6"/>' +
            '<circle cx="8.6" cy="9.6" r="1.7"/>' +
            '<path d="m4.4 17.4 4.8-4.6a1.6 1.6 0 0 1 2.2 0l3 2.9M14.6 14l1.6-1.5a1.6 1.6 0 0 1 2.2 0l1.4 1.3"/>',
        calendarDays: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/>' +
            '<path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"/>' +
            '<path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01"/>',
        calendar: '<rect x="3.2" y="5" width="17.6" height="16" rx="2.6"/>' +
            '<path d="M3.2 10h17.6M8.2 3v4M15.8 3v4"/>',
        bolt: '<path d="M13.2 2.5 4.5 13.4h6.2l-.9 8.1 8.7-10.9h-6.2z"/>',
        puzzle: '<path d="M9.4 3.2h2.1a1.9 1.9 0 0 1 1.9 1.9 1.4 1.4 0 0 0 2.8 0 1.9 1.9 0 0 1 1.9-1.9' +
            'h1.5v4.2a1.4 1.4 0 0 0 0 2.8v4.2h-4.2a1.4 1.4 0 0 1-2.8 0H8.4v-4.2a1.4 1.4 0 0 0 0-2.8z"/>',
        graph: '<circle cx="12" cy="5.4" r="2.4"/><circle cx="5.2" cy="17" r="2.4"/>' +
            '<circle cx="18.8" cy="17" r="2.4"/><path d="m10.6 7.5-4 7.4M13.4 7.5l4 7.4M7.6 17h8.8"/>',
        tag: '<path d="M11.4 3.2H20a.8.8 0 0 1 .8.8v8.6a1.6 1.6 0 0 1-.47 1.13l-6.8 6.8' +
            'a1.6 1.6 0 0 1-2.26 0l-7.53-7.53a1.6 1.6 0 0 1 0-2.26l6.8-6.8A1.6 1.6 0 0 1 11.4 3.2z"/>' +
            '<path d="M16.6 7.4h.01"/>',
        cards: '<rect x="7.5" y="3.5" width="13" height="13" rx="2.2"/>' +
            '<path d="M16.5 20.5H6a2.5 2.5 0 0 1-2.5-2.5V7.5"/>',
        checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.2 12.4 2.6 2.6 5-5.4"/>',
        compass: '<circle cx="12" cy="12" r="9"/><path d="m15.2 8.8-1.9 4.5-4.5 1.9 1.9-4.5z"/>',
        clipboard: '<rect x="4.6" y="4.4" width="14.8" height="16.4" rx="2.4"/>' +
            '<path d="M9 4.4V3.6a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 3.6v.8"/>' +
            '<path d="m8.8 12.6 2 2 4.4-4.4"/>',
        building: '<path d="M3 20.6h18"/><path d="m12 3.4 8 4.4H4z"/>' +
            '<path d="M6.4 11v6.4M10.1 11v6.4M13.9 11v6.4M17.6 11v6.4"/>',
        briefcase: '<rect x="2.8" y="7.2" width="18.4" height="13" rx="2.4"/>' +
            '<path d="M8.6 7.2V5.4a2 2 0 0 1 2-2h2.8a2 2 0 0 1 2 2v1.8"/>' +
            '<path d="M2.8 12.6h18.4"/>',
        chart: '<path d="M3.6 20.4h16.8"/><path d="M6.6 20.4v-6M11 20.4V7.6M15.4 20.4v-4M19.8 20.4V11"/>',
        undo: '<path d="M3.6 8.4h9.2a6 6 0 0 1 0 12H7.4"/><path d="M7.4 4.2 3.4 8.4l4 4.2"/>',
        redo: '<path d="M20.4 8.4h-9.2a6 6 0 0 0 0 12h5.4"/><path d="M16.6 4.2l4 4.2-4 4.2"/>',
        copy: '<rect x="8.6" y="8.6" width="11.6" height="11.6" rx="2.2"/>' +
            '<path d="M15.6 5.4V4.9a1.5 1.5 0 0 0-1.5-1.5H5.3A1.5 1.5 0 0 0 3.8 4.9v8.8a1.5 1.5 0 0 0 1.5 1.5h.5"/>',
        shield: '<path d="M12 3.2 4.6 6.1v5.6c0 4.4 3 8.1 7.4 9.1 4.4-1 7.4-4.7 7.4-9.1V6.1z"/>' +
            '<path d="m9 12.2 2.2 2.2 4-4.4"/>',
        download: '<path d="M12 3.8v11.7"/><path d="m7.8 11.3 4.2 4.2 4.2-4.2"/>' +
            '<path d="M4 15v3.6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V15"/>',
        page: '<path d="M6 3.2h7.4L19 8.8v12a1.6 1.6 0 0 1-1.6 1.6H6a1.6 1.6 0 0 1-1.6-1.6V4.8"' +
            ' /><path d="M13.4 3.2v5.6H19"/><path d="M8 13h8M8 17h5"/>',
        book: '<path d="M4.4 4.6A1.6 1.6 0 0 1 6 3h5.2v18H6a1.6 1.6 0 0 1-1.6-1.6z"/>' +
            '<path d="M12.8 3H18a1.6 1.6 0 0 1 1.6 1.6v14.8A1.6 1.6 0 0 1 18 21h-5.2z"/>',
        camera: '<path d="M3.4 8.6A1.6 1.6 0 0 1 5 7h2.6l1.5-2.4h5.8L16.4 7H19a1.6 1.6 0 0 1 1.6 1.6v9.8' +
            'A1.6 1.6 0 0 1 19 20H5a1.6 1.6 0 0 1-1.6-1.6z"/><circle cx="12" cy="13.2" r="3.8"/>',
        flag: '<path d="M5.4 21V3.4"/><path d="M5.4 4.2h11.4l-2 3.6 2 3.6H5.4"/>',
        medal: '<circle cx="12" cy="15" r="5.6"/><path d="m9 9.6-2.8-6.2M15 9.6l2.8-6.2"/>' +
            '<path d="M8.6 3.4h6.8"/>',
        party: '<path d="m3.4 20.6 4.2-11.2 7 7z"/><path d="m11.6 9.4 3-3"/>' +
            '<path d="M15.6 3.4v.01M20 7.6v.01M18.4 12.6v.01M20.4 2.6v.01"/>',
        sun: '<circle cx="12" cy="12" r="4.2"/>' +
            '<path d="M12 2.6v2.4M12 19v2.4M2.6 12h2.4M19 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7' +
            'M18.7 5.3 17 7M7 17l-1.7 1.7"/>',
        rocket: '<path d="M12 2.6c3 2.2 4.6 5.5 4.6 9.2L14.4 17H9.6L7.4 11.8C7.4 8.1 9 4.8 12 2.6z"/>' +
            '<circle cx="12" cy="10" r="1.9"/><path d="M9.6 17 7 21l3.6-1.4M14.4 17 17 21l-3.6-1.4"/>',
        box: '<rect x="3.8" y="3.8" width="16.4" height="16.4" rx="3.2"/>',
        boxChecked: '<rect x="3.8" y="3.8" width="16.4" height="16.4" rx="3.2"/>' +
            '<path d="m8.2 12.2 2.6 2.6 5-5.4"/>',
        robot: '<rect x="3.6" y="7.6" width="16.8" height="12.8" rx="3.2"/>' +
            '<path d="M12 3.2v4.4"/><circle cx="12" cy="2.6" r="1.2"/>' +
            '<path d="M8.6 12.6v1.6M15.4 12.6v1.6M9.4 17h5.2"/>',
        database: '<ellipse cx="12" cy="5.8" rx="7.6" ry="2.9"/>' +
            '<path d="M4.4 5.8v12.4c0 1.6 3.4 2.9 7.6 2.9s7.6-1.3 7.6-2.9V5.8"/>' +
            '<path d="M4.4 12c0 1.6 3.4 2.9 7.6 2.9s7.6-1.3 7.6-2.9"/>',
        share: '<path d="M4 12v6.6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V12"/>' +
            '<path d="M12 15.2V3.6"/><path d="m8 7.4 4-3.8 4 3.8"/>',
        history: '<path d="M3.6 12a8.4 8.4 0 1 0 2.5-6"/><path d="M3.4 3.6v4.2h4.2"/>' +
            '<path d="M12 7.6V12l3 1.8"/>',
        clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.1 1.9"/>',
        link: '<path d="M10.3 13.7a4.2 4.2 0 0 0 6.1.35l2.6-2.6a4.2 4.2 0 0 0-5.94-5.94l-1.5 1.5"/>' +
            '<path d="M13.7 10.3a4.2 4.2 0 0 0-6.1-.35L5 12.55a4.2 4.2 0 0 0 5.94 5.94l1.5-1.5"/>',
        lockOpen: '<rect x="4.2" y="10.4" width="15.6" height="10.4" rx="2.4"/>' +
            '<path d="M8.2 10.4V7a3.8 3.8 0 0 1 7.4-1.2"/>',
        lock: '<rect x="4.2" y="10.4" width="15.6" height="10.4" rx="2.4"/>' +
            '<path d="M8.2 10.4V7a3.8 3.8 0 0 1 7.6 0v3.4"/>',
        star: '<path d="m12 3.4 2.7 5.6 6.1.85-4.4 4.3 1.05 6.1L12 17.4l-5.45 2.85 1.05-6.1' +
            '-4.4-4.3 6.1-.85z"/>',
        dots: '<circle cx="5.4" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/>' +
            '<circle cx="18.6" cy="12" r="1.5"/>',
        arrowL: '<path d="M20 12H4.4"/><path d="m10 5.6-6 6.4 6 6.4"/>',
        arrowR: '<path d="M4 12h15.6"/><path d="m14 5.6 6 6.4-6 6.4"/>',
        bell: '<path d="M18 9a6 6 0 1 0-12 0c0 5.2-2 6.7-2 6.7h16S18 14.2 18 9z"/>' +
            '<path d="M13.7 19.2a2 2 0 0 1-3.4 0"/>',
        image: '<rect x="3.2" y="4.8" width="17.6" height="14.4" rx="2.4"/>' +
            '<circle cx="8.6" cy="10" r="1.7"/>' +
            '<path d="m3.6 17.2 4.9-4.4a1.8 1.8 0 0 1 2.4 0l3.5 3.2' +
            'a1.8 1.8 0 0 0 2.4 0l3.6-3.2"/>',
        video: '<rect x="2.8" y="5.4" width="12.8" height="13.2" rx="2.4"/>' +
            '<path d="m15.6 10.4 5.6-3.2v9.6l-5.6-3.2z"/>',
        audio: '<path d="M4 9.4h3.2L12 5.2v13.6L7.2 14.6H4z"/>' +
            '<path d="M15.6 9.6a3.6 3.6 0 0 1 0 4.8"/>' +
            '<path d="M18 7a7 7 0 0 1 0 10"/>',
        paperclip: '<path d="M19.6 11.4 12 19a4.6 4.6 0 0 1-6.5-6.5l8-8a3 3 0 0 1 4.3 4.3' +
            'l-8 8a1.5 1.5 0 0 1-2.1-2.1l7.2-7.2"/>',
        bookmark: '<path d="M6.4 3.8h11.2a1.6 1.6 0 0 1 1.6 1.6v14.8L12 16.4l-7.2 3.8V5.4' +
            'a1.6 1.6 0 0 1 1.6-1.6z"/>',
        lightbulb: '<path d="M9.4 18.4h5.2"/><path d="M10 21.2h4"/>' +
            '<path d="M8.2 14.6a6 6 0 1 1 7.6 0c-.9.7-1.4 1.5-1.5 2.4h-4.6' +
            'c-.1-.9-.6-1.7-1.5-2.4z"/>',
        palette: '<path d="M12 3.2a8.8 8.8 0 0 0 0 17.6c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2' +
            '-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8h2.1a4.9 4.9 0 0 0 4.9-4.9' +
            'C21.6 6.1 17.3 3.2 12 3.2z"/>' +
            '<circle cx="7.6" cy="11.4" r="1.1"/><circle cx="10.2" cy="7.4" r="1.1"/>' +
            '<circle cx="15" cy="7.6" r="1.1"/>',
        smile: '<circle cx="12" cy="12" r="8.8"/>' +
            '<path d="M8.4 13.8a4.4 4.4 0 0 0 7.2 0"/>' +
            '<path d="M9.2 9.4h.01M14.8 9.4h.01"/>',
        move: '<path d="M12 3.6v16.8M3.6 12h16.8"/>' +
            '<path d="m9.2 6.4 2.8-2.8 2.8 2.8M9.2 17.6l2.8 2.8 2.8-2.8"/>' +
            '<path d="m6.4 9.2-2.8 2.8 2.8 2.8M17.6 9.2l2.8 2.8-2.8 2.8"/>',
        grid: '<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.2"/>' +
            '<path d="M3.4 9.2h17.2M3.4 14.8h17.2M9.2 3.4v17.2M14.8 3.4v17.2"/>',
        circleDot: '<circle cx="12" cy="12" r="8.8"/><circle cx="12" cy="12" r="3.2"/>',
        filter: '<path d="M3.8 5.2h16.4l-6.3 7.4v5.8l-3.8 2.2v-8z"/>',
        sort: '<path d="M4 6.4h9.6M4 12h6.4M4 17.6h3.2"/>' +
            '<path d="M17.6 5.6v12.8"/><path d="m14.6 15.4 3 3 3-3"/>',
        comment: '<path d="M20.5 11.8c0 3.9-3.8 7-8.5 7a10 10 0 0 1-2.8-.4L4.4 20l1.4-3.7' +
            'A6.6 6.6 0 0 1 3.5 11.8c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7z"/>',
        pages: '<path d="M8.4 2.8h6.2L19 7.2v11.2a1.6 1.6 0 0 1-1.6 1.6H8.4a1.6 1.6 0 0 1-1.6-1.6V4.4' +
            'a1.6 1.6 0 0 1 1.6-1.6z"/><path d="M14.6 2.8v4.4H19"/>' +
            '<path d="M4.2 6.6v12.8a2.4 2.4 0 0 0 2.4 2.4h8.2"/>',
        printer: '<path d="M7 9V3.6h10V9"/><rect x="4" y="9" width="16" height="7.4" rx="2"/>' +
            '<path d="M7 14.2h10v6.2H7z"/>',
        eye: '<path d="M2.6 12S6.4 5.6 12 5.6 21.4 12 21.4 12 17.6 18.4 12 18.4 2.6 12 2.6 12z"/>' +
            '<circle cx="12" cy="12" r="3.1"/>',
        play: '<path d="M8.4 5.4 18.6 12 8.4 18.6z"/>',
        settings: '<circle cx="12" cy="12" r="3.1"/>' +
            '<path d="M19.5 14.6a1.5 1.5 0 0 0 .3 1.7l.06.05a1.8 1.8 0 1 1-2.6 2.6l-.05-.06' +
            'a1.5 1.5 0 0 0-1.7-.3 1.5 1.5 0 0 0-.9 1.37v.14a1.8 1.8 0 1 1-3.6 0v-.07' +
            'a1.5 1.5 0 0 0-1-1.37 1.5 1.5 0 0 0-1.7.3l-.05.06a1.8 1.8 0 1 1-2.6-2.6l.06-.05' +
            'a1.5 1.5 0 0 0 .3-1.7 1.5 1.5 0 0 0-1.37-.9H4.5a1.8 1.8 0 1 1 0-3.6h.07' +
            'a1.5 1.5 0 0 0 1.37-1 1.5 1.5 0 0 0-.3-1.7l-.06-.05a1.8 1.8 0 1 1 2.6-2.6l.05.06' +
            'a1.5 1.5 0 0 0 1.7.3h.07a1.5 1.5 0 0 0 .9-1.37V4.5a1.8 1.8 0 1 1 3.6 0v.07' +
            'a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.7-.3l.05-.06a1.8 1.8 0 1 1 2.6 2.6l-.06.05' +
            'a1.5 1.5 0 0 0-.3 1.7v.07a1.5 1.5 0 0 0 1.37.9h.14a1.8 1.8 0 1 1 0 3.6h-.07' +
            'a1.5 1.5 0 0 0-1.37.9z"/>',
        user: '<circle cx="12" cy="8.2" r="3.9"/><path d="M4.6 20.4a7.6 7.6 0 0 1 14.8 0"/>',
        menu: '<path d="M3.8 6.5h16.4M3.8 12h16.4M3.8 17.5h16.4"/>',
        close: '<path d="M6 6l12 12M18 6L6 18"/>',
        chevronL: '<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>',
        chevronR: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
        chevronD: '<path d="m5.5 9.5 6.5 6.5 6.5-6.5"/>',
        panelL: '<rect x="3" y="4.5" width="18" height="15" rx="2.6"/><path d="M9.5 4.5v15"/>',
        panelR: '<rect x="3" y="4.5" width="18" height="15" rx="2.6"/><path d="M14.5 4.5v15"/>',
        maximize: '<path d="M9 3.5H5.5a2 2 0 0 0-2 2V9"/>' +
            '<path d="M15 3.5h3.5a2 2 0 0 1 2 2V9"/>' +
            '<path d="M15 20.5h3.5a2 2 0 0 0 2-2V15"/>' +
            '<path d="M9 20.5H5.5a2 2 0 0 1-2-2V15"/>',
        plug: '<path d="M9 3.2v4.4M15 3.2v4.4"/>' +
            '<path d="M6.4 7.6h11.2v3.6a5.6 5.6 0 0 1-11.2 0z"/><path d="M12 16.8v4"/>',
        keyboard: '<rect x="2.8" y="5.6" width="18.4" height="12.8" rx="2.4"/>' +
            '<path d="M6.6 9.6h.01M9.9 9.6h.01M13.2 9.6h.01M16.5 9.6h.01' +
            'M8.2 12.4h.01M11.5 12.4h.01M14.8 12.4h.01M8.4 15.2h7.2"/>',
        globe: '<circle cx="12" cy="12" r="8.8"/><path d="M3.2 12h17.6"/>' +
            '<path d="M12 3.2c2.3 2.4 3.5 5.3 3.5 8.8s-1.2 6.4-3.5 8.8' +
            'c-2.3-2.4-3.5-5.3-3.5-8.8s1.2-6.4 3.5-8.8z"/>',
        users: '<circle cx="9.2" cy="8.4" r="3.5"/><path d="M2.8 20a6.6 6.6 0 0 1 12.8 0"/>' +
            '<path d="M15.4 5.1a3.4 3.4 0 0 1 0 6.6"/><path d="M17.8 14.5a6.4 6.4 0 0 1 3.4 5.5"/>',
        key: '<circle cx="7.6" cy="16.2" r="4.2"/><path d="m10.6 13.2 9.6-9.6"/>' +
            '<path d="m17.4 6.4 2.6 2.6M14.6 9.2l2 2"/>',
        creditCard: '<rect x="2.8" y="5.2" width="18.4" height="13.6" rx="2.4"/>' +
            '<path d="M2.8 9.8h18.4M6.6 14.8h3.8"/>',
        info: '<circle cx="12" cy="12" r="8.8"/><path d="M12 11v5.4M12 7.8h.01"/>',
        cloud: '<path d="M7 18.6h10.4a4 4 0 0 0 .5-7.97 5.8 5.8 0 0 0-11.1-1.3' +
            'A4.6 4.6 0 0 0 7 18.6z"/>',
        archive: '<rect x="3" y="4" width="18" height="4.6" rx="1.2"/>' +
            '<path d="M4.8 8.6v9.6a1.8 1.8 0 0 0 1.8 1.8h10.8a1.8 1.8 0 0 0 1.8-1.8V8.6"/>' +
            '<path d="M10 12.4h4"/>',
        widthWide: '<path d="M3.4 5v14M20.6 5v14M7 12h10"/>' +
            '<path d="m9.4 9.4-2.6 2.6 2.6 2.6M14.6 9.4l2.6 2.6-2.6 2.6"/>',
        widthNarrow: '<path d="M3.4 5v14M20.6 5v14M6.2 12h4.4M17.8 12h-4.4"/>' +
            '<path d="m8.2 9.6 2.4 2.4-2.4 2.4M15.8 9.6l-2.4 2.4 2.4 2.4"/>',
        textSize: '<path d="M3.4 6.2h10M8.4 6.2v12.6M14.4 11.6h6.4M17.6 11.6v7.2"/>',
        typeface: '<path d="m3 19 5-13.6L13 19M4.8 14.4h6.4"/>' +
            '<circle cx="17.4" cy="15.8" r="3.1"/><path d="M20.5 12.6v6.4"/>',
        crumbs: '<rect x="2.4" y="9" width="5.6" height="6" rx="1.5"/>' +
            '<rect x="16" y="9" width="5.6" height="6" rx="1.5"/>' +
            '<path d="m10.8 9.4 2.6 2.6-2.6 2.6"/>',
        hash: '<path d="M9.8 3.6 7.8 20.4M16.2 3.6l-2 16.8M4.4 8.8h16M3.6 15.2h16"/>',
        translate: '<path d="M3.4 5.8h8.4M7.6 3.4v2.4M10 5.8c-.7 3.8-2.8 6.6-6.2 8.4' +
            'M5.6 8.8c1.2 2.3 3 4 5.2 5"/><path d="m12.4 20.4 3.8-9.2 3.8 9.2M13.6 17.6h5.2"/>',
        moveTo: '<path d="M3.2 7.2a1.8 1.8 0 0 1 1.8-1.8h4l2 2.2h8a1.8 1.8 0 0 1 1.8 1.8v8.8' +
            'a1.8 1.8 0 0 1-1.8 1.8H5a1.8 1.8 0 0 1-1.8-1.8z"/>' +
            '<path d="M8.6 13.6h6.6m-2.4-2.4 2.4 2.4-2.4 2.4"/>',
        suggest: '<path d="M3.6 6.4h14M3.6 11h8.4M3.6 15.6h4.4"/>' +
            '<path d="M17.4 11.4a1.7 1.7 0 0 1 2.4 2.4l-6 6-3.1.8.8-3.1z"/>',
        alarm: '<circle cx="12" cy="13.4" r="7.2"/><path d="M12 9.8v3.8l2.4 1.6"/>' +
            '<path d="m3.8 6 3-2.4M20.2 6l-3-2.4"/>',
        code: '<path d="m8.2 7.2-4.8 4.8 4.8 4.8M15.8 7.2l4.8 4.8-4.8 4.8"/>' +
            '<path d="m13.6 4.8-3.2 14.4"/>'
    };
    const hat = (id) => Object.prototype.hasOwnProperty.call(ZEICHEN, id);
    const alsSvg = (id, groesse = 18) => {
        const d = ZEICHEN[id];
        if (!d)
            return '';
        return `<svg class="sym" viewBox="0 0 24 24" width="${groesse}" height="${groesse}" ` +
            `fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" ` +
            `stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
    };
    const fuelle = (wurzel = document) => {
        let gesetzt = 0;
        wurzel.querySelectorAll('[data-sym]').forEach(el => {
            const id = el.dataset.sym || '';
            const gr = Number(el.dataset.symGroesse || '') || 18;
            const svg = alsSvg(id, gr);
            if (!svg) {
                console.warn('[Symbole] unbekannt:', id);
                return;
            }
            el.innerHTML = svg;
            gesetzt++;
        });
        return gesetzt;
    };
    const alle = () => Object.keys(ZEICHEN).sort();
    return { hat, alsSvg, fuelle, alle };
})();
