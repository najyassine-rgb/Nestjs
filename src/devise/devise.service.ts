// src/devise/devise.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { MappingDto } from './dto/mapping.dto';

@Injectable()
export class DeviseService {
  private x3 = [
    { code: 'EUR', label: 'Euro' },
    { code: 'USD', label: 'US Dollar' },
    { code: 'TND', label: 'Dinar Tunisien' },
  ];

  private xrt = [
    { code: 'EUR', label: 'Euro' },
    { code: 'USD', label: 'US Dollar' },
    { code: 'GBP', label: 'Pound' },
  ];

  private mappings = [{ id: 1, x3_code: 'EUR', xrt_code: 'EUR' }];

  // X3
  getX3() {
    return this.x3;
  }

  // XRT
  getXRT() {
    return this.xrt;
  }

  // mappings
  getMappings() {
    return this.mappings;
  }

  create(dto: MappingDto) {
    const exists = this.mappings.find(
      (m) => m.x3_code === dto.x3_code && m.xrt_code === dto.xrt_code,
    );

    if (exists) {
      throw new BadRequestException('Mapping already exists');
    }

    const newItem = {
      id: Date.now(),
      ...dto,
    };

    this.mappings.push(newItem);
    return newItem;
  }

  update(id: number, dto: MappingDto) {
    const item = this.mappings.find((m) => m.id === id);
    if (!item) throw new BadRequestException('Not found');

    item.x3_code = dto.x3_code;
    item.xrt_code = dto.xrt_code;

    return item;
  }

  delete(id: number) {
    this.mappings = this.mappings.filter((m) => m.id !== id);
    return { message: 'Deleted' };
  }
}
