import { Module } from '@nestjs/common';
import { ChargesController } from './charges.controller';
import { ChargesService } from './charges.service';
import { QrService } from './qr.service';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [WebhooksModule],
  controllers: [ChargesController],
  providers: [ChargesService, QrService],
  exports: [ChargesService],
})
export class ChargesModule {}
