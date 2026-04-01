import { Controller, Get } from '@nestjs/common';
import { LibelleService } from './libelle.service';

@Controller('libelle')
export class LibelleController {
  constructor(private readonly libelleService: LibelleService) {}

  @Get('operations')
  getOperations() {
    return this.libelleService.getOperations();
  }
}