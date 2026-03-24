#!/usr/bin/env node

/**
 * Script para generar version.json con metadata del build.
 * Se ejecuta automáticamente durante el build de producción.
 * 
 * Incluye:
 * - Versión semántica de package.json
 * - Git commit hash
 * - Timestamp del build
 * - Ambiente (production/preview/development)
 * - Branch de git
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer package.json manualmente
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

// Función para ejecutar comandos de git de forma segura
function safeExec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {
    return null;
  }
}

// Obtener información de git
const commitHash = safeExec('git rev-parse --short HEAD') || 'unknown';
const commitHashFull = safeExec('git rev-parse HEAD') || 'unknown';
const branch = safeExec('git rev-parse --abbrev-ref HEAD') || 'unknown';
const commitDate = safeExec('git log -1 --format=%ci') || 'unknown';
const isDirty = safeExec('git status --porcelain')?.length > 0;

// Determinar ambiente
const vercelEnvironment = process.env.VERCEL_ENV; // 'production' | 'preview' | undefined
const vercelBranch = process.env.VERCEL_GIT_COMMIT_REF;
const nodeEnv = process.env.NODE_ENV;

let environment = 'development';
let environmentLabel = 'Desarrollo';

if (vercelEnvironment === 'production') {
  environment = 'production';
  environmentLabel = 'Producción';
} else if (vercelEnvironment === 'preview') {
  environment = 'preview';
  environmentLabel = `Preview (${vercelBranch || 'branch'})`;
} else if (nodeEnv === 'production') {
  environment = 'production';
  environmentLabel = 'Producción';
}

// Crear objeto de versión
const versionInfo = {
  // Versión semántica
  version: packageJson.version || '0.0.0',
  
  // Información de git
  git: {
    commitHash,
    commitHashFull,
    branch,
    commitDate,
    isDirty,
  },
  
  // Información del build
  build: {
    timestamp: new Date().toISOString(),
    timestampUnix: Date.now(),
    environment,
    environmentLabel,
    nodeVersion: process.version,
  },
  
  // Metadata adicional
  meta: {
    name: packageJson.name || 'homefinder',
    deployedAt: new Date().toISOString(),
  },
};

// Escribir version.json en public/
const outputPath = join(process.cwd(), 'public', 'version.json');
writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2));

console.log('✅ version.json generado exitosamente');
console.log(`   Versión: ${versionInfo.version}`);
console.log(`   Commit: ${commitHash}${isDirty ? ' (con cambios sin commitear)' : ''}`);
console.log(`   Ambiente: ${environmentLabel}`);
console.log(`   Output: ${outputPath}`);
