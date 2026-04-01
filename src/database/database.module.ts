import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module'; // ✅ ADD THIS
import { ConfigService } from '../config/config.service';
import { User } from '../modules/users/user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'sqlite',
        database: 'db.sqlite',
        entities: [User],
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
