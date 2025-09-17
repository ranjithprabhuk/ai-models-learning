export interface EmbeddingRequest {
  text: string;
  id?: string;
  metadata?: Record<string, any>;
}

export interface EmbeddingResponse {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, any>;
  success: boolean;
}

export interface QueryRequest {
  query: string;
  limit?: number;
  threshold?: number;
}

export interface QueryResult {
  id: string;
  text: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface QueryResponse {
  results: QueryResult[];
  query: string;
  success: boolean;
}

export interface VectorRecord {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, any>;
}