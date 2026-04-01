// import { Injectable } from '@nestjs/common';
// import { HttpService } from '@nestjs/axios';
// import { firstValueFrom } from 'rxjs';
// import { ConfigService } from '../../config/config.service';

// @Injectable()
// export class SocieteService {

//   constructor(
//     private readonly httpService: HttpService,
//     private readonly configService: ConfigService,
//   ) {}

//   private getSoapBody(): string {
//     return `<soapenv:Envelope 
//     xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
//     xmlns:wss="http://www.adonix.com/WSS"
//     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
//     <soapenv:Header/>
//     <soapenv:Body>
//       <wss:query soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
//         <callContext xsi:type="wss:CAdxCallContext">
//           <codeLang xsi:type="xsd:string">FRA</codeLang>
//           <poolAlias xsi:type="xsd:string">SEED</poolAlias>
//           <poolId xsi:type="xsd:string"></poolId>
//           <requestConfig xsi:type="xsd:string">adxwss.optreturn=JSON</requestConfig>
//         </callContext>
//         <publicName xsi:type="xsd:string">YCPY</publicName>
//         <objectKeys xsi:type="wss:ArrayOfCAdxParamKeyValue"></objectKeys>
//         <listSize xsi:type="xsd:int">10</listSize>
//       </wss:query>
//     </soapenv:Body>
//   </soapenv:Envelope>`;
//   }

//   // async getSocietes(): Promise<any> {
//   //   const auth = Buffer.from(
//   //     `${this.configService.x3Username}:${this.configService.x3Password}`
//   //   ).toString('base64');

//   //   try {
//   //     const response = await firstValueFrom(
//   //       this.httpService.post(
//   //         this.configService.x3SoapUrl,
//   //         this.getSoapBody(),
//   //         {
//   //           headers: {
//   //             'Content-Type': 'text/xml;charset=UTF-8',
//   //             'SOAPAction': 'query',
//   //             'Authorization': `Basic ${auth}`,
//   //           },
//   //         },
//   //       ),
//   //     );
//   //     return response.data;
//   //   } catch (error) {
//   //     console.error('getSocietes error:', error?.response?.data ?? error?.message);
//   //     return [];
//   //   }
//   // }

//   async getSocietes(): Promise<any> {
//   const auth = Buffer.from(
//     `${this.configService.x3Username}:${this.configService.x3Password}`
//   ).toString('base64');

//   try {
//     const response = await firstValueFrom(
//       this.httpService.post(
//         this.configService.x3SoapUrl,
//         this.getSoapBody(),
//         {
//           headers: {
//             'Content-Type': 'text/xml;charset=UTF-8',
//             'SOAPAction': 'query',
//             'Authorization': `Basic ${auth}`,
//           },
//         },
//       ),
//     );
//     console.log('getSocietes success:', JSON.stringify(response.data).substring(0, 300));
//     return response.data;
//   } catch (error) {
//     console.error('getSocietes status:', error?.response?.status);
//     console.error('getSocietes error:', error?.response?.data ?? error?.message);
//     throw error; // 👈 rethrow so it doesn't hide as empty array
//   }
// }
// }






import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as xml2js from 'xml2js';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class SocieteService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private getSoapBody(): string {
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
        <publicName xsi:type="xsd:string">YCPY</publicName>
        <objectKeys xsi:type="wss:ArrayOfCAdxParamKeyValue"></objectKeys>
        <listSize xsi:type="xsd:int">10</listSize>
      </wss:query>
    </soapenv:Body>
  </soapenv:Envelope>`;
  }

  async getSocietes(): Promise<any[]> {
    const auth = Buffer.from(
      `${this.configService.x3Username}:${this.configService.x3Password}`
    ).toString('base64');

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          this.configService.x3SoapUrl,
          this.getSoapBody(),
          {
            headers: {
              'Content-Type': 'text/xml;charset=UTF-8',
              'SOAPAction': 'query',
              'Authorization': `Basic ${auth}`,
            },
            // Force axios to treat response as text, not JSON
            responseType: 'text',
          },
        ),
      );

      const xmlStr = response.data as string;
      const parsed = await xml2js.parseStringPromise(xmlStr, {
        explicitArray: false,
        ignoreAttrs: false,
      });

      const body = parsed?.['soapenv:Envelope']?.['soapenv:Body'];
      const queryReturn = body?.['wss:queryResponse']?.['queryReturn'];
      const resultXml = queryReturn?.['resultXml'];

      const raw = typeof resultXml === 'object' ? resultXml?._ ?? resultXml : resultXml;
      const jsonStr = String(raw).trim();
      const result = JSON.parse(jsonStr);

      const societes = Array.isArray(result) ? result : [result];
      console.log('Societes count:', societes.length);
      console.log('First societe:', JSON.stringify(societes[0], null, 2));
      return societes;

    } catch (error) {
      console.error('getSocietes error:', error?.response?.data ?? error?.message);
      return [];
    }
  }
}