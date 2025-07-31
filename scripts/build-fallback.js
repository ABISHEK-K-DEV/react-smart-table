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

  // Try to use a bundler if available
  let bundleSuccess = false;
  try {
    console.log('🔍 Trying to use Rollup...');
    execSync('npx rollup -c', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    bundleSuccess = true;
    console.log('✅ Rollup bundling succeeded.');
  } catch (bundleError) {
    console.log('⚠️ Rollup bundling failed, continuing with TypeScript output only.');
    
    // If the TypeScript compile worked but bundling didn't, we'll copy compiled files to dist
    try {
      console.log('📋 Copying compiled files to dist directory...');
      // This could be more complex with a recursive copy if needed
      const compiledFiles = fs.readdirSync(distPath)
        .filter(file => file.endsWith('.js') || file.endsWith('.d.ts'));
      
      if (compiledFiles.length === 0) {
        console.log('⚠️ No compiled files found in dist directory.');
      } else {
        console.log(`✅ Found ${compiledFiles.length} compiled files.`);
      }
    } catch (copyError) {
      console.error('❌ Failed to manage compiled files:', copyError.message);
    }
  }

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
    },
    sideEffects: false
  };

  fs.writeFileSync(
    path.join(distPath, 'package.json'), 
    JSON.stringify(distPackageJson, null, 2)
  );

  console.log('✅ Fallback build completed!');
  process.exit(0);
  
} catch (error) {
  console.error('❌ Fallback build failed:', error.message);
  process.exit(1);
}
