import { Module } from '@nestjs/common';
import { ChargesController, PublicChargeController } from './charges.controller';
import { ChargesService } from './charges.service';
import { QrService } from './qr.service';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [WebhooksModule],
  controllers: [ChargesController, PublicChargeController],
  providers: [ChargesService, QrService],
  exports: [ChargesService],
})
export class ChargesModule {}
