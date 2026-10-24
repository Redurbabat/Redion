import type { execFileSync } from 'node:child_process';

export const UNIX_SCRIPT: string;
export const WINDOWS_CSHARP: string;
export function withTestPath(originalEnv: NodeJS.ProcessEnv, testPath: string): NodeJS.ProcessEnv;
export function createTesseractStub(folder: string, options?: {
  platform?: NodeJS.Platform;
  compiler?: typeof execFileSync;
}): Promise<string>;
