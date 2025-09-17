import { Elysia, t } from 'elysia';
import { EmbeddingService } from '../services/embedding.service';
import { VectorService } from '../services/vector.service';
import type { EmbeddingRequest, EmbeddingResponse } from '../types';

export const embeddingRoutes = new Elysia({ prefix: '/embed' })
  .post(
    '/',
    async ({ body, set }): Promise<EmbeddingResponse> => {
      try {
        const { text, id, metadata } = body as EmbeddingRequest;

        if (!text || text.trim().length === 0) {
          set.status = 400;
          return {
            id: id || '',
            text: '',
            embedding: [],
            metadata: {},
            success: false,
          };
        }

        // Generate embedding
        const embeddingService = EmbeddingService.getInstance();
        const embedding = await embeddingService.generateEmbedding(text);

        // Store in vector database
        const vectorService = VectorService.getInstance();
        const recordId = await vectorService.storeVector({
          id: id || undefined,
          text: text,
          embedding: embedding,
          metadata: metadata,
        });

        const response: EmbeddingResponse = {
          id: recordId,
          text: text,
          embedding: embedding,
          metadata: metadata,
          success: true,
        };

        set.status = 201;
        return response;
      } catch (error) {
        console.error('Error in embedding endpoint:', error);
        set.status = 500;
        return {
          id: '',
          text: '',
          embedding: [],
          metadata: {},
          success: false,
        };
      }
    },
    {
      body: t.Object({
        text: t.String({ minLength: 1 }),
        id: t.Optional(t.String()),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
      response: {
        201: t.Object({
          id: t.String(),
          text: t.String(),
          embedding: t.Array(t.Number()),
          metadata: t.Optional(t.Record(t.String(), t.Any())),
          success: t.Boolean(),
        }),
        400: t.Object({
          id: t.String(),
          text: t.String(),
          embedding: t.Array(t.Number()),
          metadata: t.Record(t.String(), t.Any()),
          success: t.Boolean(),
        }),
        500: t.Object({
          id: t.String(),
          text: t.String(),
          embedding: t.Array(t.Number()),
          metadata: t.Record(t.String(), t.Any()),
          success: t.Boolean(),
        }),
      },
      tags: ['Embeddings'],
      summary: 'Create text embedding',
      description: 'Generate embeddings for input text and store in vector database',
    }
  )
  .post(
    '/batch',
    async ({ body, set }) => {
      try {
        const requests = body as EmbeddingRequest[];

        if (!Array.isArray(requests) || requests.length === 0) {
          set.status = 400;
          return {
            results: [],
            success: false,
            message: 'Invalid batch request: expected non-empty array',
          };
        }

        const embeddingService = EmbeddingService.getInstance();
        const vectorService = VectorService.getInstance();
        const results: EmbeddingResponse[] = [];

        for (const request of requests) {
          try {
            if (!request.text || request.text.trim().length === 0) {
              results.push({
                id: request.id || '',
                text: '',
                embedding: [],
                metadata: {},
                success: false,
              });
              continue;
            }

            // Generate embedding
            const embedding = await embeddingService.generateEmbedding(request.text);

            // Store in vector database
            const recordId = await vectorService.storeVector({
              id: request.id || undefined,
              text: request.text,
              embedding: embedding,
              metadata: request.metadata,
            });

            results.push({
              id: recordId,
              text: request.text,
              embedding: embedding,
              metadata: request.metadata,
              success: true,
            });
          } catch (error) {
            console.error(`Error processing batch item for text: ${request.text?.substring(0, 50)}...`, error);
            results.push({
              id: request.id || '',
              text: request.text || '',
              embedding: [],
              metadata: request.metadata || {},
              success: false,
            });
          }
        }

        set.status = 201;
        return {
          results: results,
          success: true,
          processed: results.length,
        };
      } catch (error) {
        console.error('Error in batch embedding endpoint:', error);
        set.status = 500;
        return {
          results: [],
          success: false,
          message: 'Internal server error',
        };
      }
    },
    {
      body: t.Array(
        t.Object({
          text: t.String({ minLength: 1 }),
          id: t.Optional(t.String()),
          metadata: t.Optional(t.Record(t.String(), t.Any())),
        })
      ),
      tags: ['Embeddings'],
      summary: 'Create batch embeddings',
      description: 'Generate embeddings for multiple texts in a single request and store them in vector database',
    }
  )
  .get(
    '/:id',
    async ({ params, set }) => {
      try {
        const { id } = params;
        const vectorService = VectorService.getInstance();
        const record = await vectorService.getVector(id);

        if (!record) {
          set.status = 404;
          return {
            success: false,
            message: 'Vector not found',
          };
        }

        set.status = 200;
        return {
          id: record.id,
          text: record.text,
          embedding: record.embedding,
          metadata: record.metadata,
          success: true,
        };
      } catch (error) {
        console.error('Error retrieving vector:', error);
        set.status = 500;
        return {
          success: false,
          message: 'Internal server error',
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      tags: ['Embeddings'],
      summary: 'Get embedding by ID',
      description: 'Retrieve a stored embedding and its metadata by ID',
    }
  )
  .delete(
    '/:id',
    async ({ params, set }) => {
      try {
        const { id } = params;
        const vectorService = VectorService.getInstance();
        const success = await vectorService.deleteVector(id);

        if (success) {
          set.status = 200;
          return {
            success: true,
            message: `Vector ${id} deleted successfully`,
          };
        } else {
          set.status = 404;
          return {
            success: false,
            message: 'Vector not found',
          };
        }
      } catch (error) {
        console.error('Error deleting vector:', error);
        set.status = 500;
        return {
          success: false,
          message: 'Internal server error',
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      tags: ['Embeddings'],
      summary: 'Delete embedding by ID',
      description: 'Delete a stored embedding from the vector database',
    }
  );