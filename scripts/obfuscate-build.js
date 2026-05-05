import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs-extra';
import path from 'path';

// 🔒 MARIANELLA CABRERA AHUMADA - PROTECCIÓN DE OFUSCACIÓN
const AUTHOR_PROTECTION = 'Marianella Cabrera Ahumada';

const obfuscationConfig = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: true,
  debugProtectionInterval: 1000,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.75,
  stringArrayEncoding: ['rc4'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

// Archivos críticos que deben ser ofuscados
const criticalFiles = [
  'license-manager.js',
  'cli.js',
  'portable-entry.js'
];

async function obfuscateBuild() {
  console.log(`🔒 Iniciando ofuscación protegida por ${AUTHOR_PROTECTION}...`);
  
  const distDir = path.join(process.cwd(), 'dist');
  const obfuscatedDir = path.join(process.cwd(), 'dist-obfuscated');
  
  // Limpiar directorio ofuscado si existe
  if (await fs.pathExists(obfuscatedDir)) {
    await fs.remove(obfuscatedDir);
  }
  
  // Crear directorio ofuscado
  await fs.ensureDir(obfuscatedDir);
  
  // Copiar todos los archivos al directorio ofuscado
  await fs.copy(distDir, obfuscatedDir);
  
  // Ofuscar archivos críticos
  for (const file of criticalFiles) {
    const filePath = path.join(obfuscatedDir, file);
    
    if (await fs.pathExists(filePath)) {
      try {
        const sourceCode = await fs.readFile(filePath, 'utf8');
        
        // Inyectar firma de autoría antes de ofuscar
        const signedCode = `// 🔒 ${AUTHOR_PROTECTION} - PROTECCIÓN ACTIVADA\n${sourceCode}`;
        
        const obfuscatedCode = JavaScriptObfuscator.obfuscate(signedCode, obfuscationConfig);
        
        await fs.writeFile(filePath, obfuscatedCode.getObfuscatedCode());
        console.log(`✅ ${file} ofuscado y protegido`);
      } catch (error) {
        console.error(`❌ Error ofuscando ${file}:`, error);
        process.exit(1);
      }
    }
  }
  
  // Ofuscar archivos específicos del core
  const coreDir = path.join(obfuscatedDir, 'core');
  if (await fs.pathExists(coreDir)) {
    const coreFiles = await fs.readdir(coreDir);
    
    for (const file of coreFiles) {
      if (file.endsWith('.js')) {
        const filePath = path.join(coreDir, file);
        
        try {
          const sourceCode = await fs.readFile(filePath, 'utf8');
          const signedCode = `// 🔒 ${AUTHOR_PROTECTION} - CORE PROTEGIDO\n${sourceCode}`;
          
          const obfuscatedCode = JavaScriptObfuscator.obfuscate(signedCode, obfuscationConfig);
          await fs.writeFile(filePath, obfuscatedCode.getObfuscatedCode());
          
          console.log(`✅ core/${file} ofuscado y protegido`);
        } catch (error) {
          console.error(`❌ Error ofuscando core/${file}:`, error);
        }
      }
    }
  }
  
  console.log('🔒 Ofuscación completada - Protección activada');
  console.log(`🔒 Autoría protegida: ${AUTHOR_PROTECTION}`);
}

// Ejecutar ofuscación
obfuscateBuild().catch(console.error);
