import { describe, it, expect } from '@jest/globals';
import { deriveQueryType } from '@/app/(app)/shared/lib/search-utils';

describe('deriveQueryType', () => {
  describe('Taxonomy code detection', () => {
    it('should return "taxonomy" for single taxonomy code', () => {
      const result = deriveQueryType('BD-1800.2000', undefined);
      expect(result).toBe('taxonomy');
    });

    it('should return "taxonomy" for multiple taxonomy codes', () => {
      const result = deriveQueryType('BD-1800.2250,NL-6000.2000', undefined);
      expect(result).toBe('taxonomy');
    });

    it('should return "taxonomy" for multiple taxonomy codes with spaces', () => {
      const result = deriveQueryType('BD-1800.2250, NL-6000.2000', undefined);
      expect(result).toBe('taxonomy');
    });

    it('should return "taxonomy" for taxonomy code with different prefix', () => {
      const result = deriveQueryType('NL-6000.2000', undefined);
      expect(result).toBe('taxonomy');
    });

    it('should return "taxonomy" for taxonomy code pattern with whitespace', () => {
      const result = deriveQueryType('  BD-1800.2000  ', undefined);
      expect(result).toBe('taxonomy');
    });
  });

  describe('Text query detection', () => {
    it('should return "text" for plain text query', () => {
      const result = deriveQueryType('food', undefined);
      expect(result).toBe('text');
    });

    it('should return "text" for text with spaces', () => {
      const result = deriveQueryType('food banks', undefined);
      expect(result).toBe('text');
    });

    it('should return "text" for empty string', () => {
      const result = deriveQueryType('', undefined);
      expect(result).toBe('text');
    });

    it('should return "text" for undefined query', () => {
      const result = deriveQueryType(undefined, undefined);
      expect(result).toBe('text');
    });

    it('should return "taxonomy" for taxonomy code without full decimal suffix', () => {
      // BD-1800 is valid - taxonomy codes can have varying levels of specificity
      const result = deriveQueryType('BD-1800', undefined);
      expect(result).toBe('taxonomy');
    });

    it('should return "text" for numbers without taxonomy pattern', () => {
      const result = deriveQueryType('12345', undefined);
      expect(result).toBe('text');
    });

    it('should return "text" for text with hyphens but not taxonomy pattern', () => {
      const result = deriveQueryType('food-banks', undefined);
      expect(result).toBe('text');
    });
  });

  describe('StoredType handling', () => {
    it('should use valid storedType "taxonomy" when query is not a taxonomy code', () => {
      const result = deriveQueryType('food', 'taxonomy');
      expect(result).toBe('taxonomy');
    });

    it('should use valid storedType "text" when query is a taxonomy code', () => {
      // Taxonomy code has higher priority, so it should return 'taxonomy'
      const result = deriveQueryType('BD-1800.2000', 'text');
      expect(result).toBe('taxonomy');
    });

    it('should use valid storedType "organization"', () => {
      const result = deriveQueryType('red cross', 'organization');
      expect(result).toBe('organization');
    });

    it('should use valid storedType "more_like_this"', () => {
      const result = deriveQueryType('shelter', 'more_like_this');
      expect(result).toBe('more_like_this');
    });

    it('should default to "text" for invalid storedType', () => {
      const result = deriveQueryType('food', 'invalid_type' as any);
      expect(result).toBe('text');
    });

    it('should default to "text" when storedType is empty string', () => {
      const result = deriveQueryType('food', '');
      expect(result).toBe('text');
    });

    it('should default to "text" when storedType is whitespace', () => {
      const result = deriveQueryType('food', '   ');
      expect(result).toBe('text');
    });
  });

  describe('Priority rules', () => {
    it('should prioritize taxonomy code pattern over storedType', () => {
      // Query IS a taxonomy code, storedType says "text"
      // Taxonomy code should win
      const result = deriveQueryType('BD-1800.2000', 'text');
      expect(result).toBe('taxonomy');
    });

    it('should use storedType when query is plain text', () => {
      // Query is NOT a taxonomy code, storedType says "taxonomy"
      // storedType should be used
      const result = deriveQueryType('food', 'taxonomy');
      expect(result).toBe('taxonomy');
    });

    it('should default to text when both query and storedType are invalid', () => {
      const result = deriveQueryType('food', 'invalid' as any);
      expect(result).toBe('text');
    });
  });

  describe('Real-world scenarios', () => {
    it('CRITICAL: user types "food" should return "text" even if it matches suggestions', () => {
      // This is the key bug scenario:
      // User types "food" (plain text)
      // System finds matching suggestions and taxonomy codes internally
      // But the USER INPUT is plain text, so query_type should be "text"
      const result = deriveQueryType('food', undefined);
      expect(result).toBe('text');
    });

    it('user selects "Food Pantries" taxonomy name should use storedType', () => {
      // When user selects from dropdown, the calling code sets storedType to 'taxonomy'
      const result = deriveQueryType('Food Pantries', 'taxonomy');
      expect(result).toBe('taxonomy');
    });

    it('user types taxonomy code directly should return "taxonomy"', () => {
      const result = deriveQueryType('BD-1800.2000', undefined);
      expect(result).toBe('taxonomy');
    });

    it('user changes from taxonomy search to text search', () => {
      // Initial: taxonomy code
      const initial = deriveQueryType('BD-1800.2000', undefined);
      expect(initial).toBe('taxonomy');

      // User changes to text "food"
      // Even though state might have storedType as 'taxonomy', the text input should be detected as 'text'
      const updated = deriveQueryType('food', 'taxonomy');
      expect(updated).toBe('taxonomy'); // storedType wins when query is not a taxonomy code
      
      // The calling code should pass undefined for storedType when user manually types
      const corrected = deriveQueryType('food', undefined);
      expect(corrected).toBe('text');
    });
  });
});
