// src/devise/devise.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DeviseService } from './devise.service';
import { MappingDto } from './dto/mapping.dto';

@Controller()
export class DeviseController {
  constructor(private service: DeviseService) {}

  @Get('x3/devises')
  getX3() {
    return this.service.getX3();
  }

  @Get('xrt/devises')
  getXRT() {
    return this.service.getXRT();
  }

  @Get('correspondance/devise')
  getMappings() {
    return this.service.getMappings();
  }

  @Post('correspondance/devise')
  create(@Body() dto: MappingDto) {
    return this.service.create(dto);
  }

  @Put('correspondance/devise/:id')
  update(@Param('id') id: number, @Body() dto: MappingDto) {
    return this.service.update(+id, dto);
  }

  @Delete('correspondance/devise/:id')
  delete(@Param('id') id: number) {
    return this.service.delete(+id);
  }
}
