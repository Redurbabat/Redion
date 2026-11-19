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
  /* Gemeinsame Schnittstelle für optionale Desktop-MCP-Einstellungen.
   * Bereiche rufen nur das Register auf, niemals den KI-Bereich direkt. */
  let ansichtsDienst: {html:()=>string;mount:(container:HTMLElement)=>void}|null=null;
  const meldeAnsicht=(dienst:{html:()=>string;mount:(container:HTMLElement)=>void}):void=>{
    if(ansichtsDienst) throw new Error('MCP-Ansicht doppelt angemeldet');
    ansichtsDienst=dienst;
  };
  const ansicht=():string=>ansichtsDienst?.html()??'';
  const montiereAnsicht=(container:HTMLElement):void=>{ansichtsDienst?.mount(container);};
  return {melde,ausfuehren,namen:()=>[...handlers.keys()],meldeAnsicht,ansicht,montiereAnsicht};
})();
(Register as any).automatisierung=RegisterAutomatisierung;
