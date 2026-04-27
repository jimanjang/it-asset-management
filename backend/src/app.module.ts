import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DevicesModule } from './devices/devices.module';
import { AssetsModule } from './assets/assets.module';
import { SyncModule } from './sync/sync.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PoliciesModule } from './policies/policies.module';
import { ExceptionsModule } from './exceptions/exceptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const isPostgres = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgres';
        return {
          type: (isPostgres ? 'postgres' : 'sqljs') as any,
          ...(isPostgres
            ? {
                url: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' 
                  ? { rejectUnauthorized: false } 
                  : false,
              }
            : {
                location: 'chromeos_assets.sqlite',
                autoSave: true,
              }),
          autoLoadEntities: true,
          synchronize: process.env.NODE_ENV !== 'production' || !isPostgres,
        };
      },
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    DevicesModule,
    AssetsModule,
    SyncModule,
    DashboardModule,
    PoliciesModule,
    ExceptionsModule,
  ],
})
export class AppModule {}
