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
  '@rollup/plugin-node-resolve',
  '@rollup/plugin-commonjs',
  '@rollup/plugin-typescript',
  'rollup'
];

let allDepsFound = true;

criticalDeps.forEach(dep => {
  try {
    require.resolve(dep);
    console.log(`✅ ${dep} found`);
  } catch (error) {
    console.log(`❌ ${dep} missing`);
    allDepsFound = false;
  }
});

if (allDepsFound) {
  console.log('🎉 All build dependencies are ready!');
  process.exit(0);
} else {
  console.log('⚠️  Some dependencies are missing. Run npm install again.');
  process.exit(1);
}
