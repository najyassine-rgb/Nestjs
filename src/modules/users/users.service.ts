import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(login: string, password: string, role?: string): Promise<User> {
    const user = this.usersRepository.create({
      login,
      password,
      role: role || 'user',
    });
    return this.usersRepository.save(user);
  }

  async findBylogin(login: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { login } });
    return user ?? undefined; // converts null to undefined
  }

  async findById(id: number): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { id } });
    return user ?? undefined;
  }

  async findAll() {
    return this.usersRepository.find({
      select: ['id', 'login', 'role'],
    });
  }

  async update(id: number, fields: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (fields.login) user.login = fields.login;
    if (fields.password) user.password = await bcrypt.hash(fields.password, 10);
    if (fields.role) user.role = fields.role;

    return this.usersRepository.save(user);
  }
}
