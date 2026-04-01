import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class ConfigService {

  get(key: string): string {
    const value = process.env[key];
    if (value === undefined) {
      throw new Error(`Config key "${key}" is not set`);
    }
    return value;
  }

  get x3SoapUrl(): string { return this.get('X3_SOAP_URL'); }
  get x3Username(): string { return this.get('X3_USERNAME'); }
  get x3Password(): string { return this.get('X3_PASSWORD'); }

  get dbServer(): string { return this.get('DB_SERVER'); }
  get dbUser(): string { return this.get('DB_USER'); }
  get dbPassword(): string { return this.get('DB_PASSWORD'); }
  get dbName(): string { return this.get('DB_NAME'); }
}