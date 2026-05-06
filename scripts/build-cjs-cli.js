#!/usr/bin/env node

/**
 * Build CLI to CommonJS for pkg compatibility
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

async function buildCJS() {
  try {
    console.log('Building CLI to CommonJS for pkg...');
    
    // Build the CLI to CommonJS
    await esbuild.build({
      entryPoints: [path.join(__dirname, '..', 'src', 'cli.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: path.join(__dirname, '..', 'dist', 'cli-cjs.js'),
      external: [
        // Keep these external as they'll be available in the pkg bundle
        'fs', 'path', 'process', 'console', 'util', 'os', 'events',
        'child_process', 'stream', 'buffer', 'crypto', 'url', 'querystring'
      ],
      tsconfig: path.join(__dirname, '..', 'tsconfig.json'),
      sourcemap: false,
      minify: false,
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });
    
    console.log('✅ CLI built to CommonJS successfully');
    
    // Verify the output
    const outputPath = path.join(__dirname, '..', 'dist', 'cli-cjs.js');
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`📦 Output file: ${outputPath} (${stats.size} bytes)`);
    } else {
      throw new Error('Output file was not created');
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildCJS();
