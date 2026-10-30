import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { MONGODB_CLIENT, MONGODB_DATABASE } from './database.constants';

@Global()
@Module({
  providers: [
    DatabaseService,
    {
      provide: MONGODB_CLIENT,
      useFactory: async (dbService: DatabaseService) => {
        await dbService.ensureConnected();
        return dbService.getClient();
      },
      inject: [DatabaseService],
    },
    {
      provide: MONGODB_DATABASE,
      useFactory: async (dbService: DatabaseService) => {
        await dbService.ensureConnected();
        return dbService.getDb();
      },
      inject: [DatabaseService],
    },
  ],
  exports: [DatabaseService, MONGODB_CLIENT, MONGODB_DATABASE],
})
export class DatabaseModule {}
