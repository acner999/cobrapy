import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';
import { ChargesService } from '../charges/charges.service';
import { PaymentType } from '@prisma/client';

@Injectable()
export class SubscriptionSchedulerService {
  private readonly logger = new Logger(SubscriptionSchedulerService.name);

  constructor(
    private readonly subscriptions: SubscriptionsService,
    private readonly charges: ChargesService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async processRecurringCharges() {
    const due = await this.subscriptions.getDueSubscriptions();
    if (due.length === 0) return;

    this.logger.log(`Procesando ${due.length} suscripciones vencidas`);

    for (const sub of due) {
      try {
        await this.charges.create(sub.merchantId, {
          amountGs:    Number(sub.plan.amountGs),
          description: `Cobro recurrente — ${sub.plan.name}`,
          paymentType: PaymentType.API_DIRECT,
          externalId:  `sub_${sub.id}_${sub.currentPeriodEnd.getTime()}`,
          metadata:    { subscriptionId: sub.id, customerId: sub.customerEmail },
        });

        await this.subscriptions.advancePeriod(sub.id);
        this.logger.log(`Cobro generado para suscripción ${sub.id} (${sub.customerEmail})`);
      } catch (err) {
        this.logger.error(`Error procesando suscripción ${sub.id}: ${(err as Error).message}`);
        await this.subscriptions.markPastDue(sub.id);
      }
    }
  }
}
