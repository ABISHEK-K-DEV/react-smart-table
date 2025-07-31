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
  mainFields: ['module', 'main'],
  conditions: ['import', 'module', 'default'],
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
  } catch (error) {
    console.error('❌ Failed to generate TypeScript declarations.');
    // The error from execSync is usually printed to stderr, so we don't need to log it again.
    process.exit(1);
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

  try {
    // Build both the ESM and CJS versions in parallel for efficiency
    await Promise.all([
      esbuild.build({
        ...baseConfig,
        outfile: path.join(distDir, 'index.esm.js'),
        format: 'esm',
      }),
      esbuild.build({
        ...baseConfig,
        outfile: path.join(distDir, 'index.js'),
        format: 'cjs',
      })
    ]);
    console.log('📦 ESM and CJS modules built.');

    // After the JavaScript bundles are created, generate the corresponding .d.ts files
    generateDeclarations();

    console.log('✅ Build completed successfully!');

    // Log the final bundle sizes for reference
    const esmSize = fs.statSync(path.join(distDir, 'index.esm.js')).size;
    const cjsSize = fs.statSync(path.join(distDir, 'index.js')).size;
    console.log(`📊 Bundle sizes:`);
    console.log(`   ESM: ${(esmSize / 1024).toFixed(1)}KB`);
    console.log(`   CJS: ${(cjsSize / 1024).toFixed(1)}KB`);

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

/**
 * Starts a watch process that automatically rebuilds everything on file changes.
 */
async function watch() {
  console.log('👀 Starting watch mode...');

  // Use esbuild's context API for efficient watching
  const context = await esbuild.context({
    ...baseConfig,
    // We don't need this context to write files itself.
    // Instead, we'll use its plugin to trigger our full `build` function,
    // which ensures types are regenerated along with the JS bundles.
    write: false, 
    plugins: [{
      name: 'rebuild-plugin',
      setup(buildProcess) {
        // The `onEnd` callback is triggered after each build attempt within the context
        buildProcess.onEnd(result => {
          if (result.errors.length > 0) {
            console.error('❌ Watch detected build errors:', result.errors);
          } else {
            console.log('Changes detected. Triggering full rebuild...');
            // We call our main build function to handle everything
            build().catch(err => console.error('❌ Rebuild failed:', err));
          }
        });
      },
    }],
  });

  // Activate the watcher
  await context.watch();
  console.log('👀 Watching for changes in src/ ...');
  
  // Perform an initial build so files are available immediately on startup
  await build();
}


// --- Main Execution ---

// This function determines whether to run a single build or start watch mode
function main() {
  if (process.argv.includes('--watch')) {
    watch();
  } else {
    build();
  }
}

// Run the script
main();