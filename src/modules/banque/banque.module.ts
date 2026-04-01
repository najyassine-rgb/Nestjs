import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BanqueController } from './banque.controller';
import { BanqueService } from './banque.service';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [BanqueController],
  providers: [BanqueService],
})
export class BanqueModule {}