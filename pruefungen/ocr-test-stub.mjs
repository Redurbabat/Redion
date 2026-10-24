/*
 * Portable Stellvertretung fuer den LOKALEN OCR-Testdienst.
 * Windows braucht ein echtes tesseract.exe, weil der produktive Redion-Dienst
 * eine Shell bewusst NICHT erlaubt (Schutz gegen Argument-Einschleusung).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const UNIX_SCRIPT = [
  '#!/bin/sh',
  'bild="$1"',
  'sprache=""',
  'while [ $# -gt 0 ]; do',
  '  if [ "$1" = "-l" ]; then sprache="$2"; fi',
  '  shift',
  'done',
  'if [ ! -f "$bild" ]; then echo "kein Bild: $bild" >&2; exit 2; fi',
  'groesse=$(wc -c < "$bild" | tr -d " ")',
  'echo "tesseract 5.9.0" >&2',
  "printf 'Verteiler UV3\\nSprache %s\\nBytes %s\\n' \"$sprache\" \"$groesse\""
].join('\n') + '\n';

export const WINDOWS_CSHARP = [
  'using System;',
  'using System.IO;',
  'public class RedionOcrTestProgram {',
  '    public static int Main(string[] args) {',
  '        string image = args.Length > 0 ? args[0] : "";',
  '        string language = "";',
  '        for (int i = 0; i + 1 < args.Length; ++i) {',
  '            if (args[i] == "-l") language = args[i + 1];',
  '        }',
  '        if (!File.Exists(image)) {',
  '            Console.Error.WriteLine("kein Bild: " + image);',
  '            return 2;',
  '        }',
  '        Console.Error.WriteLine("tesseract 5.9.0");',
  '        Console.WriteLine("Verteiler UV3");',
  '        Console.WriteLine("Sprache " + language);',
  '        Console.WriteLine("Bytes " + new FileInfo(image).Length);',
  '        return 0;',
  '    }',
  '}'
].join('\n') + '\n';

/** Windows PATH ist case-insensitive: "Path" und "PATH" nie doppelt. */
export function withTestPath(originalEnv, testPath) {
  if (typeof testPath !== 'string') throw new TypeError('PATH fehlt.');
  const env = { ...originalEnv };
  let key = 'PATH';
  for (const candidate of Object.keys(env)) {
    if (candidate.toLowerCase() === 'path') {
      key = candidate;
      delete env[candidate];
    }
  }
  env[key] = testPath;
  return env;
}

export async function createTesseractStub(folder, {
  platform = process.platform,
  compiler = execFileSync
} = {}) {
  await fs.mkdir(folder, { recursive: true });
  if (platform !== 'win32') {
    const file = path.join(folder, 'tesseract');
    await fs.writeFile(file, UNIX_SCRIPT, { mode: 0o755 });
    return file;
  }

  const source = path.join(folder, 'tesseract-stub.cs');
  const executable = path.join(folder, 'tesseract.exe');
  await fs.writeFile(source, WINDOWS_CSHARP);
  // Die Testpfade gehen nur durch Umgebungsvariablen, nicht durch
  // interpolierte PowerShell-Befehlszeichenketten.
  compiler('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command',
    '$ErrorActionPreference = "Stop"; ' +
    'Add-Type -Path $env:REDION_OCR_TEST_SOURCE ' +
    '-OutputAssembly $env:REDION_OCR_TEST_PROGRAM ' +
    '-OutputType ConsoleApplication -ErrorAction Stop'
  ], {
    env: {
      ...process.env,
      REDION_OCR_TEST_SOURCE: source,
      REDION_OCR_TEST_PROGRAM: executable
    },
    cwd: folder,
    timeout: 60_000,
    stdio: 'pipe'
  });
  const check = await fs.stat(executable).catch(() => null);
  if (!check?.isFile()) {
    throw new Error('PowerShell hat keinen ausführbaren OCR-Test-Erkenner erstellt.');
  }
  return executable;
}
