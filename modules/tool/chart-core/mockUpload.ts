// Mock upload for development and testing
// import type { FileInput } from '@/s3/controller';

export interface MockFileMetadata {
  accessUrl: string;
  filename: string;
  size: number;
}

export const mockUploadFile = async (data: any): Promise<MockFileMetadata> => {
  // 在开发模式下返回mock数据
  const mockUrl = `https://mock-chart-storage.example.com/chart-${Date.now()}.svg`;

  return {
    accessUrl: mockUrl,
    filename: data.defaultFilename || 'chart.svg',
    size: data.base64?.length || 0
  };
};
