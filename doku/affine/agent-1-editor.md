# AFFiNE Agent 1 – Editor
Basis: a117f67b935b3fe37c7fc677140a9898481ecc03. PR #232 hatte bei der Prüfung bereits 459f5e09d17f279518c8c902d1031fdbf52829a4. Keine Aktualisierung der Basis. GitHub-API statt lokalem Worktree mit Nutzerfreigabe.

## Vertrag
RedionAffineEditor.create(host) erzeugt eine isolierte Instanz. Host.read(rootId) liefert einen vollständigen Baum bestehender Blockdatensätze (einschliesslich unbekannter Felder); Host.open öffnet eine bereits vorhandene Seite nach Berechtigungsprüfung. Host.render(container, rootId, readonly) bindet den vorhandenen Editor ein und liefert eine Aufräumfunktion; der Host muss Schreibschutz auch für DOM, Tastatur, Drag-and-Drop und Store erzwingen. Host.subscribe(listener) meldet abgeschlossene Änderungen und liefert eine Abmeldung. Host.updateText, move, undo und redo delegieren an vorhandene Store-/Verlaufsoperationen; Host muss Berechtigungen und atomare Änderungen selbst sicherstellen. Kein zweiter Undo-Stack.
- mount(target): bindet HTMLElement ein, höchstens einmal pro Instanz.
- unmount(): entfernt Renderbindung und Abonnement, vergisst Dokument und Listener.
- loadDocument(id): validiert und öffnet vorhandenes Dokument; keine Migration.
- serializeDocument(): validierte Kopie von rootId und blocks; keine Blob-Daten.
- onChange(listener): Snapshot nach Host-Meldung; Rückgabe ist Abmeldung.
- readonly(value): standardmässig true; Schreibbefehle bei true gesperrt.
- updateText(id,text), move(id,targetId,after=false): nur innerhalb des geöffneten Baums; keine zyklischen Verschiebungen.
- outline(): Überschriften in Baumreihenfolge, ohne Unterseiten zu durchsuchen.
- exportJSON()/parseJSON(text): Snapshot-Austausch, kein Import in produktive Ablage und kein vollständiges .redion-Backup.

## Funktionsmatrix
Bereits vorhanden (Quellcode/Register, keine Laufzeitabnahme): Rich Text, Blockdokumente, Überschriften, Absätze, Aufzählungen, nummerierte Listen, Checklisten, Zitate/Callouts, Code, Formeln, Links, Bilder, Anhänge, Verschachtelung, Drag-and-Drop, Slash-Menü, Kontextmenüs, Mehrfachauswahl, Tastaturkürzel, Seitenlinks, Markdown-Einfügen und Auswahl-Export.
Teilweise integriert: JSON-Snapshot, Gliederung, Lifecycle, Schreibschutz für Adapterbefehle, Textänderung und Verschiebevalidierung.
Vorbereitet: Host-Anbindung, Undo/Redo-Delegation, Dokumentnavigation, Formatierungsleiste über vorhandenen Host.
Offen: tatsächliche BlockSuite-Einbindung, Host-Implementierung, vollständiger Import/Export mit Blobs, persistentes Anlegen neuer Dokumente, reale iPhone-/Windows-Abnahme, AFFiNE-Kommentare, Kollaboration, Inline-Widgets, Embed-Adapter und vollständige Upstream-Inventur.
Vollständig integriert: keine neue Produktfunktion im laufenden RED-ION-Editor nachgewiesen.
Lizenzblocker: keine Enterprise-Übernahme; unklare Komponenten bleiben ausgeschlossen.

## Upstream und Lizenz
AFFiNE LICENSE nennt MIT ausser insbesondere Backend/native und Drittkomponenten. Gelesene package.json für @blocksuite/affine-rich-text und @blocksuite/store (0.27.5) nennen MIT. Rich Text verwendet Lit, Yjs, Zod, Signals und interne Workspace-Pakete; Store verwendet Yjs, RxJS, Zod, Sync und weitere Workspace-Pakete. blocks/widgets/fragments besitzen an den abgefragten Sammelpfaden kein package.json; vollständige Unterpaketprüfung offen. Kein Upstream-Code kopiert, keine neue Abhängigkeit.

## Zusammenführung
Gemeinsame Dateien gesperrt: Host an vorhandene App/Store/Ereignisse anschliessen, generiertes JavaScript erzeugen und in index.html/Offline-Manifest/Einzeldatei einbinden; Build- und Graphify-Abgleich durch Integrationsagent. Kein produktiver Import ohne Rechte-, Schema- und Blob-Prüfung. Snapshot ist bewusst kein neuer Speicherstandard.

## Tests
Eigene Tests: node --test pruefungen/affine/agent-1-editor/adapter.test.mts (benötigt vorhandenes TypeScript). NICHT GETESTET: Ausführung, vollständiger Typecheck, workspace-editor.mts, bestehende Regressionen, echte Speicherung, Offline-Browser, iPhone und Windows. API-Zugriff erlaubt keinen lokalen Repository-Testlauf. Kein Merge.
