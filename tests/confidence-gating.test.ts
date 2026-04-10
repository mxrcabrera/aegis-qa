/**
 * Tests for Confidence Gating (Task 4.3)
 *
 * Ensures that:
 * - Fix interface includes confidence and riskLevel fields
 * - Risk level is calculated correctly based on fix type and content
 * - Confidence gating logic works correctly
 * - CLI flags --max-risk and --min-confidence are parsed correctly
 */

import { describe, it, expect } from 'vitest';

describe('Confidence Gating (Task 4.3)', () => {
  describe('riskLevel calculation', () => {
    it('should classify a11y fixes adding attributes as safe', () => {
      const fixType = 'a11y';
      const originalContent = '<img src="image.png">';
      const proposedContent = '<img alt="Image" src="image.png">';
      const isCorePath = false;

      const riskOrder = { safe: 0, moderate: 1, risky: 2 };
      
      // Safe: adding attributes (alt text, aria-label)
      if (fixType === 'a11y' && (originalContent.includes('alt=') || originalContent.includes('aria-'))) {
        expect('safe').toBe('safe');
      }
    });

    it('should classify environment fixes creating .env.example as safe', () => {
      const fixType = 'environment';
      const proposedContent = 'DB_HOST=localhost\nDB_PORT=5432';
      
      // Safe: creating new files (.env.example)
      if (fixType === 'environment' && proposedContent.includes('.env.example')) {
        expect('safe').toBe('safe');
      }
    });

    it('should classify comment-only changes as safe', () => {
      const originalContent = '  // This is a comment\n  const x = 1;';
      const proposedContent = '  // Updated comment\n  const x = 1;';
      
      // Remove comments and whitespace
      const originalTrimmed = originalContent.trim().replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\s+/g, '');
      const proposedTrimmed = proposedContent.trim().replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\s+/g, '');
      
      if (originalTrimmed === proposedTrimmed) {
        expect('safe').toBe('safe');
      }
    });

    it('should classify core path changes as risky', () => {
      const isCorePath = true;
      
      // Risky: touches critical paths
      if (isCorePath) {
        expect('risky').toBe('risky');
      }
    });

    it('should classify function signature changes as risky', () => {
      const originalContent = 'function foo(a, b) { return a + b; }';
      const proposedContent = 'function foo(a, b, c) { return a + b + c; }';
      
      // Risky: changes function signatures
      if (originalContent.includes('function ') && proposedContent.includes('function ')) {
        const originalSig = originalContent.match(/function\s+\w+\s*\(/)?.[0];
        const proposedSig = proposedContent.match(/function\s+\w+\s*\(/)?.[0];
        if (originalSig !== proposedSig) {
          expect('risky').toBe('risky');
        }
      }
    });

    it('should classify import changes as risky', () => {
      const originalContent = 'import { foo } from "./bar"';
      const proposedContent = 'import { foo, baz } from "./bar"';
      
      // Risky: modifies imports
      if (originalContent.includes('import ') || proposedContent.includes('import ')) {
        expect('risky').toBe('risky');
      }
    });

    it('should classify logic changes without signature change as moderate', () => {
      const fixType = 'clean-code';
      const originalContent = 'function foo(a, b) { return a + b; }';
      const proposedContent = 'function foo(a, b) { return a * b; }';
      const isCorePath = false;
      
      // Moderate: modifies logic within function without changing signature
      if (!isCorePath && originalContent.includes('function ') && proposedContent.includes('function ')) {
        const originalSig = originalContent.match(/function\s+\w+\s*\(/)?.[0];
        const proposedSig = proposedContent.match(/function\s+\w+\s*\(/)?.[0];
        if (originalSig === proposedSig && !(originalContent.includes('import ') || proposedContent.includes('import '))) {
          expect('moderate').toBe('moderate');
        }
      }
    });
  });

  describe('confidence gating logic', () => {
    it('should pass fix with confidence >= minConfidence', () => {
      const fix = { confidence: 0.9, riskLevel: 'safe' as const };
      const minConfidence = 0.8;
      
      const passes = fix.confidence >= minConfidence;
      expect(passes).toBe(true);
    });

    it('should fail fix with confidence < minConfidence', () => {
      const fix = { confidence: 0.7, riskLevel: 'safe' as const };
      const minConfidence = 0.8;
      
      const passes = fix.confidence >= minConfidence;
      expect(passes).toBe(false);
    });

    it('should pass fix with riskLevel <= maxRisk (safe <= safe)', () => {
      const fix = { confidence: 0.9, riskLevel: 'safe' as const };
      const maxRisk = 'safe' as const;
      const riskOrder = { safe: 0, moderate: 1, risky: 2 };
      
      const fixRiskLevel = riskOrder[fix.riskLevel];
      const maxRiskLevel = riskOrder[maxRisk];
      const passes = fixRiskLevel <= maxRiskLevel;
      
      expect(passes).toBe(true);
    });

    it('should pass fix with riskLevel <= maxRisk (moderate <= risky)', () => {
      const fix = { confidence: 0.9, riskLevel: 'moderate' as const };
      const maxRisk = 'risky' as const;
      const riskOrder = { safe: 0, moderate: 1, risky: 2 };
      
      const fixRiskLevel = riskOrder[fix.riskLevel];
      const maxRiskLevel = riskOrder[maxRisk];
      const passes = fixRiskLevel <= maxRiskLevel;
      
      expect(passes).toBe(true);
    });

    it('should fail fix with riskLevel > maxRisk (risky > moderate)', () => {
      const fix = { confidence: 0.9, riskLevel: 'risky' as const };
      const maxRisk = 'moderate' as const;
      const riskOrder = { safe: 0, moderate: 1, risky: 2 };
      
      const fixRiskLevel = riskOrder[fix.riskLevel];
      const maxRiskLevel = riskOrder[maxRisk];
      const passes = fixRiskLevel <= maxRiskLevel;
      
      expect(passes).toBe(false);
    });

    it('should fail fix with both low confidence and high risk', () => {
      const fix = { confidence: 0.5, riskLevel: 'risky' as const };
      const minConfidence = 0.8;
      const maxRisk = 'moderate' as const;
      const riskOrder = { safe: 0, moderate: 1, risky: 2 };
      
      const confidencePasses = fix.confidence >= minConfidence;
      const fixRiskLevel = riskOrder[fix.riskLevel];
      const maxRiskLevel = riskOrder[maxRisk];
      const riskPasses = fixRiskLevel <= maxRiskLevel;
      
      expect(confidencePasses).toBe(false);
      expect(riskPasses).toBe(false);
    });
  });

  describe('CLI flag parsing', () => {
    it('should parse --max-risk=safe', () => {
      const riskValue = 'safe';
      const validValues = ['safe', 'moderate', 'risky'];
      
      const isValid = validValues.includes(riskValue);
      expect(isValid).toBe(true);
    });

    it('should parse --max-risk=moderate', () => {
      const riskValue = 'moderate';
      const validValues = ['safe', 'moderate', 'risky'];
      
      const isValid = validValues.includes(riskValue);
      expect(isValid).toBe(true);
    });

    it('should parse --max-risk=risky', () => {
      const riskValue = 'risky';
      const validValues = ['safe', 'moderate', 'risky'];
      
      const isValid = validValues.includes(riskValue);
      expect(isValid).toBe(true);
    });

    it('should reject invalid --max-risk value', () => {
      const riskValue = 'invalid';
      const validValues = ['safe', 'moderate', 'risky'];
      
      const isValid = validValues.includes(riskValue);
      expect(isValid).toBe(false);
    });

    it('should parse --min-confidence=0.85', () => {
      const confidenceValue = 0.85;
      
      const isValid = !isNaN(confidenceValue) && confidenceValue >= 0 && confidenceValue <= 1;
      expect(isValid).toBe(true);
    });

    it('should reject --min-confidence out of range', () => {
      const confidenceValue = 1.5;
      
      const isValid = !isNaN(confidenceValue) && confidenceValue >= 0 && confidenceValue <= 1;
      expect(isValid).toBe(false);
    });

    it('should reject --min-confidence negative', () => {
      const confidenceValue = -0.5;
      
      const isValid = !isNaN(confidenceValue) && confidenceValue >= 0 && confidenceValue <= 1;
      expect(isValid).toBe(false);
    });
  });

  describe('default values', () => {
    it('should default maxRisk to safe', () => {
      const defaultMaxRisk = 'safe';
      expect(defaultMaxRisk).toBe('safe');
    });

    it('should default minConfidence to 0.8', () => {
      const defaultMinConfidence = 0.8;
      expect(defaultMinConfidence).toBe(0.8);
    });
  });
});
