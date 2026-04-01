import { Controller, Get } from '@nestjs/common';
import { X3Service } from './x3.service';

@Controller('x3')
export class X3Controller {
  constructor(private readonly service: X3Service) {}

  @Get('societes')
  getSocietes() {
    return this.service.getSocietes();
  }
}
