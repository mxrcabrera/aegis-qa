#!/usr/bin/env node

/**
 * Build CLI to CommonJS for pkg compatibility
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const XOR_KEY = Buffer.from('AEGIS-QA-2024-HARDWARE-BOUND', 'utf8');

/**
 * Ofusca una string usando XOR + Base64
 */
function obfuscate(input) {
  const buffer = Buffer.from(input, 'utf8');
  const obfuscated = Buffer.alloc(buffer.length);
  
  for (let i = 0; i < buffer.length; i++) {
    obfuscated[i] = buffer[i] ^ XOR_KEY[i % XOR_KEY.length];
  }
  
  return obfuscated.toString('base64');
}

/**
 * Carga variables de entorno desde .env.local
 */
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        process.env[key] = value.replace(/^["']|["']$/g, '');
      }
    });
  }
}

async function buildCJS() {
  try {
    console.log('Building CLI to CommonJS for pkg...');
    
    // Cargar variables de entorno
    loadEnv();
    
    // Generar token ofuscado
    const edgeConfigUrl = process.env.EDGE_CONFIG;
    if (!edgeConfigUrl) {
      console.warn('⚠️  EDGE_CONFIG no encontrado, el binario funcionará en modo Trial');
    }
    
    const obfuscatedToken = edgeConfigUrl ? obfuscate(edgeConfigUrl) : '';
    console.log('🔒 Token ofuscado generado para build');
    
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
        'process.env.NODE_ENV': '"production"',
        'process.env.EDGE_CONFIG_OBFUSCATED': `"${obfuscatedToken}"`
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
