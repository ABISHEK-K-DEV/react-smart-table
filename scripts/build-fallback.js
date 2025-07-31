#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Running fallback build process...');

// Create dist directory
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Simple build process using TypeScript compiler
const { execSync } = require('child_process');

try {
  // Compile TypeScript
  console.log('📦 Compiling TypeScript...');
  execSync('npx tsc --outDir dist --declaration', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // Create basic package files
  const packageJson = require('../package.json');
  
  // Create CJS build
  const cjsContent = `
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const indexModule = require('./index.js');
module.exports = indexModule;
`;

  fs.writeFileSync(path.join(distPath, 'index.cjs.js'), cjsContent);

  // Create ESM build
  const esmContent = `
export * from './index.js';
`;

  fs.writeFileSync(path.join(distPath, 'index.esm.js'), esmContent);

  console.log('✅ Fallback build completed successfully!');
  
} catch (error) {
  console.error('❌ Fallback build failed:', error.message);
  process.exit(1);
}
