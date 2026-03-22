import { describe, it, expect } from 'vitest';
import { escapeValue } from '../../utils/escapeValue';

describe('escapeValue', () => {
  describe('NULL handling', () => {
    it('returns NULL for null', () => {
      expect(escapeValue(null)).toBe('NULL');
    });

    it('returns NULL for undefined', () => {
      expect(escapeValue(undefined)).toBe('NULL');
    });
  });

  describe('number handling', () => {
    it('converts positive integers to string', () => {
      expect(escapeValue(42)).toBe('42');
    });

    it('converts negative integers to string', () => {
      expect(escapeValue(-17)).toBe('-17');
    });

    it('converts zero to string', () => {
      expect(escapeValue(0)).toBe('0');
    });

    it('converts floats to string', () => {
      expect(escapeValue(3.14159)).toBe('3.14159');
    });

    it('converts negative floats to string', () => {
      expect(escapeValue(-0.5)).toBe('-0.5');
    });
  });

  describe('boolean handling', () => {
    it('converts true to 1', () => {
      expect(escapeValue(true)).toBe('1');
    });

    it('converts false to 0', () => {
      expect(escapeValue(false)).toBe('0');
    });
  });

  describe('string handling', () => {
    it('wraps simple strings in quotes', () => {
      expect(escapeValue('hello')).toBe("'hello'");
    });

    it('wraps empty string in quotes', () => {
      expect(escapeValue('')).toBe("''");
    });

    it('escapes single quotes by doubling them', () => {
      expect(escapeValue("it's")).toBe("'it''s'");
    });

    it('escapes multiple single quotes', () => {
      expect(escapeValue("a'b'c")).toBe("'a''b''c'");
    });

    it('handles strings with spaces', () => {
      expect(escapeValue('hello world')).toBe("'hello world'");
    });

    it('handles strings with special characters', () => {
      expect(escapeValue('test@example.com')).toBe("'test@example.com'");
    });

    it('handles strings with newlines', () => {
      expect(escapeValue('line1\nline2')).toBe("'line1\nline2'");
    });

    it('handles JSON strings', () => {
      const json = JSON.stringify({ key: "value" });
      expect(escapeValue(json)).toBe(`'${json}'`);
    });
  });

  describe('edge cases', () => {
    it('converts objects to string representation', () => {
      expect(escapeValue({})).toBe("'[object Object]'");
    });

    it('converts arrays to string representation', () => {
      expect(escapeValue([1, 2, 3])).toBe("'1,2,3'");
    });

    it('handles NaN', () => {
      expect(escapeValue(NaN)).toBe('NaN');
    });

    it('handles Infinity', () => {
      expect(escapeValue(Infinity)).toBe('Infinity');
    });
  });
});
