#!/usr/bin/env node

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// --- Configuration ---

// Resolve the path to the 'dist' directory
const distDir = path.join(__dirname, '..', 'dist');

// Read package.json to automatically externalize dependencies
const packageJson = require('../package.json');
const external = [
  ...Object.keys(packageJson.peerDependencies || {}),
  ...Object.keys(packageJson.dependencies || {}),
  'react/jsx-runtime' // Explicitly add this for React 17+ JSX transform
];

// This is the shared configuration for all esbuild operations
const baseConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  external,
  sourcemap: true,
  target: ['es2020'],
  jsx: 'automatic',
  platform: 'browser',
  format: undefined, // Format will be set per output
  logLevel: 'info',
  minify: process.env.NODE_ENV === 'production',
};


// --- Build Functions ---

/**
 * Generates TypeScript declaration files (.d.ts) using the TypeScript compiler.
 */
function generateDeclarations() {
  console.log('📝 Generating TypeScript declarations...');
  try {
    execSync('npx tsc --emitDeclarationOnly --outDir dist', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..') // Run tsc from the project root
    });
    return true;
  } catch (error) {
    console.error('⚠️ TypeScript declaration generation had errors, but continuing build process...');
    console.error('   You may need to run "npm run build:tsc" manually.');
    return false;
  }
}

/**
 * Creates a package.json file in the dist directory
 */
function createDistPackageJson() {
  try {
    const distPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      main: './index.js',
      module: './index.esm.js',
      types: './index.d.ts',
      exports: {
        '.': {
          import: './index.esm.js',
          require: './index.js',
          types: './index.d.ts'
        }
      },
      sideEffects: false
    };

    fs.writeFileSync(
      path.join(distDir, 'package.json'),
      JSON.stringify(distPackageJson, null, 2)
    );
    console.log('📄 Created dist/package.json');
    return true;
  } catch (error) {
    console.error('❌ Failed to create dist/package.json:', error.message);
    return false;
  }
}

/**
 * Run ESLint checks
 */
function runEslintCheck() {
  console.log('🔍 Running ESLint checks...');
  try {
    execSync('npx eslint src --ext .ts,.tsx --max-warnings=0', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    return true;
  } catch (error) {
    console.error('⚠️ ESLint found issues. Please fix them before building.');
    return false;
  }
}

/**
 * The main build function. It creates the CJS and ESM bundles and generates type declarations.
 */
async function build() {
  console.log('🔨 Building with esbuild...');
  
  // Ensure the 'dist' directory exists before we start building
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Run ESLint check first if not in CI environment
  if (process.env.CI !== 'true' && !runEslintCheck()) {
    console.log('⚠️ Continuing build despite ESLint issues...');
  }

  try {
    // Build both the ESM and CJS versions
    await esbuild.build({
      ...baseConfig,
      outfile: path.join(distDir, 'index.esm.js'),
      format: 'esm',
    });
    
    await esbuild.build({
      ...baseConfig,
      outfile: path.join(distDir, 'index.js'),
      format: 'cjs',
    });
    
    console.log('📦 ESM and CJS modules built.');

    // After the JavaScript bundles are created, generate the corresponding .d.ts files
    const declarationsSuccessful = generateDeclarations();
    
    // Create package.json in dist directory
    const packageJsonSuccessful = createDistPackageJson();

    if (declarationsSuccessful && packageJsonSuccessful) {
      console.log('✅ Build completed successfully!');
    } else {
      console.log('⚠️ Build completed with warnings.');
    }

    // Log the final bundle sizes for reference
    try {
      const esmSize = fs.statSync(path.join(distDir, 'index.esm.js')).size;
      const cjsSize = fs.statSync(path.join(distDir, 'index.js')).size;
      console.log(`📊 Bundle sizes:`);
      console.log(`   ESM: ${(esmSize / 1024).toFixed(1)}KB`);
      console.log(`   CJS: ${(cjsSize / 1024).toFixed(1)}KB`);
    } catch (error) {
      console.error('❌ Failed to report bundle sizes:', error.message);
    }

    return true;
  } catch (error) {
    console.error('❌ ESBuild build failed:', error);
    return false;
  }
}

/**
 * Starts a watch process that automatically rebuilds everything on file changes.
 */
async function watch() {
  console.log('👀 Starting watch mode...');

  try {
    // Create esbuild context for watching
    const esmContext = await esbuild.context({
      ...baseConfig,
      outfile: path.join(distDir, 'index.esm.js'),
      format: 'esm',
    });

    const cjsContext = await esbuild.context({
      ...baseConfig,
      outfile: path.join(distDir, 'index.js'),
      format: 'cjs',
    });

    // Start watching
    await Promise.all([
      esmContext.watch(),
      cjsContext.watch()
    ]);
    
    console.log('👀 Watching for changes in src/ ...');
    
    // Also generate types on startup
    generateDeclarations();
    createDistPackageJson();
  } catch (error) {
    console.error('❌ Watch setup failed:', error);
    process.exit(1);
  }
}


// --- Main Execution ---

// This function determines whether to run a single build or start watch mode
async function main() {
  if (process.argv.includes('--watch')) {
    await watch();
  } else {
    const success = await build();
    if (!success) {
      console.log('⚠️ ESBuild build had errors. Trying fallback build method...');
      try {
        require('./build-fallback');
      } catch (error) {
        console.error('❌ Both build methods failed. Please check your dependencies.');
        process.exit(1);
      }
    }
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});