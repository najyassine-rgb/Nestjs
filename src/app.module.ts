import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { DeviseModule } from './devise/devise.module';
import { AuthModule } from './modules/auth/auth.module';
import { SocieteModule } from './modules/societe/societe.module';
import { UsersModule } from './modules/users/users.module';
import { X3Module } from './modules/x3/x3.module';
import { BanqueModule } from './modules/banque/banque.module';
import { LibelleModule } from './modules/Libelle/libelle.module';


@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    DeviseModule,
    X3Module,
    SocieteModule,
     BanqueModule,
     LibelleModule,
  ],
})
export class AppModule {}
