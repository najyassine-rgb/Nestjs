import { Injectable } from '@nestjs/common';
import * as sql from 'mssql';

@Injectable()
export class LibelleService {

  private async getPool(): Promise<sql.ConnectionPool> {
    return sql.connect({
      server: 'localhost',
      port: 49993,
      user: 'sa',
      password: 'Azerty123#',
      database: 'SXA',
      options: {
        trustServerCertificate: true,
        encrypt: false,
      },
    });
  }

  async getOperations(): Promise<{ code: string; libelle: string }[]> {
    try {
      const pool = await this.getPool();
      const result = await pool.request().query(
        'SELECT FLOW_CODE, DESCRIPTION FROM CASH_FLOW ORDER BY DESCRIPTION'
      );
      await pool.close();
      return result.recordset.map((r: any) => ({
        code: r.FLOW_CODE,
        libelle: r.DESCRIPTION,
      }));
    } catch (error) {
      console.error('getOperations error:', (error as any)?.message);
      return [];
    }
  }
}