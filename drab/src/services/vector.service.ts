import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import type { VectorRecord, QueryResult } from '../types';

export class VectorService {
  private static instance: VectorService;
  private client: QdrantClient;
  private collectionName = 'drab_embeddings';
  private vectorSize = 384; // all-MiniLM-L6-v2 produces 384-dimensional embeddings

  private constructor() {
    const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    this.client = new QdrantClient({ url: qdrantUrl });
  }

  public static getInstance(): VectorService {
    if (!VectorService.instance) {
      VectorService.instance = new VectorService();
    }
    return VectorService.instance;
  }

  /**
   * Initialize the vector database and create collection if it doesn't exist
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing vector database...');

      // Check if collection exists
      const collections = await this.client.getCollections();
      const collectionExists = collections.collections?.some(
        (col) => col.name === this.collectionName
      );

      if (!collectionExists) {
        console.log(`Creating collection: ${this.collectionName}`);
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine',
          },
          optimizers_config: {
            default_segment_number: 2,
          },
          replication_factor: 1,
        });
        console.log('Collection created successfully');
      } else {
        console.log('Collection already exists');
      }

      // Test connection
      const info = await this.client.getCollection(this.collectionName);
      console.log(`Vector database initialized. Collection info:`, {
        vectorsCount: info.points_count || 0,
        status: info.status,
        vectorSize: this.vectorSize,
      });
    } catch (error) {
      console.error('Failed to initialize vector database:', error);
      throw new Error(
        `Failed to initialize vector database: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Convert custom ID to UUID format that Qdrant accepts
   * @param customId - Custom ID provided by user
   * @returns UUID string
   */
  private convertToValidId(customId?: string): string {
    if (!customId) {
      return uuidv4();
    }
    
    // If it's already a UUID, return as is
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(customId)) {
      return customId;
    }
    
    // Create a deterministic UUID from the custom ID using crypto hash
    // This ensures the same custom ID always maps to the same UUID
    const hash = crypto.createHash('sha256').update(customId).digest('hex');
    
