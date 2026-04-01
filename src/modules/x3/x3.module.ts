import { Module } from '@nestjs/common';
import { X3Controller } from './x3.controller';
import { X3Service } from './x3.service';

@Module({
  providers: [X3Service],
  controllers: [X3Controller],
})
export class X3Module {}
