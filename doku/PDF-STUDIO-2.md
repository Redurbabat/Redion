# PDF-Studio 2: erster geprüfter Schritt

Stand: 24. Oktober 2026, Grundlage main a3917c1.

Der Radierer folgt jetzt auch den Zwischenpunkten aus getCoalescedEvents.
Eine schnelle Kurve wird nicht mehr durch eine löschende Sehne ersetzt.
Die letzte Position beim Abheben wird mitverarbeitet; ein unbewegter Tipp
löscht weiterhin nur die oberste getroffene Marke.

Die sichtbare Vorschau reagiert während der Geste. Erst das Ende schreibt
sie als einen Schritt in den bestehenden Verlauf und Store. pointercancel
stellt die Marken vor der Geste wieder her, ohne neuen Undo-Schritt.
Die bestehende Behandlung abgebrochener Handschrift bleibt erhalten.

Test622 prüft gegen die echte SVG-Ink-Schicht und den echten IndexedDB-Store
bei 390, 820 und 1440 Pixeln: Kurve versus Sehne, Endpunkt, Vorschau,
Abbruch, Undo/Redo, übereinanderliegende Striche und erneutes Laden.
Die Gegenprobe mit main scheitert an der Kurve: sie löscht den Nachbarn.
Die Pointer-Ereignisse sind synthetisch; kein Test auf einem echten iPhone.

Die restlichen Teile des Auftrags (Stiftleistung, Werkzeuganimation,
Zoomanker, Menüs und komplette PDF-Export-Rundreise) sind in diesem ersten
Commit noch offen. Keine Aussage über eine verbesserte physische Stiftlatenz.
