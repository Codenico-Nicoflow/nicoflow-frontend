import { describe, expect, it } from 'vitest';

// Mirrors the --note-text-*/--note-highlight-* custom properties in
// src/index.css. Kept as plain hex here (not read from the DOM) so this is a
// pure, fast unit test — if you change a value in index.css, update it here
// too and re-run. This is the hard gate NIC-1968 calls for: every token is
// checked against WCAG AA (4.5:1), not eyeballed.

const BACKGROUND = { light: '#f8fafc', dark: '#0b1120' };
const FOREGROUND = { light: '#0f172a', dark: '#e2e8f0' };

export const NOTE_TEXT_COLOR_TOKENS = ['gray', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple'] as const;
export type NoteColorToken = (typeof NOTE_TEXT_COLOR_TOKENS)[number];

const TEXT_COLOR_HEX: Record<'light' | 'dark', Record<NoteColorToken, string>> = {
  light: {
    gray: '#475569',
    red: '#b91c1c',
    orange: '#c2410c',
    amber: '#a16207',
    green: '#15803d',
    teal: '#0f766e',
    blue: '#1d4ed8',
    purple: '#7e22ce',
  },
  dark: {
    gray: '#cbd5e1',
    red: '#fca5a5',
    orange: '#fdba74',
    amber: '#fcd34d',
    green: '#86efac',
    teal: '#5eead4',
    blue: '#93c5fd',
    purple: '#d8b4fe',
  },
};

const HIGHLIGHT_HEX: Record<'light' | 'dark', Record<NoteColorToken, string>> = {
  light: {
    gray: '#e2e8f0',
    red: '#fecaca',
    orange: '#fed7aa',
    amber: '#fde68a',
    green: '#bbf7d0',
    teal: '#99f6e4',
    blue: '#bfdbfe',
    purple: '#e9d5ff',
  },
  dark: {
    gray: '#334155',
    red: '#7f1d1d',
    orange: '#7c2d12',
    amber: '#78350f',
    green: '#14532d',
    teal: '#134e4a',
    blue: '#1e3a8a',
    purple: '#581c87',
  },
};

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
  ];
};

const relativeLuminance = ([r, g, b]: [number, number, number]): number => {
  const channel = (c: number) => {
    const normalized = c / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

// WCAG 2.1 contrast ratio formula: (L1 + 0.05) / (L2 + 0.05), L1 >= L2.
const contrastRatio = (hexA: string, hexB: string): number => {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = lumA >= lumB ? [lumA, lumB] : [lumB, lumA];
  return (lighter + 0.05) / (darker + 0.05);
};

const AA_NORMAL_TEXT = 4.5;

describe('note text-color tokens meet WCAG AA against the editor background', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const token of NOTE_TEXT_COLOR_TOKENS) {
      it(`${theme} — ${token}`, () => {
        const ratio = contrastRatio(TEXT_COLOR_HEX[theme][token], BACKGROUND[theme]);
        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      });
    }
  }
});

describe('note highlight tokens keep default foreground text readable in WCAG AA', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const token of NOTE_TEXT_COLOR_TOKENS) {
      it(`${theme} — ${token}`, () => {
        const ratio = contrastRatio(FOREGROUND[theme], HIGHLIGHT_HEX[theme][token]);
        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      });
    }
  }
});
