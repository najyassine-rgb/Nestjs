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

@Get('test-db')
async testDb() {
  const sql = require('mssql');
  const configs = [
    { server: 'localhost', port: 49993 },
    { server: '127.0.0.1', port: 49993 },
    { server: 'WIN-DMB0UV4AHJ1', port: 49993 },
  ];

  const results: any[] = [];  // 👈 only change: add any[]

  for (const cfg of configs) {
    try {
      const pool = await sql.connect({
        ...cfg,
        user: 'sa',
        password: 'Azerty123#',
        database: 'SXA',
        options: { trustServerCertificate: true, encrypt: false },
      });
      const r = await pool.request().query('SELECT 1 as test');
      await pool.close();
      results.push({ config: cfg, status: 'SUCCESS', result: r.recordset });
    } catch (e: any) {
      results.push({ config: cfg, status: 'FAILED', error: e.message });
    }
  }
  return results;
}



  
}