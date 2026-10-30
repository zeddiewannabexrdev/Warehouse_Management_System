export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
  mongodb: {
    uri: string;
    databaseName: string;
  };
  jwt: {
    secret: string;
    expiration: string;
    refreshSecret: string;
    refreshExpiration: string;
  };
  seed: {
    adminEmail: string;
    adminPassword: string;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/material_inventory_db',
    databaseName: process.env.DATABASE_NAME || 'material_inventory_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'distributed_wms_secret_key_change_in_production_2026',
    expiration: process.env.JWT_EXPIRATION || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'distributed_wms_refresh_secret_key_2026',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  seed: {
    adminEmail: process.env.ADMIN_DEFAULT_EMAIL || 'admin@wms.enterprise.vn',
    adminPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@Distributed2026',
  },
});
