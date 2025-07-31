#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking build dependencies...');

// Check if dist directory exists
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
  console.log('✅ Created dist directory');
}

// Check critical dependencies
const packageJson = require('../package.json');
const criticalDeps = [
  'esbuild',
  'typescript',
];

// Optional dependencies to check - we need at least one bundler to work
const optionalDeps = [
  '@rollup/plugin-node-resolve',
  '@rollup/plugin-commonjs',
  '@rollup/plugin-typescript',
  'rollup'
];

let mandatoryDepsFound = true;
let foundOptionalDeps = false;

criticalDeps.forEach(dep => {
  try {
    const depModule = require.resolve(dep);
    console.log(`✅ ${dep} found`);
    
    // Check esbuild version
    if (dep === 'esbuild') {
      const esbuild = require(dep);
      if (esbuild.version && esbuild.version < '0.25.0') {
        console.log(`⚠️ esbuild version ${esbuild.version} has security vulnerabilities. Consider upgrading to >=0.25.8`);
      }
    }
  } catch (error) {
    console.log(`❌ ${dep} missing`);
    mandatoryDepsFound = false;
  }
});

optionalDeps.forEach(dep => {
  try {
    require.resolve(dep);
    console.log(`✅ ${dep} found`);
    foundOptionalDeps = true;
  } catch (error) {
    console.log(`ℹ️ ${dep} not found (optional)`);
  }
});

if (mandatoryDepsFound) {
  console.log('🎉 All mandatory build dependencies are ready!');
  if (!foundOptionalDeps) {
    console.log('⚠️ No optional bundlers found. Will use TypeScript compiler directly.');
  }
  process.exit(0);
} else {
  console.log('⚠️ Some dependencies are missing. Run npm install again.');
  process.exit(1);
}
