export interface RecommendedProduct {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  url?: string;
  category?: string;
  brand?: string;
  sku?: string;
  inStock?: boolean;
  rating?: number;
  reviewCount?: number;
  metadata?: Record<string, any>;
  scrapedAt: Date;
}

export interface ScrapingResult {
  success: boolean;
  products: RecommendedProduct[];
  totalProducts: number;
  scrapedAt: Date;
  duration: number;
  error?: string;
}

export interface ScrapingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  result?: ScrapingResult;
  error?: string;
}
