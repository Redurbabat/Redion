export const CLOUD_MCP_SERVER_INFO = {name:'RED ION Cloud MCP',version:'1.1.0'} as const;
export const CLOUD_MCP_PROTOCOL_VERSIONS = ['2025-11-25','2025-06-18','2025-03-26'] as const;

export function canonicalMcpJson(value:unknown):string {
  if(Array.isArray(value))return '['+value.map(canonicalMcpJson).join(',')+']';
  if(value&&typeof value==='object'){
    const object=value as Record<string,unknown>;
    return '{'+Object.keys(object).sort().map(key=>
      JSON.stringify(key)+':'+canonicalMcpJson(object[key])).join(',')+'}';
  }
  return JSON.stringify(value)??'undefined';
}
