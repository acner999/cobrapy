import { describe, it, expect } from 'vitest';
import { parseMessage } from './whatsapp.parser';

describe('parseMessage', () => {
  it('parses "cobro 50000" → charge 50000', () => {
    const r = parseMessage('cobro 50000');
    expect(r.kind).toBe('charge');
    if (r.kind === 'charge') expect(r.amountGs).toBe(50000);
  });

  it('parses "Cobro Gs. 50.000 a Juan" → charge 50000 desc=Juan', () => {
    const r = parseMessage('Cobro Gs. 50.000 a Juan');
    expect(r.kind).toBe('charge');
    if (r.kind === 'charge') {
      expect(r.amountGs).toBe(50000);
      expect(r.description).toBe('Juan');
    }
  });

  it('parses "cobrar 1.500.000 por servicio mensual"', () => {
    const r = parseMessage('cobrar 1.500.000 por servicio mensual');
    expect(r.kind).toBe('charge');
    if (r.kind === 'charge') {
      expect(r.amountGs).toBe(1_500_000);
      expect(r.description).toBe('servicio mensual');
    }
  });

  it('parses just a number "50000"', () => {
    const r = parseMessage('50000');
    expect(r.kind).toBe('charge');
    if (r.kind === 'charge') expect(r.amountGs).toBe(50000);
  });

  it('recognizes ayuda/help/menu as help', () => {
    expect(parseMessage('ayuda').kind).toBe('help');
    expect(parseMessage('Help').kind).toBe('help');
    expect(parseMessage('Menu').kind).toBe('help');
    expect(parseMessage('hola').kind).toBe('help');
  });

  it('recognizes saldo/balance', () => {
    expect(parseMessage('saldo').kind).toBe('balance');
    expect(parseMessage('Balance').kind).toBe('balance');
  });

  it('returns unknown for non-command text', () => {
    expect(parseMessage('xyz qwerty').kind).toBe('unknown');
  });

  it('empty input is unknown', () => {
    expect(parseMessage('').kind).toBe('unknown');
    expect(parseMessage('   ').kind).toBe('unknown');
  });
});
