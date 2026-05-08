export type ParsedIntent =
  | { kind: 'charge'; amountGs: number; description?: string }
  | { kind: 'help' }
  | { kind: 'balance' }
  | { kind: 'unknown'; raw: string };

const HELP_RE = /^(ayuda|help|menu|comandos|hola|inicio|start)\b/i;
const BALANCE_RE = /^(saldo|balance|hoy|cu[aá]nto)\b/i;

// "cobro 50000", "cobrar Gs. 50.000", "cobro 50.000 a Juan", "cobrá 50000 servicio mensual"
const CHARGE_RE = /^(?:cobr[oa]r?|cobr[áa])\s+(?:gs\.?\s*)?([\d.,]+)\s*(?:(?:a|por|para)\s+(.+))?$/i;
// Solo número, "50000" o "50.000 a Juan"
const NUMBER_FIRST_RE = /^([\d.,]+)\s*(?:(?:a|por|para)\s+(.+))?$/i;

export function parseMessage(raw: string): ParsedIntent {
  const body = raw.trim();
  if (!body) return { kind: 'unknown', raw };

  if (HELP_RE.test(body)) return { kind: 'help' };
  if (BALANCE_RE.test(body)) return { kind: 'balance' };

  let match = body.match(CHARGE_RE);
  if (!match) match = body.match(NUMBER_FIRST_RE);
  if (match) {
    const amount = parseAmount(match[1]);
    if (amount > 0) {
      return {
        kind: 'charge',
        amountGs: amount,
        description: match[2]?.trim() || undefined,
      };
    }
  }

  return { kind: 'unknown', raw };
}

function parseAmount(raw: string): number {
  // Acepta "50000", "50.000", "50,000", "Gs. 50000". Stripping de no-dígitos.
  const digits = raw.replace(/[^\d]/g, '');
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
}
