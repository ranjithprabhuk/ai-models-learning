import { Elysia, t } from 'elysia';
import { EmbeddingService } from '../services/embedding.service';
import { VectorService } from '../services/vector.service';
import type { QueryRequest, QueryResponse } from '../types';

export const queryRoutes = new Elysia({ prefix: '/query' })
  .post(
    '/',
    async ({ body, set }): Promise<QueryResponse> => {
      try {
        const { query, limit = 10, threshold = 0.0 } = body as QueryRequest;

        if (!query || query.trim().length === 0) {
          set.status = 400;
          return {
            results: [],
            query: '',
            success: false,
          };
        }

        // Generate embedding for the query
        const embeddingService = EmbeddingService.getInstance();
        const queryEmbedding = await embeddingService.generateEmbedding(query);

        // Search for similar vectors
        const vectorService = VectorService.getInstance();
        const results = await vectorService.searchSimilar(
          queryEmbedding,
          Math.min(limit, 100), // Cap at 100 results
          Math.max(threshold, 0.0) // Ensure non-negative threshold
        );

        const response: QueryResponse = {
          results: results,
          query: query,
          success: true,
        };

        set.status = 200;
        return response;
      } catch (error) {
        console.error('Error in query endpoint:', error);
        set.status = 500;
        return {
          results: [],
          query: '',
          success: false,
        };
      }
    },
    {
      body: t.Object({
        query: t.String({ minLength: 1 }),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        threshold: t.Optional(t.Number({ minimum: 0.0, maximum: 1.0 })),
      }),
      response: {
        200: t.Object({
          results: t.Array(
            t.Object({
              id: t.String(),
              text: t.String(),
              score: t.Number(),
              metadata: t.Optional(t.Record(t.String(), t.Any())),
            })
          ),
          query: t.String(),
          success: t.Boolean(),
        }),
        400: t.Object({
          results: t.Array(t.Any()),
          query: t.String(),
          success: t.Boolean(),
        }),
        500: t.Object({
          results: t.Array(t.Any()),
          query: t.String(),
          success: t.Boolean(),
        }),
      },
      tags: ['Query'],
      summary: 'Search for similar texts',
      description: 'Generate embedding for query text and search for similar vectors in the database',
    }
  )
  .post(
    '/similar/:id',
    async ({ params, body, set }) => {
      try {
        const { id } = params;
        const { limit = 10, threshold = 0.0 } = (body as { limit?: number; threshold?: number }) || {};

        // Get the vector by ID
        const vectorService = VectorService.getInstance();
        const record = await vectorService.getVector(id);

        if (!record) {
          set.status = 404;
          return {
            results: [],
            query: `Vector with ID: ${id}`,
            success: false,
          };
        }

        // Search for similar vectors using the found vector's embedding
        const results = await vectorService.searchSimilar(
          record.embedding,
          Math.min(limit, 100),
          Math.max(threshold, 0.0)
        );

        // Filter out the original vector from results
        const filteredResults = results.filter(result => result.id !== id);

        const response: QueryResponse = {
          results: filteredResults,
          query: `Similar to: ${record.text.substring(0, 100)}...`,
          success: true,
        };

        set.status = 200;
        return response;
      } catch (error) {
        console.error('Error in similar vectors endpoint:', error);
        set.status = 500;
        return {
          results: [],
          query: '',
          success: false,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Optional(
        t.Object({
          limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
          threshold: t.Optional(t.Number({ minimum: 0.0, maximum: 1.0 })),
        })
      ),
    }
  )
  .get(
    '/stats',
    async ({ set }) => {
      try {
        const vectorService = VectorService.getInstance();
        const stats = await vectorService.getStats();

        set.status = 200;
        return {
          ...stats,
          success: true,
        };
      } catch (error) {
        console.error('Error getting stats:', error);
        set.status = 500;
        return {
          success: false,
          message: 'Failed to get database statistics',
        };
      }
    }
  )
  .get(
    '/health',
    async ({ set }) => {
      try {
        const vectorService = VectorService.getInstance();
        const embeddingService = EmbeddingService.getInstance();

        const vectorHealthy = await vectorService.healthCheck();
        const embeddingHealthy = embeddingService.isInitialized();

        const isHealthy = vectorHealthy && embeddingHealthy;

        set.status = isHealthy ? 200 : 503;
        return {
          healthy: isHealthy,
          services: {
            vectorDatabase: vectorHealthy,
            embeddingModel: embeddingHealthy,
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Error in health check:', error);
        set.status = 503;
        return {
          healthy: false,
          error: 'Health check failed',
          timestamp: new Date().toISOString(),
        };
      }
    }
  );