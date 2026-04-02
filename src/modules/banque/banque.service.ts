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
          responseType: 'text', // 👈 key fix — don't let axios try to parse as JSON
        },
      ),
    );
    return await this.parseX3Response(response.data);
  } catch (error) {
    console.error('getBanquesX3 error:', error?.response?.data ?? error?.message);
    return [];
  }
}

  // private async getPool(): Promise<sql.ConnectionPool> {
  //   const dbServer = this.configService.dbServer;
  //   const parts = dbServer.split('\\');
  //   return sql.connect({
  //     server: parts[0],
  //     user: this.configService.dbUser,
  //     password: this.configService.dbPassword,
  //     database: this.configService.dbName,
  //     options: {
  //       trustServerCertificate: true,
  //       instanceName: parts[1] ?? undefined,
  //     },
  //   });
  // }

// private async getPool(): Promise<sql.ConnectionPool> {
//   return sql.connect({
//     server: this.configService.dbServer,
//     port: this.configService.dbPort,
//     user: this.configService.dbUser,
//     password: this.configService.dbPassword,
//     database: this.configService.dbName,
//     options: {
//       trustServerCertificate: true,
//       encrypt: false,
//     },
//   });
// }

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


  // async getBanquesTreso(): Promise<any[]> {
  //   try {
  //     const pool = await this.getPool();
  //     const result = await pool.request().query('SELECT * FROM GSPARTYBASE');
  //     console.log('GSPARTYBASE columns:', Object.keys(result.recordset[0] ?? {}));
  //     await pool.close();
  //     return result.recordset;
  //   } catch (error) {
  //     console.error('getBanquesTreso error:', error?.message);
  //     return [];
  //   }
  // }


//   async getBanquesTreso(): Promise<any[]> {
//   try {
//     const pool = await this.getPool();
//     console.log('SQL connected successfully');

//     // First check if table exists
//     const tableCheck = await pool.request().query(`
//       SELECT COUNT(*) as cnt 
//       FROM INFORMATION_SCHEMA.TABLES 
//       WHERE TABLE_NAME = 'GSPARTYBASE'
//     `);
//     console.log('Table GSPARTYBASE exists check:', tableCheck.recordset[0]);

//     // List all tables in SXA
//     const tables = await pool.request().query(`
//       SELECT TOP 20 TABLE_NAME 
//       FROM INFORMATION_SCHEMA.TABLES 
//       WHERE TABLE_TYPE = 'BASE TABLE'
//       ORDER BY TABLE_NAME
//     `);
//     console.log('Tables in SXA:', tables.recordset.map((t: any) => t.TABLE_NAME));

//     // Try the actual query
//     const result = await pool.request().query('SELECT TOP 5 * FROM GSPARTYBASE');
//     console.log('GSPARTYBASE row count:', result.recordset.length);
//     console.log('GSPARTYBASE first row:', JSON.stringify(result.recordset[0]));

//     await pool.close();
//     return result.recordset;
//   } catch (error) {
//     console.error('getBanquesTreso FULL error:', error?.message);
//     console.error('getBanquesTreso error code:', (error as any)?.code);
//     console.error('getBanquesTreso error number:', (error as any)?.number);
//     return [];
//   }
// }

