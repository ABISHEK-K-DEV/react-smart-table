#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Running fallback TypeScript build...');

// Create dist directory
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Simple build process using TypeScript compiler
const { execSync } = require('child_process');

try {
  // Compile TypeScript
  console.log('📝 Compiling TypeScript...');
  execSync('npx tsc --project tsconfig.json', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // Read package.json
  const packageJson = require('../package.json');
  
  // Create package.json for dist
  const distPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    main: './index.js',
    module: './index.js',
    types: './index.d.ts',
    exports: {
      '.': {
        import: './index.js',
        require: './index.js',
        types: './index.d.ts'
      }
    }
  };

  fs.writeFileSync(
    path.join(distPath, 'package.json'), 
    JSON.stringify(distPackageJson, null, 2)
  );

  console.log('✅ Fallback build completed!');
  
} catch (error) {
  console.error('❌ Fallback build failed:', error.message);
  process.exit(1);
}