    // Format as UUID v4
    const uuid = [
      hash.substring(0, 8),
      hash.substring(8, 12),
      '4' + hash.substring(13, 16), // Version 4
      ((parseInt(hash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.substring(17, 20), // Variant bits
      hash.substring(20, 32)
    ].join('-');
    
    return uuid;
  }

  /**
   * Store a vector record in the database
   * @param record - Vector record to store
   * @returns Promise<string> - ID of the stored record
   */
  public async storeVector(record: VectorRecord): Promise<string> {
    try {
      const originalId = record.id;
      const qdrantId = this.convertToValidId(record.id);
      
      console.log(`Storing vector with original ID: ${originalId} -> Qdrant ID: ${qdrantId}`);
      console.log(`Embedding dimensions: ${record.embedding.length}`);

      if (record.embedding.length !== this.vectorSize) {
        throw new Error(
          `Embedding dimension mismatch. Expected ${this.vectorSize}, got ${record.embedding.length}`
        );
      }
      
      const point = {
        id: qdrantId,
        vector: record.embedding,
        payload: {
          original_id: originalId, // Store the original ID in payload for reference
          text: record.text,
          metadata: record.metadata || {},
          created_at: new Date().toISOString(),
        },
      };

      console.log(`Attempting to store point with Qdrant ID: ${qdrantId}`);

      await this.client.upsert(this.collectionName, {
        wait: true,
        points: [point],
      });

      console.log(`Vector stored successfully with Qdrant ID: ${qdrantId} (original: ${originalId})`);
      return originalId || qdrantId; // Return the original ID if provided, otherwise the generated UUID
    } catch (error) {
      console.error('Failed to store vector:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      
      // Log more details about the error
      if (error && typeof error === 'object' && 'status' in error) {
        console.error('HTTP Status:', error.status);
      }
      if (error && typeof error === 'object' && 'data' in error) {
        console.error('Error data:', error.data);
      }
      
      throw new Error(
        `Failed to store vector: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Store multiple vector records in the database
   * @param records - Array of vector records to store
   * @returns Promise<string[]> - Array of IDs of the stored records
   */
  public async storeVectors(records: VectorRecord[]): Promise<string[]> {
    try {
      console.log(`Storing ${records.length} vectors`);

      const points = records.map((record) => {
        const id = record.id || uuidv4();
        
        if (record.embedding.length !== this.vectorSize) {
          throw new Error(
            `Embedding dimension mismatch for record ${id}. Expected ${this.vectorSize}, got ${record.embedding.length}`
          );
        }

        return {
          id: id,
          vector: record.embedding,
          payload: {
            text: record.text,
            metadata: record.metadata || {},
            created_at: new Date().toISOString(),
          },
        };
      });

      await this.client.upsert(this.collectionName, {
        wait: true,
        points: points,
      });

      const ids = points.map((point) => point.id.toString());
      console.log(`${records.length} vectors stored successfully`);
      return ids;
    } catch (error) {
      console.error('Failed to store vectors:', error);
      throw new Error(
        `Failed to store vectors: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Search for similar vectors
   * @param queryVector - Query vector to search for
   * @param limit - Maximum number of results to return
   * @param threshold - Minimum similarity score threshold
   * @returns Promise<QueryResult[]> - Array of similar vectors
   */
  public async searchSimilar(
    queryVector: number[],
    limit: number = 10,
    threshold: number = 0.0
  ): Promise<QueryResult[]> {
    try {
      console.log(`Searching for similar vectors (limit: ${limit}, threshold: ${threshold})`);

      if (queryVector.length !== this.vectorSize) {
        throw new Error(
          `Query vector dimension mismatch. Expected ${this.vectorSize}, got ${queryVector.length}`
        );
      }

      const searchResult = await this.client.search(this.collectionName, {
        vector: queryVector,
        limit: limit,
        score_threshold: threshold,
        with_payload: true,
      });

      const results: QueryResult[] = searchResult.map((result) => ({
        id: (result.payload?.original_id as string) || result.id.toString(), // Use original_id if available
        text: result.payload?.text as string,
        score: result.score || 0,
        metadata: (result.payload?.metadata as Record<string, any>) || {},
      }));

      console.log(`Found ${results.length} similar vectors`);
      return results;
    } catch (error) {
      console.error('Failed to search similar vectors:', error);
      throw new Error(
        `Failed to search similar vectors: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get a vector by ID (supports both original IDs and UUIDs)
   * @param id - ID of the vector to retrieve
   * @returns Promise<VectorRecord | null> - Vector record or null if not found
   */
  public async getVector(id: string): Promise<VectorRecord | null> {
    try {
      console.log(`Retrieving vector with ID: ${id}`);

      // First, try to retrieve by UUID (if the ID is already a UUID)
      const qdrantId = this.convertToValidId(id);
      
      let result = await this.client.retrieve(this.collectionName, {
        ids: [qdrantId],
        with_payload: true,
        with_vector: true,
      });

      // If not found and the ID is not a UUID, search by original_id in payload
      if (result.length === 0 && qdrantId !== id) {
        console.log(`UUID lookup failed, searching by original_id: ${id}`);
        const searchResult = await this.client.scroll(this.collectionName, {
          filter: {
            must: [
              {
                key: 'original_id',
                match: { value: id }
              }
            ]
          },
          with_payload: true,
          with_vector: true,
          limit: 1
        });
        
        if (searchResult.points && searchResult.points.length > 0) {
          result = searchResult.points;
        }
      }

      if (result.length === 0) {
        console.log(`Vector with ID ${id} not found`);
        return null;
      }

      const point = result[0];
      if (!point) {
        console.log(`Vector with ID ${id} not found`);
        return null;
      }

      const record: VectorRecord = {
        id: (point.payload?.original_id as string) || point.id.toString(),
        text: point.payload?.text as string,
        embedding: point.vector as number[],
        metadata: (point.payload?.metadata as Record<string, any>) || {},
      };

      console.log(`Vector retrieved successfully: ${id}`);
      return record;
    } catch (error) {
      console.error('Failed to retrieve vector:', error);
      throw new Error(
        `Failed to retrieve vector: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Delete a vector by ID (supports both original IDs and UUIDs)
   * @param id - ID of the vector to delete
   * @returns Promise<boolean> - True if deleted successfully
   */
  public async deleteVector(id: string): Promise<boolean> {
    try {
      console.log(`Deleting vector with ID: ${id}`);

      // First, try to delete by UUID (if the ID is already a UUID)
      const qdrantId = this.convertToValidId(id);
      
      try {
        await this.client.delete(this.collectionName, {
          wait: true,
          points: [qdrantId],
        });
        console.log(`Vector with ID ${id} deleted successfully`);
        return true;
      } catch (deleteError) {
        // If deletion failed and the ID is not a UUID, search by original_id and delete
        if (qdrantId !== id) {
          console.log(`UUID deletion failed, searching by original_id: ${id}`);
          const searchResult = await this.client.scroll(this.collectionName, {
            filter: {
              must: [
                {
                  key: 'original_id',
                  match: { value: id }
                }
              ]
            },
            with_payload: false,
            with_vector: false,
            limit: 1
          });
          
          if (searchResult.points && searchResult.points.length > 0) {
            const pointId = searchResult.points[0].id;
            await this.client.delete(this.collectionName, {
              wait: true,
              points: [pointId],
            });
            console.log(`Vector with ID ${id} deleted successfully by original_id lookup`);
            return true;
          }
        }
        
        console.log(`Vector with ID ${id} not found for deletion`);
        return false;
      }
    } catch (error) {
      console.error('Failed to delete vector:', error);
      throw new Error(
        `Failed to delete vector: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get collection statistics
   */
  public async getStats(): Promise<any> {
    try {
      const info = await this.client.getCollection(this.collectionName);
      return {
        collection: this.collectionName,
        vectorsCount: info.points_count || 0,
        status: info.status,
        config: info.config,
      };
    } catch (error) {
      console.error('Failed to get collection stats:', error);
      throw new Error(
        `Failed to get collection stats: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Check if the service is healthy
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch (error) {
      console.error('Vector service health check failed:', error);
      return false;
    }
  }
}