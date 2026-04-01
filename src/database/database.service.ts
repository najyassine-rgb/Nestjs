import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(private dataSource: DataSource) {}

  getDataSource(): DataSource {
    return this.dataSource;
  }

  async query(query: string, parameters?: any[]) {
    return this.dataSource.query(query, parameters);
  }
}