async getBanquesTreso(): Promise<any[]> {
  try {
    const pool = await this.getPool();
    // const result = await pool.request().query('SELECT * FROM GS_PARTY_BASE');
    const result = await pool.request().query(
  'SELECT * FROM GS_PARTY_BASE WHERE PARTYTYPE = 1'
);
    // console.log('GS_PARTY_BASE count:', result.recordset.length);
    // console.log('GS_PARTY_BASE first row:', JSON.stringify(result.recordset[0]));
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('getBanquesTreso error:', (error as any)?.message);
    return [];
  }
}

  // async getCorrespondances(): Promise<any[]> {
  //   try {
  //     const pool = await this.getPool();
  //     await pool.request().query(`
  //       IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BANQUE_CORRESPONDANCE' AND xtype='U')
  //       CREATE TABLE BANQUE_CORRESPONDANCE (
  //         id INT IDENTITY(1,1) PRIMARY KEY,
  //         banqueX3 NVARCHAR(50) NOT NULL,
  //         banqueTreso NVARCHAR(50) NOT NULL,
  //         dateCreation DATETIME DEFAULT GETDATE()
  //       )
  //     `);
  //     const result = await pool.request().query('SELECT * FROM BANQUE_CORRESPONDANCE');
  //     await pool.close();
  //     return result.recordset;
  //   } catch (error) {
  //     console.error('getCorrespondances error:', error?.message);
  //     return [];
  //   }
  // }

  // async saveCorrespondances(
  //   correspondances: { banqueX3: string; banqueTreso: string }[]
  // ): Promise<{ success: boolean }> {
  //   const pool = await this.getPool();
  //   await pool.request().query(`DELETE FROM BANQUE_CORRESPONDANCE`);
  //   for (const c of correspondances) {
  //     await pool.request()
  //       .input('banqueX3', sql.NVarChar, c.banqueX3)
  //       .input('banqueTreso', sql.NVarChar, c.banqueTreso)
  //       .query(`INSERT INTO BANQUE_CORRESPONDANCE (banqueX3, banqueTreso)
  //               VALUES (@banqueX3, @banqueTreso)`);
  //   }
  //   await pool.close();
  //   return { success: true };
  // }

//   async getCorrespondances(): Promise<any[]> {
//   try {
//     const pool = await this.getPool();

//     await pool.request().query(`
//       IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BANQUE_CORRESPONDANCE' AND xtype='U')
//       CREATE TABLE BANQUE_CORRESPONDANCE (
//         id INT IDENTITY(1,1) PRIMARY KEY,
//         banqueX3 NVARCHAR(50) NOT NULL,
//         banqueTreso NVARCHAR(50) NOT NULL,
//         dateCreation DATETIME DEFAULT GETDATE()
//       )
//     `);

//     // Join to get actual names
//     const result = await pool.request().query(`
//       SELECT 
//         bc.id,
//         bc.banqueX3,
//         bc.banqueTreso,
//         bc.dateCreation,
//         b.PAB as banqueX3Nom,
//         p.DESCRIPTION as banqueTresoNom
//       FROM BANQUE_CORRESPONDANCE bc
//       LEFT JOIN BANKS b ON b.BAN = bc.banqueX3
//       LEFT JOIN GS_PARTY_BASE p ON p.CODE = bc.banqueTreso AND p.PARTYTYPE = 1
//     `);

//     await pool.close();
//     return result.recordset;
//   } catch (error) {
//     console.error('getCorrespondances error:', (error as any)?.message);
//     return [];
//   }
// }


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

    const result = await pool.request().query(`
      SELECT 
        bc.id,
        bc.banqueX3,
        bc.banqueTreso,
        bc.dateCreation,
        b.PAB        AS banqueX3Nom,
        p.DESCRIPTION AS banqueTresoNom
      FROM BANQUE_CORRESPONDANCE bc
      LEFT JOIN BANKS b        ON b.BAN  = bc.banqueX3
      LEFT JOIN GS_PARTY_BASE p ON p.CODE = bc.banqueTreso AND p.PARTYTYPE = 1
    `);

    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('getCorrespondances error:', (error as any)?.message);
    return [];
  }
}

  async saveCorrespondances(
  correspondances: { banqueX3: string; banqueTreso: string }[]
): Promise<{ success: boolean }> {
  const pool = await this.getPool();

  // Create table if not exists
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BANQUE_CORRESPONDANCE' AND xtype='U')
    CREATE TABLE BANQUE_CORRESPONDANCE (
      id INT IDENTITY(1,1) PRIMARY KEY,
      banqueX3 NVARCHAR(50) NOT NULL,
      banqueTreso NVARCHAR(50) NOT NULL,
      dateCreation DATETIME DEFAULT GETDATE()
    )
  `);

  // Delete only what we're replacing, then insert
  await pool.request().query(`DELETE FROM BANQUE_CORRESPONDANCE`);

  for (const c of correspondances) {
    await pool.request()
      .input('banqueX3', sql.NVarChar, c.banqueX3)
      .input('banqueTreso', sql.NVarChar, c.banqueTreso)
      .query(`
        INSERT INTO BANQUE_CORRESPONDANCE (banqueX3, banqueTreso)
        VALUES (@banqueX3, @banqueTreso)
      `);
  }

  await pool.close();
  return { success: true };
}

}