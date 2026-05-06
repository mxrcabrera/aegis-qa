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
 * Genera el token ofuscado para el build
 */
function generateObfuscatedToken() {
  const edgeConfigUrl = process.env.EDGE_CONFIG;
  
  if (!edgeConfigUrl) {
    console.error('❌ EDGE_CONFIG no está definido en las variables de entorno');
    process.exit(1);
  }
  
  const obfuscated = obfuscate(edgeConfigUrl);
  console.log(obfuscated);
}

generateObfuscatedToken();
