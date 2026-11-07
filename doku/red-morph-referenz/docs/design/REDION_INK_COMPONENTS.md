# Redion-Ready Ink & Switches (Touch Kit)

## Zweck

Diese Komponenten sind **portabel und unabhängig von Redion**. Das GitHub-UI-Kit ist ihre Entwicklungs- und Prüfplattform. Eine spätere Übernahme nach Redion ist eine eigene, bewusste Integration – keine heimliche Änderung der Redion-App.

Öffne die Live-Vorschauen im UI-Kit unter **`#/touch`** und suche nach `Redion`, `Ink Studio`, `BrushDial` oder `Switches`.

## Neue Bausteine

| Modul | Verwendung |
| --- | --- |
| `InkPad` | SVG-Vektorzeichenfläche mit PointerCapture, Druckstärke für Stifte, Maus, Finger und Objekt-Radierer |
| `InkToolbar` | kontrollierte Werkzeug-/Farbwahl, Stift, Marker, Radierer, Undo/Redo |
| `BrushDial` | nativer Range-Regler für Strichbreite mit Live-Pinselspitze |
| `FilamentSwitch` | Metall- und Glasschalter mit Glühfaden und animiertem ON/STANDBY-Zustand |
| `HaloSwitch` | kompakter, leuchtender On/Off-Schalter für Einstellungen |
| `inkGeometry` | reine Geometriehilfen, Strichkonturen, Objekt-Radierer und Eingabenormalisierung |

Alle CSS-Klassen beginnen mit `ui-touch-` oder `ui-`; keine Abhängigkeit von der Website, Redion, einem Server oder einem externen Icon-Paket.

## Beispiel in Redion

```tsx
import { useState } from 'react'
import { InkPad, InkToolbar, FilamentSwitch, type InkStroke, type InkTool } from './touch'
import './touch/touch.css'

export function DrawingControls() {
  const [strokes, setStrokes] = useState<InkStroke[]>([])
  const [tool, setTool] = useState<InkTool>('pen')
  const [color, setColor] = useState('#7054ec')
  const [width, setWidth] = useState(12)
  const [simulation, setSimulation] = useState(false)

  return (
    <div className="ui-touch-root">
      <InkPad strokes={strokes} onChange={setStrokes} tool={tool} color={color} width={width} />
      <InkToolbar tool={tool} onToolChange={setTool} color={color} onColorChange={setColor}
        width={width} onWidthChange={setWidth}
        canUndo={strokes.length>0} onUndo={() => setStrokes(prev => prev.slice(0,-1))}/>
      <FilamentSwitch label="Stromsimulation" checked={simulation} onChange={setSimulation}/>
    </div>
  )
}
```

**Wichtig:** Der Schalter hat *keine* eigene Stromberechnung. In Redion muss `simulation` an die bestehende autorisierte Simulation gebunden werden; ein rein visuelles Toggle ist **keine elektrische Sicherheitsfreigabe**.

## Grenzen und Freigabe

- Die Zeichenfläche ist ein wiederverwendbares **Vektoreingabe-Primitive**, kein PDF-Schreibmotor. Das Einbetten, Skalieren, Speichern und Exportieren eines PDF müssen die bestehenden Redion-Funktionen erledigen.
- Der Radierer entfernt momentan **ganze Striche**, wenn seine Fläche sie berührt; kein pixelgenaues Splitten.
- Dokument-Speicherung, Undo-Stacks, PDF-Druck, Elektro-Rechenmodell und Cloud bleiben **beim Host**.
- Der Schalter enthält native `input type="checkbox" role="switch"`, unterstützt Tastatur, Focus-Visible und Reduced-Motion.
- Bei Stifteingabe werden die Druckwerte zu unterschiedlichen SVG-Konturbreiten. Der Pointer-Stream nutzt Capture und Coalesced Events.
- Für eine Produktfreigabe sind reale Windows-Pen-/Surface-/Android-/iPad-Tests, Palm-Rejection-Validierung, Tastatur-/Screenreader-Abnahme und Performance auf großen Dokumenten notwendig.

## Qualitätsprüfung

`cd app && npm run build && npm run test:unit && npm run test:smoke`.

Die Live-Previews zeigen den **echten** React-Quellcode neben dem dazugehörigen CSS. Nach Änderungen an dieser Touch-Kit-API außerdem `npm run skill`, damit die Referenz in `.claude/skills/touch-kit/reference/components.md` synchron bleibt.
