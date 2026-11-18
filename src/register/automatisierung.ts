/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/automatisierung.ts (npm run bauen:ts). */
/** Semantische Desktop-Aktionen. Die Bereiche melden ihre vorhandenen Dienste hier an. */
interface AutomationContext {
  check: () => void;
  block: (id: string, write?: boolean) => any;
  pageOf: (id: string) => any;
  prepare: (documentId: string) => Promise<void>;
  finish: (documentId?: string) => Promise<void>;
  error: (code: string) => never;
}
type AutomationHandler = (input: Record<string, any>, context: AutomationContext) => Record<string, unknown> | Promise<Record<string, unknown>>;
const RegisterAutomatisierung = (() => {
  const handlers = new Map<string, AutomationHandler>();
  const melde = (name: string, handler: AutomationHandler): void => {
    if (!(window as any).RedionDesktop?.onAutomationRequest || (window as any).RedionDesktop.automationSupported === false) return;
    if (handlers.has(name)) throw new Error('Automatisierungsaktion doppelt: '+name);
    handlers.set(name,handler);
  };
  const ausfuehren = async (name: string, input: Record<string, unknown>, context: AutomationContext): Promise<Record<string,unknown>> => {
    const handler=handlers.get(name); if(!handler) context.error('UNSUPPORTED_ACTION');
    context.check(); return handler!(input,context);
  };
  return {melde,ausfuehren,namen:()=>[...handlers.keys()]};
})();
(Register as any).automatisierung=RegisterAutomatisierung;
