import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.ledgerEntry.findMany({ orderBy: { createdAt: 'asc' } });
  console.log('=== LEDGER ENTRIES ===');
  for (const e of entries) {
    console.log(`${e.account.padEnd(30)} debit=${e.debitGs.toString().padStart(8)} credit=${e.creditGs.toString().padStart(8)}  ${e.description ?? ''}`);
  }
  const sumD = entries.reduce((a, e) => a + e.debitGs, 0n);
  const sumC = entries.reduce((a, e) => a + e.creditGs, 0n);
  console.log(`\nTOTAL debit=${sumD}  credit=${sumC}  balance=${sumD - sumC}`);

  const tx = await prisma.transaction.findMany();
  console.log(`\n=== TRANSACTIONS (${tx.length}) ===`);
  for (const t of tx) {
    console.log(`${t.id} amount=${t.amountGs} fee=${t.feeGs} net=${t.netAmountGs} sip=${t.sipTransactionId}`);
  }

  const wd = await prisma.webhookDelivery.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log(`\n=== WEBHOOK DELIVERIES (${wd.length}) ===`);
  for (const d of wd) {
    console.log(`${d.id} event=${d.eventType} status=${d.status} attempts=${d.attempts} respStatus=${d.responseStatus}`);
  }
}
main().finally(() => prisma.$disconnect());
