# DRAB - Document Retrieval and Analysis Backend

DRAB is a high-performance text embedding and vector search API built with Bun.js, Elysia.js, and TypeScript. It uses the all-MiniLM-L6-v2 model for generating embeddings and Qdrant as the vector database for similarity search.

## Features

- **Text Embedding Generation**: Convert text into 384-dimensional embeddings using the all-MiniLM-L6-v2 model
- **Vector Storage**: Store embeddings with metadata in Qdrant vector database
- **Similarity Search**: Find similar texts based on semantic similarity
- **Batch Processing**: Process multiple texts in a single request
- **RESTful API**: Clean and intuitive API endpoints
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **High Performance**: Built on Bun.js runtime for optimal performance

## Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [Docker](https://www.docker.com/) and Docker Compose
- Node.js 18+ (for compatibility with some tools)

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Start Qdrant Vector Database

```bash
# Start Qdrant in Docker
bun run docker:up

# Or manually with docker-compose
docker compose up -d
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file if needed (default values should work for local development)
```

### 4. Start the Server

```bash
# Development mode with hot reload
bun run dev

# Or production mode
bun run start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Root
- `GET /` - API documentation and available endpoints

### Embedding Endpoints
- `POST /embed` - Create embedding for single text
- `POST /embed/batch` - Create embeddings for multiple texts
- `GET /embed/:id` - Retrieve stored embedding by ID
- `DELETE /embed/:id` - Delete embedding by ID

### Query Endpoints
- `POST /query` - Search for similar texts using query text
- `POST /query/similar/:id` - Find texts similar to a stored embedding
- `GET /query/stats` - Get database statistics
- `GET /query/health` - Health check for all services

## API Usage Examples

### 1. Create an Embedding

```bash
curl -X POST http://localhost:3000/embed \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Photosynthesis is the process by which plants convert sunlight into energy",
    "id": "doc_001",
    "metadata": {
      "source": "biology_textbook",
      "chapter": 1
    }
  }'
```

### 2. Search for Similar Texts

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do plants make energy from sunlight?",
    "limit": 5,
    "threshold": 0.7
  }'
```

### 3. Health Check

```bash
curl http://localhost:3000/query/health
```

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run start` | Start production server |
| `bun run docker:up` | Start Qdrant database |
| `bun run docker:down` | Stop Qdrant database |
| `bun run setup` | Install dependencies and start database |

## Model Information

The project uses the **all-MiniLM-L6-v2** model:
- **Size**: ~23MB
- **Dimensions**: 384
- **Performance**: Balanced speed and quality for semantic search

The model is automatically loaded from the local `./all-MiniLM-L6-v2` directory if available, otherwise it downloads from HuggingFace.all dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.20. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
