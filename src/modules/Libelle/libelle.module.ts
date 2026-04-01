import { Module } from '@nestjs/common';
import { LibelleController } from './libelle.controller';
import { LibelleService } from './libelle.service';

@Module({
  controllers: [LibelleController],
  providers: [LibelleService],
})
export class LibelleModule {}