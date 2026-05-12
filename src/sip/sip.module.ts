import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SipService, SIP_ADAPTER } from './sip.service';
import { SipWebhookController } from './sip-webhook.controller';
import { MockSipAdapter } from './adapters/mock-sip.adapter';
import { BcpSipAdapter } from './adapters/bcp-sip.adapter';
import { ChargesModule } from '../charges/charges.module';

@Module({
  imports: [ChargesModule],
  controllers: [SipWebhookController],
  providers: [
    {
      provide: SIP_ADAPTER,
      useFactory: (config: ConfigService) =>
        config.get('SIP_REAL') === 'true'
          ? new BcpSipAdapter(config)
          : new MockSipAdapter(),
      inject: [ConfigService],
    },
    SipService,
  ],
  exports: [SipService],
})
export class SipModule {}
