import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SocieteController } from './societe.controller';
import { SocieteService } from './societe.service';

@Module({
  imports: [HttpModule],
  controllers: [SocieteController],
  providers: [SocieteService],
})
export class SocieteModule {}