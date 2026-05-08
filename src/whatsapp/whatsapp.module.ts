import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppSender } from './whatsapp.sender';
import { ChargesModule } from '../charges/charges.module';

@Module({
  imports: [ChargesModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppSender],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
