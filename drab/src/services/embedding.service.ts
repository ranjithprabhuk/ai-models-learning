import { pipeline, Pipeline } from '@xenova/transformers';
import path from 'path';

export class EmbeddingService {
  private static instance: EmbeddingService;
  private embedder: Pipeline | null = null;
  private modelName = 'sentence-transformers/all-MiniLM-L6-v2';
  private localModelPath = path.resolve(process.cwd(), 'all-MiniLM-L6-v2');

  private constructor() {}

  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  /**
   * Initialize the embedding model
   * Uses local model for faster loading and offline capability
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing embedding model...');

      // Try to load from local model first
      console.log(`Attempting to load local model from: ${this.localModelPath}`);
      
      try {
        this.embedder = await pipeline('feature-extraction', this.localModelPath, {
          quantized: false,
          local_files_only: true,
        });
        console.log('✅ Successfully loaded local model from', this.localModelPath);
      } catch (localError) {
        console.warn('⚠️ Failed to load local model, falling back to HuggingFace:', localError);
        
        // Fallback to HuggingFace if local model fails
        // Disable SSL verification for development (not recommended for production)
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
        
        console.log('Loading model from HuggingFace as fallback...');
        this.embedder = await pipeline('feature-extraction', this.modelName, {
          quantized: false,
        });
        console.log('✅ Successfully loaded model from HuggingFace (fallback)');
      }

      console.log('Embedding model initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize embedding model:', error);
      throw new Error(
        `Failed to initialize embedding model: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate embeddings for the given text
   * @param text - Input text to generate embeddings for
   * @returns Promise<number[]> - Array of embedding values
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) {
      throw new Error('Embedding model not initialized. Call initialize() first.');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Input text cannot be empty');
    }

    try {
      console.log(`Generating embedding for text: "${text.substring(0, 50)}..."`);

      // Generate embedding using the pipeline
      const result = await this.embedder(text, {
        pooling: 'mean',
        normalize: true,
      });

      // Extract the embedding array from the result
      // The result is typically a nested array structure
      let embedding: number[];

      if (Array.isArray(result) && result.length > 0) {
        // Handle different possible output formats
        if (Array.isArray(result[0])) {
          embedding = result[0];
        } else {
          embedding = result;
        }
      } else if (result?.data) {
        // Handle tensor-like objects
        embedding = Array.from(result.data);
      } else {
        throw new Error('Unexpected embedding result format');
      }

      console.log(`Generated embedding with ${embedding.length} dimensions`);
      return embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate embeddings for multiple texts
   * @param texts - Array of input texts
   * @returns Promise<number[][]> - Array of embedding arrays
   */
  public async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      throw new Error('Input texts array cannot be empty');
    }

    const embeddings: number[][] = [];
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Check if the model is initialized
   */
  public isInitialized(): boolean {
    return this.embedder !== null;
  }

  /**
   * Get model information
   */
  public getModelInfo(): { name: string; localPath: string; initialized: boolean; isLocal: boolean } {
    return {
      name: this.modelName,
      localPath: this.localModelPath,
      initialized: this.isInitialized(),
      isLocal: true, // We prioritize local model loading
    };
  }
}
