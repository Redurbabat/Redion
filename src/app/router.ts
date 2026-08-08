/* src/app/router.ts — Navigation über den Hash (RM-5, E78)
 * ----------------------------------------------------------------------------
 * Bewusst OHNE Routing-Bibliothek: E78 nennt vier Laufzeit-Abhängigkeiten,
 * und ein Hash-Router ist zwanzig Zeilen. §6 verlangt für jede weitere
 * Dependency einen eigenen E-Eintrag — für zwanzig Zeilen lohnt kein
 * Eintrag, sondern die zwanzig Zeilen.
 *
 * Der Hash, nicht der Pfad: die Shell soll auch von einer statisch
 * ausgelieferten app.html aus jede Seite erreichen, ohne dass ein Server
 * Pfade umschreiben muss — dieselbe Genügsamkeit wie beim Bestand.
 */
import { useEffect, useState } from 'react';

export type Route =
  | { name: 'start' }
  | { name: 'page'; id: string }
  | { name: 'workshop'; id: string };

export const parseRoute = (hash: string): Route => {
  const rein = hash.replace(/^#\/?/, '');
  if (rein.startsWith('seite/')) {
    const id = rein.slice('seite/'.length);
    if (id) return { name: 'page', id };
  }
  if (rein.startsWith('werkstatt/')) {
    const id = rein.slice('werkstatt/'.length);
    if (id) return { name: 'workshop', id };
  }
  return { name: 'start' };
};

export const routeToHash = (route: Route): string =>
  route.name === 'page' ? '#/seite/' + route.id
  : route.name === 'workshop' ? '#/werkstatt/' + route.id
  : '#/';

export const navigate = (route: Route): void => {
  location.hash = routeToHash(route);
};

/** Die aktuelle Route, reaktiv — hört auf hashchange. */
export const useRoute = (): Route => {
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  useEffect(() => {
    const horcher = () => setRoute(parseRoute(location.hash));
    window.addEventListener('hashchange', horcher);
    return () => window.removeEventListener('hashchange', horcher);
  }, []);
  return route;
};
