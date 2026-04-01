import { Controller, Get, UseGuards } from '@nestjs/common';
import { SocieteService } from './societe.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('societes')
export class SocieteController {
  constructor(private readonly societeService: SocieteService) {}

  @Get()
  // @UseGuards(JwtAuthGuard)  // uncomment once auth is working
  getSocietes() {
    return this.societeService.getSocietes();
  }
}