# Native SwiftUI: UI-/UX-Regeln

1. Nutzerziel vor Dekoration: Primäraktion muss sofort erkennbar sein.
2. Navigations- und Dokumentzustände bleiben beim Wechsel konsistent.
3. Versteckte Gesten immer mit sichtbarer Alternative (z. B. Dock-Pfeil).
4. Auf iOS i. d. R. mindestens 44 × 44 pt antippbare Flächen; Icons dürfen kleiner sein.
5. Auf macOS Maus, Trackpad, Tastatur, Kontextmenü und Hover berücksichtigen.
6. VoiceOver: benannte Controls, Zustandsansagen, sinnvolle Fokusreihenfolge.
7. Dynamic Type: Text darf keine Pflichtaktion unbenutzbar machen.
8. Reduce Motion: Parallax, endlose Schleifen und große Bewegungen abschalten oder ersetzen.
9. Reduce Transparency: Materialien auf Lesbarkeit prüfen.
10. Hell/Dunkel, hoher Kontrast und alle Dynamic-Type-Größen testen.
11. Kurze Reaktionszeiten; Animation darf Nutzerinteraktionen nicht blockieren.
12. Jede Änderung hat klares visuelles Feedback und ggf. Undo.
13. Drag/Drop soll die direkte Manipulation stärken, niemals alleiniger Zugang sein.
14. Auswahl, Laden, Leerzustand, Fehler, Erfolg und Offlinezustand gestalten.
15. Bewegungen transportieren Ursache → Wirkung, nicht nur Entertainment.
16. Der Ausgangspunkt einer Bewegung bleibt erkennbar.
17. Interaktive Animation ist unterbrechbar und passt sich neuen Zielen an.
18. Performance: nur nötige Views aktualisieren, Schatten/Blur sparsam benutzen.
19. Animationen auf echten 60/120-Hz-Geräten prüfen; nicht nur Preview.
20. Auf Mac: Space/Enter und Escape nach Erwartungen; Dock ⌘⇧D ist Beispiel, nicht Systemstandard.
21. Safe Areas, Dynamic Island und Home Indicator respektieren.
22. Apple-konforme Navigation bevorzugen; extreme UI-Experimente bewusst kennzeichnen.
23. Keine Datenlöschung ohne Bestätigung und Wiederherstellungspfad.
24. Sensible Daten nicht in Debug-Logs schreiben.
25. Premium bedeutet spürbare Qualität, nicht möglichst viele Effekte.
