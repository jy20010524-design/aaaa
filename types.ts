export interface SquishyRecord {
  id: string;
  shopName: string;
  moldName?: string; // New field (模具名称)
  squishDate: string; // Renamed from 'date' (开捏日期)
  recordDate: string; // New field (记录日期)
  
  // Changed from string to string[]
  imagesBefore: string[]; 
  imagesDuring: string[]; // New field (开捏中)
  imagesAfter: string[];
  
  // New Optional Fields
  rating?: number; // 1-5
  weight?: string;
  price?: string;
  texture?: string;
  notes?: string; // New field (备注)

  createdAt: number;
}

export interface CompressResult {
  base64: string;
  error?: string;
}