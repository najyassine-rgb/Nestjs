import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as sql from 'mssql';
import * as xml2js from 'xml2js';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class BanqueService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private getSoapBody(publicName: string): string {
    return `<soapenv:Envelope 
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
    xmlns:wss="http://www.adonix.com/WSS"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <soapenv:Header/>
    <soapenv:Body>
      <wss:query soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <callContext xsi:type="wss:CAdxCallContext">
          <codeLang xsi:type="xsd:string">FRA</codeLang>
          <poolAlias xsi:type="xsd:string">SEED</poolAlias>
          <poolId xsi:type="xsd:string"></poolId>
          <requestConfig xsi:type="xsd:string">adxwss.optreturn=JSON</requestConfig>
        </callContext>
        <publicName xsi:type="xsd:string">${publicName}</publicName>
        <objectKeys xsi:type="wss:ArrayOfCAdxParamKeyValue"></objectKeys>
        <listSize xsi:type="xsd:int">100</listSize>
      </wss:query>
    </soapenv:Body>
  </soapenv:Envelope>`;
  }

  private getAuth(): string {
    return Buffer.from(
      `${this.configService.x3Username}:${this.configService.x3Password}`
    ).toString('base64');
  }

//   private async parseX3Response(data: any): Promise<any[]> {
//     try {
//       const xmlStr = typeof data === 'string' ? data : JSON.stringify(data);
//       const parsed = await xml2js.parseStringPromise(xmlStr, {
//         explicitArray: false,
//         ignoreAttrs: true,
//       });

//       const body = parsed?.['soapenv:Envelope']?.['soapenv:Body'];
//       const queryReturn = body?.['wss:queryResponse']?.['queryReturn'];
//       const resultXml = queryReturn?.['resultXml'];

//       if (!resultXml || resultXml === '') {
//         console.log('resultXml empty');
//         return [];
//       }

//       // Parse the JSON string inside resultXml
//       const resultJson = JSON.parse(resultXml);
//       console.log('resultJson full:', JSON.stringify(resultJson, null, 2).substring(0, 1000));

//       const keys = Object.keys(resultJson);
//       console.log('resultJson keys:', keys);

//       // Look for any array value
//       for (const key of keys) {
//         const val = resultJson[key];
//         if (Array.isArray(val)) {
//           console.log(`Found array under key "${key}", length: ${val.length}`);
//           console.log('First item:', JSON.stringify(val[0], null, 2));
//           return val;
//         }
//       }

//       // Try common X3 wrapper keys
//       if (resultJson?.GRP) return Array.isArray(resultJson.GRP) ? resultJson.GRP : [resultJson.GRP];
//       if (resultJson?.grp) return Array.isArray(resultJson.grp) ? resultJson.grp : [resultJson.grp];
//       if (resultJson?.recordset) return resultJson.recordset;

//       console.log('No array found, full resultJson:', JSON.stringify(resultJson).substring(0, 800));
//       return [];
//     } catch (e) {
//       console.error('parseX3Response error:', e?.message);
//       return [];
//     }
//   }

private async parseX3Response(data: any): Promise<any[]> {
  try {
    const xmlStr = typeof data === 'string' ? data : JSON.stringify(data);
    const parsed = await xml2js.parseStringPromise(xmlStr, {
      explicitArray: false,
      ignoreAttrs: false,
    });

    const body = parsed?.['soapenv:Envelope']?.['soapenv:Body'];
    const queryReturn = body?.['wss:queryResponse']?.['queryReturn'];
    const resultXml = queryReturn?.['resultXml'];

    if (!resultXml || resultXml === '') {
      console.log('resultXml empty');
      return [];
    }

    // resultXml is already the JSON string — extract it
    const raw = typeof resultXml === 'object' ? resultXml?._ ?? resultXml : resultXml;
    console.log('raw resultXml type:', typeof raw, '| preview:', String(raw).substring(0, 200));

    // It may be wrapped in CDATA or be a plain JSON string
    const jsonStr = String(raw).trim();

    // Try direct parse
    const result = JSON.parse(jsonStr);

    if (Array.isArray(result)) {
      console.log(`Direct array, length: ${result.length}`);
      console.log('First item:', JSON.stringify(result[0], null, 2));
      return result;
    }

    if (typeof result === 'object') {
      const keys = Object.keys(result);
      console.log('Object keys:', keys);
      for (const key of keys) {
        if (Array.isArray(result[key])) return result[key];
      }
      return [result];
    }

    return [];
  } catch (e) {
    console.error('parseX3Response error:', e?.message);
    return [];
  }
}




  async getBanquesX3(): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          this.configService.x3SoapUrl,
          this.getSoapBody('YABN'),
          {
            headers: {
              'Content-Type': 'text/xml;charset=UTF-8',
              'SOAPAction': 'query',
              'Authorization': `Basic ${this.getAuth()}`,
            },
          },
        ),
      );
      return await this.parseX3Response(response.data);
    } catch (error) {
      console.error('getBanquesX3 error:', error?.response?.data ?? error?.message);
      return [];
    }
  }

  private async getPool(): Promise<sql.ConnectionPool> {
    const dbServer = this.configService.dbServer;
    const parts = dbServer.split('\\');
    return sql.connect({
      server: parts[0],
      user: this.configService.dbUser,
      password: this.configService.dbPassword,
      database: this.configService.dbName,
      options: {
        trustServerCertificate: true,
        instanceName: parts[1] ?? undefined,
      },
    });
  }

  async getBanquesTreso(): Promise<any[]> {
    try {
      const pool = await this.getPool();
      const result = await pool.request().query('SELECT * FROM GSPARTYBASE');
      console.log('GSPARTYBASE columns:', Object.keys(result.recordset[0] ?? {}));
      await pool.close();
      return result.recordset;
    } catch (error) {
      console.error('getBanquesTreso error:', error?.message);
      return [];
    }
  }

  async getCorrespondances(): Promise<any[]> {
    try {
      const pool = await this.getPool();
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BANQUE_CORRESPONDANCE' AND xtype='U')
        CREATE TABLE BANQUE_CORRESPONDANCE (
          id INT IDENTITY(1,1) PRIMARY KEY,
          banqueX3 NVARCHAR(50) NOT NULL,
          banqueTreso NVARCHAR(50) NOT NULL,
          dateCreation DATETIME DEFAULT GETDATE()
        )
      `);
      const result = await pool.request().query('SELECT * FROM BANQUE_CORRESPONDANCE');
      await pool.close();
      return result.recordset;
    } catch (error) {
      console.error('getCorrespondances error:', error?.message);
      return [];
    }
  }

  async saveCorrespondances(
    correspondances: { banqueX3: string; banqueTreso: string }[]
  ): Promise<{ success: boolean }> {
    const pool = await this.getPool();
    await pool.request().query(`DELETE FROM BANQUE_CORRESPONDANCE`);
    for (const c of correspondances) {
      await pool.request()
        .input('banqueX3', sql.NVarChar, c.banqueX3)
        .input('banqueTreso', sql.NVarChar, c.banqueTreso)
        .query(`INSERT INTO BANQUE_CORRESPONDANCE (banqueX3, banqueTreso)
                VALUES (@banqueX3, @banqueTreso)`);
    }
    await pool.close();
    return { success: true };
  }
}