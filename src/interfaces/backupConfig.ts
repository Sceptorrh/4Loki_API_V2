export interface BackupConfig {
  googleDrive: {
    enabled: boolean;
    folderId: string;
    autoBackup: {
      enabled: boolean;
      interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
      maxFiles: number;
      time?: string;
    };
  };
} 