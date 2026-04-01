import { Module } from '@nestjs/common';
import { DeviseController } from './devise.controller';
import { DeviseService } from './devise.service';

@Module({
  controllers: [DeviseController],
  providers: [DeviseService],
})
export class DeviseModule {}
