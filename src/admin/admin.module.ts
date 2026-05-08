import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ChargesModule } from '../charges/charges.module';

@Module({
  imports: [ChargesModule],
  controllers: [AdminController],
})
export class AdminModule {}
