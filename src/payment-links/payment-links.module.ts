import { Module } from '@nestjs/common';
import { PaymentLinksService } from './payment-links.service';
import { PaymentLinksController, PublicPaymentLinkController } from './payment-links.controller';

@Module({
  controllers: [PaymentLinksController, PublicPaymentLinkController],
  providers: [PaymentLinksService],
  exports: [PaymentLinksService],
})
export class PaymentLinksModule {}