#!/usr/bin/env node

console.log('🔍 Checking ESLint dependencies...');

const { execSync } = require('child_process');
const path = require('path');

// List of required ESLint dependencies
const requiredDeps = [
  '@typescript-eslint/parser',
  '@typescript-eslint/eslint-plugin',
  'eslint-plugin-react',
  'eslint'
];

// Check if each dependency is installed
let missingDeps = [];
requiredDeps.forEach(dep => {
  try {
    require.resolve(dep);
    console.log(`✅ ${dep} found`);
  } catch (error) {
    console.log(`❌ ${dep} missing`);
    missingDeps.push(dep);
  }
});

// Install missing dependencies if any
if (missingDeps.length > 0) {
  console.log(`📦 Installing missing ESLint dependencies: ${missingDeps.join(', ')}...`);
  try {
    execSync(`npm install --save-dev ${missingDeps.join(' ')}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ ESLint dependencies installed successfully!');
  } catch (error) {
    console.error('❌ Failed to install ESLint dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('🎉 All ESLint dependencies are installed!');
}
