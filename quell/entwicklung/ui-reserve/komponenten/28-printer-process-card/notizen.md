# 28 – Printer Process Card

- Autor: spotift_5948
- Quelle: Uiverse.io
- Quelle-Status: chat-original-snippet — NUR DAS CSS liegt vor
- Redion-Bewertung: siehe doku/UI-KOMPONENTEN.md
- Redion-Entscheidung: produktiv-adaptiert
- Produktiver Ort: src/bereiche/wissen/werkzeuge.ts `drucken()` — die Drucker-Karte (E458)
- Produktive Fassung: src/schale/bedienung/drucker.ts, Stil `ru-drucker-…` in bausteine.css
- Anpassungen: nur in der produktiven Fassung — das Original hier bleibt unverändert
- Risiken: globale Klassen im Original (`.card`, `.btn`, `.status`, `.done` — nur im iframe sicher)

Zustände bereit·vorbereiten·rendern·speichern·fertig·fehler; nur echter Zustand (§4.17).

## Was vorliegt, und was nicht

Das CSS des Originals kam am 6. September 2026 im Gespräch, mit der
Kopfzeile „From Uiverse.io by spotift_5948", und liegt unverändert in
`original.css`. Der Autor stimmt mit dem Katalog überein; Struktur, Klassen
und Verhalten sind damit belegt.

Das HTML des Originals liegt NICHT vor — und wird nicht rekonstruiert. Die
Klassen liessen sich aus dem CSS ableiten, der sichtbare Text („Ready",
„Feeding" …) aber nur raten, und ein Archiv, das rät, ist keins. Erst wenn
das HTML eintrifft, entsteht `original.html`; bis dahin zeigt die Galerie
das CSS.

## Was die Redion-Fassung anders macht

Das Original spricht seine fünf Sätze aus einem Zeitgeber: alle 6,4 s
„Done", ob gedruckt wurde oder nicht. Die Drucker-Karte setzt jeden Zustand
an der Stelle im Druckweg, die ihn wahr macht — Bilder sammeln, Seiten
setzen, Dialog offen, fertig — und bewegt das Blatt nur, solange wirklich
gearbeitet wird. Details in `drucker.ts` und in ENTSCHEIDUNGEN.md E458.
