import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as xml2js from 'xml2js';

@Injectable()
export class X3Service {
  private url =
    'http://localhost:8124/soap-generic/syracuse/collaboration/syracuse/CAdxWebServiceXmlCC';

  async getSocietes() {
    const body = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:wss="http://www.adonix.com/WSS"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <soapenv:Header/>
      <soapenv:Body>
        <wss:query>
          <callContext xsi:type="wss:CAdxCallContext">
            <codeLang xsi:type="xsd:string">FRA</codeLang>
            <poolAlias xsi:type="xsd:string">SEED</poolAlias>
            <requestConfig xsi:type="xsd:string">adxwss.optreturn=JSON</requestConfig>
          </callContext>
          <publicName xsi:type="xsd:string">YCPY</publicName>
          <objectKeys xsi:type="wss:ArrayOfCAdxParamKeyValue"/>
          <listSize xsi:type="xsd:int">20</listSize>
        </wss:query>
      </soapenv:Body>
    </soapenv:Envelope>
    `;

    const response = await axios.post(this.url, body, {
      headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
    });

    const parsed = await xml2js.parseStringPromise(response.data, {
      explicitArray: false,
    });

    const json =
      parsed['soapenv:Envelope']['soapenv:Body']['wss:queryResponse'][
        'resultXml'
      ];

    const data = JSON.parse(json);

    // 🔥 IMPORTANT : retourner seulement la liste utile
    return data.data || data;
  }
}
