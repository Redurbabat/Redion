# Sicherheitsgrenzen der Desktop-Steuerung

- Standardmässig aus. Aktivierung, zusätzliche Funktions-/Schreibrechte und
  App-Start verlangen einen echten nativen Bestätigungsdialog.
- Jede Verbindung hat eine eigene höchstens 30 Minuten gültige Sitzung.
  Programmname ist Selbstauskunft, kein Signaturnachweis. Neue Sitzungen
  werden im App-Fenster ausdrücklich erlaubt.
- Named Pipe statt öffentlichem Listener. Token pro Prozess neu; höchstens
  vier Verbindungen, 256-KiB-Framegrenze und begrenzte Anfragezeit.
- Der native Ordner erhält per Windows-SID eine eigene ACL ohne geerbte
  Freigaben. Tokens gelangen nicht in Renderer, Toolergebnis oder Protokoll.
  Schutz gilt an der lokalen Benutzergrenze, nicht gegen Malware mit denselben
  Benutzerrechten oder gegen einen Windows-Administrator.
- Umgeleitete Verzeichnisse und Verbindungsdateien werden abgewiesen, auch
  beim Abschalten vor dem ersten Start. Eine echte Windows-Junction-Gegenprobe
  war zuerst rot und besteht nach der Korrektur: ausserhalb des eigenen
  Verzeichnisses wird keine Testdatei verändert oder gelöscht.
- Derselbe endliche Eingabevertrag wird in MCP und Main geprüft. Unbekannte
  Werkzeuge/Felder, gefährliche Objektschlüssel, ungültige Typen/IDs/Mengen
  werden abgewiesen. Bereiche prüfen Konto-, Dokument-, Sperr- und Spaltenrechte.
- Kein allgemeines getMeta, keine API-Schlüssel, keine freien Pfade, keine
  Shell und kein beliebiges eval/executeJavaScript. Entwicklerrechte sind getrennt.
- Trennen/Abschalten widerruft Sitzungen und vorbereitete Freigaben. Eine schon
  abgeschlossene Aktion wird nicht still zurückgesetzt. RESULT_UNKNOWN verlangt
  Prüfung des tatsächlichen App-Stands vor einem erneuten Schreibaufruf.
- Papierkorb und privater Export brauchen zusätzliche Bestätigung: 60 Sekunden,
  einmalig, an Sitzung, Werkzeug und exakte Argumente gebunden. Der MCP-Client
  kann sie nicht selbst genehmigen. Kein endgültiges Löschen vorhanden.
- Listen/Leseantworten sind begrenzt. Kein automatischer Vollupload. Ein
  angeforderter Inhalt geht an den verbundenen Client und bei Nutzung in
  ChatGPT an ChatGPT. Dokumentanweisungen bleiben untrusted data.
- Protokoll nur Werkzeug, Operationskennung, Zeit, Status, fester Fehlercode;
  höchstens 200 Einträge im Prozess. Keine Titel, Argumente, Ergebnisse oder Tokens.

App-Start nimmt keinen Pfad und keine Startargumente entgegen. Nur die
installierte/portable App kann ihren eigenen im nativen Dialog gezeigten
Startpfad freigeben. SHA-256 bindet die EXE; nach Änderung erneut freigeben.
Die Portable-Datei wird über den vorhandenen NSIS-Startpfad erkannt.

Optionales HTTP bindet nur an 127.0.0.1, verlangt ein Bearer-Token mit mindestens
32 Zeichen und prüft Host/Origin. Kein Port-Forwarding oder öffentlicher Tunnel.
Für Secure MCP Tunnel erhält der offizielle Client ausschliesslich den
eingeschränkten OpenAI-Laufzeitschlüssel (Read/Use), keinen Admin-Schlüssel.
Read/Manage zur Erstellung und ChatGPT-Workspace-Berechtigung sind getrennt.
Schlüssel nur verdeckt lokal oder als Prozessumgebungsvariable, nie in Chat,
Toolargument, Screenshot, Quelltext oder Git. Die native App-Freigabe bleibt nötig.
