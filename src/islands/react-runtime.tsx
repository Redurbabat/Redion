/* ============================================================================
 * src/islands/react-runtime.tsx — der Eingang für `quell/fremd/react/react.js`
 * ----------------------------------------------------------------------------
 * FREMDER CODE, EINGEPACKT (E699, §57). In dieser Datei steht keine Zeile
 * Logik — sie sagt dem Bündler nur, WELCHE Teile von React in die Datei
 * `quell/fremd/react/react.js` gehören:
 *
 *     react              19.3.0   (MIT, Meta Platforms, Inc. and affiliates)
 *     react-dom          19.3.0   (MIT, dieselben)
 *     react-dom/client   19.3.0   (createRoot)
 *     react/jsx-runtime  19.3.0   (was aus JSX wird)
 *     scheduler          0.28.0   (MIT, kommt mit react-dom)
 *
 * `bauen-inseln.mts` macht daraus EIN klassisches Skript mit EINEM globalen
 * Namen, `RedionReact`, und genau diesen vier Teilen darin. Die Inseln
 * (`quell/islands/islands.js`) holen sich React von dort — React steht damit
 * einmal im Verzeichnis, mit Prüfsumme in `pruefungen/fremd-bestand.json`,
 * und nicht in jeder Insel noch einmal.
 *
 * WARUM `.tsx`. Alles unter `src/islands/` gehört dem Bündler, nichts dem
 * klassischen Bau (`tsconfig.bauen.json`, `module: none`). Eine `.ts`-Datei
 * hier läse `tsconfig.json` mit — und `test109` hielte sie für die Quelle
 * einer `quell/islands/…js`, die es nie gibt. Die Endung ist die Grenze.
 * ==========================================================================*/
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import * as ReactJsxRuntime from 'react/jsx-runtime'

export { React, ReactDOM, ReactDOMClient, ReactJsxRuntime }
