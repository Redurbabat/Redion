# RED SDK – Integrationsplan für das Ökosystem

Basis: RED ID v2, RED Share v1 und RED SDK 0.3.0 aus Redion PR #257.
Keine App darf automatisch auf Daten einer anderen App zugreifen.
Die folgenden Repositories wurden auf main lesend geprüft. Dieser Plan
ändert die anderen Repositories nicht. Für jedes echte Integrationsergebnis
ist ein eigener PR mit separater Abnahme nötig.

| App-ID | Repository | Plattform / Integrationsweg |
| --- | --- | --- |
| red-ion | Redion | Bestehender Server + Geräteverwaltung; Owner-Freigaben |
| red-fit | Red-Fit | React/Vite, Tauri/Capacitor-Ziel; nativer Credential Store |
| red-poly | RED-Poly | Expo/React Native; Expo SecureStore, kompatible Crypto-API |
| red-bit | RED-Bit | AppleApp / Kotlin/Gradle; Keychain / Keystore |
| red-loop | RED-Loop | Web plus iOS/Android; keine Tokens im Userscript |
| red-efz | RED-EFZ | Schularchiv; keine automatische Anmeldung des Dokumenten-Repos |
| red-kurd | RED-KURD | Vite/TypeScript; native Speicherung oder flüchtige Web-Sitzung |
| red-uhr | RED-Uhr | Connect IQ; Kopplung über Companion-App, keine langlebigen Tokens auf der Uhr |
| red-yt | RED-YT | iOS/Android; Keychain / Keystore |
| stran | STRAN | Vite, Capacitor, Desktop; plattformspezifische sichere Speicherung |
| babat-red | BABAT-RED | Web-App; flüchtige Tokens oder eigener gesicherter Backend-Flow |

## Vertrag pro App

1. Den exakt geprüften SDK-Commit lokal paketieren; nicht von einer beweglichen
   URL oder main zur Laufzeit importieren.
2. Private HTTPS-Serveradresse explizit eingeben. Kein automatisch ausgewählter
   Server; Schlüsselablage nach Origin und App-ID trennen.
3. Ziel-App generiert PKCE-Verifier und öffentliche Challenge. Nur Challenge
   für RED ION Owner-Freigabe anzeigen. Einmalcode zurück zur Ziel-App.
4. Access-/Refresh-Token nur im Keychain/Keystore oder, auf Web, flüchtig im
   Speicher (keine localStorage, URL, Log oder Shared Preferences im Klartext).
5. Anmeldung und Abmeldung dürfen bestehende lokale Inhalte nicht löschen.
6. Datenübertragung standardmässig aus; konkrete Richtungsfreigabe, eigener
   geteilter Verschlüsselungsschlüssel, Zweck und Nachrichtenkanal.
7. Negativtests: andere App-ID, falsche Serveradresse, abgelaufene Kopplung,
   Refresh-Rotation, Widerruf, Netzverlust, fremde Nachrichten.
8. Erst nach erfolgreicher Einzel-App-Abnahme integrieren. Kein Merge aus PR #257.

## Noch zu implementieren

QR-Kamera/Renderer, Browser-SSO, plattformspezifische SecureStore-Adapter und
UI, echte iOS/Windows/Android/Garmin-Tests. Keine Behauptung, dass die zehn
externen Apps schon RED ID verwenden. Vor Produktivbetrieb Audit und
Geräteprüfung.
