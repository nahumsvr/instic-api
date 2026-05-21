import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LocationsModule } from './locations/locations.module';
import { InventoryModule } from './inventory/inventory.module';
import { ArticlesModule } from './articles/articles.module';
import { MovementsModule } from './movements/movements.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DB_URL'),
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false, // Obligatorio para evitar errores de certificados autofirmados en la nube
          },
        },
        autoLoadEntities: true,
        synchronize: false, // ESTO DEBE ESTAR EN FALSE EN PRODUCCIÓN.
      }),
    }),
    AuthModule,
    UsersModule,
    LocationsModule,
    InventoryModule,
    ArticlesModule,
    MovementsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
