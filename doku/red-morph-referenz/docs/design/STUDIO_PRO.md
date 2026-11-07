# Studio Pro — kreative Vorlagen, Presets und robuste Entwürfe

## Was neu ist

Der Editor unter `#/studio` hat drei vollständig bearbeitbare Startvorlagen:

- **Pulse Reactor**: realer Klickzustand, Status-Ausgabe und Reactiv-Glow.
- **Orbit Deck**: pausierbarer 3D-Orbit mit Geschwindigkeitsregler.
- **Liquid Synth**: zwei native Regler steuern Form und Farbe.

Zu **Original** und **Apple Depth** kommen **Magnetic Drift**, **Prism Light** und **Elastic Pop** als Bewegungspresets hinzu. Der Editor baut die finale HTML/CSS/JS-Ausgabe **einmal** mit `composeMotionPreset` zusammen. Das iframe rendert dieselbe Ausgabe, die beim Speichern unter dem neuen User Design landet und später exportiert wird. In der Vorschau läuft Code ausschließlich im sandboxed iframe mit CSP.

Alle Presets beachten `prefers-reduced-motion`, haben keinen externen Netzwerkzugriff und verlassen sich für die Bedienung auf die ursprünglichen nativen Controls des Designs.

## Entwürfe gehen beim Schließen nicht verloren

`app/src/custom/studioDraft.ts` sichert den Formularstand ca. 450 ms nach der letzten Änderung in `localStorage`, stellt beim Wiederöffnen die gültige Version 1 wieder her und begrenzt die Größe auf 800 kB. **Ein erfolgreicher Save löscht den Entwurf**, nicht das gespeicherte Design. Ein nicht verfügbarer Browser-Speicher erzeugt eine verständliche Meldung statt eines App-Absturzes.

Diese Entwürfe sind **nur lokal**: keine Synchronisierung, keine Kontoanmeldung und keine serverseitige Sicherung. Zur Weitergabe weiterhin den bestehenden **JSON-Export** im Design-Detail verwenden. Nicht vertrauenswürdige importierte Designs nur im isolierten iframe prüfen.

## Performance

Der typbasierte Katalog rendert zunächst **24 Karten/Previews** pro Kategorie und lädt per explizitem Button jeweils die nächsten 24. Kategorie- und Suchwechsel setzen die Anzeige zurück. Durch weniger iframes und weniger gleichzeitige Dokumente sinken DOM- und CPU-Last. Eine vollständige Virtualisierung wäre ein separates größeres Projekt.

## Qualität und Veröffentlichung

`cd app && npm run build && npm run test:unit && npm run test:smoke`

Unit-Tests prüfen Preset-Quellen, Syntax, reduzierte Bewegung, Importfähigkeit der Vorlagen und Draft-Fehlerpfade. Playwright testet Katalog-Paging, Browser-Restore, echte Button-Interaktion im iframe sowie das Speichern ohne verwaisten Entwurf auf 390px und 1280px.

Manuelle Restarbeit: Tastatur-Navigation mit Screenreader, Kontrast, Performance auf günstigen Telefonen und Legacy-Core-Code-Snippets gegen ihre Vorschau abgleichen. Experimente bleiben bis dahin `candidate` bzw. `experiment`.

## Schutz vorhandener Designs und Vorschautreue

Beim Laden aus dem Browser werden eigene Designs jetzt gegen gültige Feldtypen, Code-/Tag-Grenzen und eindeutige IDs geprüft. Beschädigte oder als `seed` ausgegebene Nutzer-Einträge werden übersprungen, ohne alle validen Entwürfe zu verlieren.

Der Live-Preview-Renderer überschreibt nicht länger pauschal die `transition-duration` des kopierten CSS. Der Motion-Speed-Regler arbeitet über die Web Animations API an tatsächlich laufenden Animationen und Übergängen. Somit bleibt das visuelle Verhalten bei Geschwindigkeit 1 so nah wie möglich am Originalcode. CSS-Transitions ohne laufenden Animations-Eintrag lassen sich nicht beliebig skalieren: die Einstellung ist als Vorschau-Option, nicht als Bestandteil des exportierten Codes zu verstehen.
