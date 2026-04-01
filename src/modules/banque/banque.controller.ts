import { Controller, Get, Post, Body } from '@nestjs/common';
import { BanqueService } from './banque.service';

@Controller('banque')
export class BanqueController {
  constructor(private readonly banqueService: BanqueService) {}

  @Get('x3')
  getBanquesX3() { return this.banqueService.getBanquesX3(); }

  @Get('treso')
  getBanquesTreso() { return this.banqueService.getBanquesTreso(); }

  @Get('correspondances')
  getCorrespondances() { return this.banqueService.getCorrespondances(); }

  @Post('correspondances')
  saveCorrespondances(@Body() body: { correspondances: { banqueX3: string; banqueTreso: string }[] }) {
    return this.banqueService.saveCorrespondances(body.correspondances);
  }
}