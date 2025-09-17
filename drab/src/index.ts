import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { EmbeddingService } from './services/embedding.service';
import { VectorService } from './services/vector.service';
import { embeddingRoutes } from './routes/embedding.routes';
import { queryRoutes } from './routes/query.routes';
import { chatRoutes } from './routes/chat.routes';

const port = process.env.PORT || 3500;

// Initialize services
async function initializeServices() {
  console.log('🚀 Initializing DRAB services...');
  
  try {
    // Initialize embedding service
    console.log('📚 Loading embedding model...');
    const embeddingService = EmbeddingService.getInstance();
    await embeddingService.initialize();
    console.log('✅ Embedding model loaded successfully');

    // Initialize vector database service
    console.log('🗄️ Connecting to vector database...');
    const vectorService = VectorService.getInstance();
    await vectorService.initialize();
    console.log('✅ Vector database connected successfully');

    console.log('🎉 All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Create Elysia app
const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'DRAB API',
        description: 'Document Retrieval and Analysis Backend - Text Embedding and Vector Search API',
        version: '1.0.0',
        contact: {
          name: 'DRAB API Support',
          email: 'support@drab.dev'
        }
      },
      servers: [
        {
          url: `http://localhost:${port}`,
          description: 'Development server'
        }
      ],
      tags: [
        {
          name: 'Embeddings',
          description: 'Text embedding operations'
        },
        {
          name: 'Query',
          description: 'Vector search and similarity operations'
        },
        {
          name: 'Chat',
          description: 'Conversational AI with RAG (Retrieval-Augmented Generation)'
        },
        {
          name: 'Health',
          description: 'System health and monitoring'
        }
      ]
    },
    path: '/docs'
  }))
  .get('/', () => ({
    message: 'Welcome to DRAB - Document Retrieval and Analysis Backend',
    version: '1.0.0',
    swagger: `http://localhost:${port}/docs`,
    endpoints: {
      embeddings: {
        'POST /embed': 'Create embeddings for text and store in vector database',
        'POST /embed/batch': 'Create embeddings for multiple texts',
        'GET /embed/:id': 'Retrieve a stored embedding by ID',
        'DELETE /embed/:id': 'Delete an embedding by ID',
      },
      queries: {
        'POST /query': 'Search for similar texts using query text',
        'POST /query/similar/:id': 'Find similar texts to a stored embedding',
        'GET /query/stats': 'Get database statistics',
        'GET /query/health': 'Check service health status',
      },
      chat: {
        'POST /chat': 'Send a chat message and receive a streaming response with RAG context',
        'GET /chat/conversations': 'Get list of recent conversations',
        'DELETE /chat/conversations/:id': 'Delete a conversation and its history',
      },
    },
    documentation: 'Send requests to the above endpoints to interact with the DRAB system',
  }))
  .use(embeddingRoutes)
  .use(queryRoutes)
  .use(chatRoutes)
  .onError(({ code, error, set }) => {
    console.error(`Error ${code}:`, error);
    
    switch (code) {
      case 'VALIDATION':
        set.status = 400;
        return {
          error: 'Validation Error',
          message: 'Invalid request format or parameters',
          details: error.message,
        };
      case 'NOT_FOUND':
        set.status = 404;
        return {
          error: 'Not Found',
          message: 'The requested resource was not found',
        };
      case 'INTERNAL_SERVER_ERROR':
        set.status = 500;
        return {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        };
      default:
        set.status = 500;
        return {
          error: 'Unknown Error',
          message: 'An unknown error occurred',
        };
    }
  })
  .onStart(async () => {
    await initializeServices();
  })
  .listen({ port: port, hostname: '0.0.0.0' }, async ({ hostname, port }) => {

  console.log(`🚀 DRAB server is running on http://${hostname}:${port}`);
  console.log(`📖 API documentation available at http://${hostname}:${port}/`);
})

export default app;