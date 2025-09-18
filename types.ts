export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface CropJob {
  id: string;
  fileName: string;
  status: JobStatus;
  createdAt: string;
  outputUrl?: string;
}

export interface ApiKey {
  key: string;
  createdAt: Date;
  callCount: number;
}
