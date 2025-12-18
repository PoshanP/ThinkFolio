# ThinkFolio API Documentation

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication
All API endpoints (except auth endpoints and health checks) require authentication via Supabase JWT tokens.

### Headers
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

## Rate Limiting
- Auth endpoints: 5 requests per 15 minutes
- Upload endpoints: 10 requests per hour
- General API: 100 requests per minute

## Error Responses
```json
{
  "error": "Error message",
  "code": 400
}
```

## Endpoints

### Authentication

#### Sign Up
`POST /auth/signup`

Request:
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd!",
  "fullName": "John Doe" // optional
}
```

Response (201):
```json
{
  "data": {
    "user": { ... },
    "session": { ... }
  }
}
```

#### Sign In
`POST /auth/signin`

Request:
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd!"
}
```

Response (200):
```json
{
  "data": {
    "user": { ... },
    "session": { ... }
  }
}
```

#### Sign Out
`POST /auth/signout`

Response (200):
```json
{
  "data": {
    "message": "Signed out successfully"
  }
}
```

#### Get Session
`GET /auth/session`

Response (200):
```json
{
  "data": {
    "session": { ... }
  }
}
```

### Papers

#### List Papers
`GET /papers?page=1&limit=20`

Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

Response (200):
```json
{
  "data": {
    "papers": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "title": "Paper Title",
        "source": "upload|url",
        "storage_path": "path/to/file.pdf",
        "page_count": 10,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### Get Paper
`GET /papers/:id`

Response (200):
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Paper Title",
    "source": "upload",
    "storage_path": "path/to/file.pdf",
    "page_count": 10,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Upload Paper
`POST /papers/upload`

Request (multipart/form-data):
- `title`: Paper title (required)
- `source`: "upload" or "url" (required)
- `file`: PDF file (required if source="upload")
- `url`: Paper URL (required if source="url")

Response (201):
```json
{
  "data": {
    "id": "uuid",
    "title": "Paper Title",
    "source": "upload",
    "storage_path": "path/to/file.pdf",
    "page_count": 10,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Delete Paper
`DELETE /papers/:id`

Response (200):
```json
{
  "data": {
    "message": "Paper deleted successfully"
  }
}
```

### Chat Sessions

#### List Sessions
`GET /chat/sessions?page=1&limit=10&paperId=uuid`

Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `paperId` (optional): Filter by paper ID

Response (200):
```json
{
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "paper_id": "uuid",
        "title": "Session Title",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "papers": {
          "id": "uuid",
          "title": "Paper Title"
        }
      }
    ],
    "pagination": { ... }
  }
}
```

#### Create Session
`POST /chat/sessions/create`

Request:
```json
{
  "paperId": "uuid",
  "title": "Session Title"
}
```

Response (201):
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "paper_id": "uuid",
    "title": "Session Title",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Session
`GET /chat/sessions/:id`

Response (200):
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "paper_id": "uuid",
    "title": "Session Title",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "papers": {
      "id": "uuid",
      "title": "Paper Title",
      "page_count": 10
    }
  }
}
```

#### Delete Session
`DELETE /chat/sessions/:id`

Response (200):
```json
{
  "data": {
    "message": "Session deleted successfully"
  }
}
```

#### Get Session Messages
`GET /chat/sessions/:id/messages?page=1&limit=50`

Response (200):
```json
{
  "data": {
    "messages": [
      {
        "id": "uuid",
        "session_id": "uuid",
        "role": "user|assistant",
        "content": "Message content",
        "created_at": "2024-01-01T00:00:00Z",
        "message_citations": [
          {
            "id": "uuid",
            "chunk_id": "uuid",
            "score": 0.95,
            "page_no": 5
          }
        ]
      }
    ],
    "pagination": { ... }
  }
}
```

#### Send Message
`POST /chat/message`

Request:
```json
{
  "sessionId": "uuid",
  "content": "User's question about the paper"
}
```

Response (200):
```json
{
  "data": {
    "userMessage": {
      "id": "uuid",
      "session_id": "uuid",
      "role": "user",
      "content": "User's question",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "assistantMessage": {
      "id": "uuid",
      "session_id": "uuid",
      "role": "assistant",
      "content": "AI response",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Monitoring

#### Health Check
`GET /health`

Response (200):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "responseTime": "10ms",
  "services": {
    "database": {
      "status": "operational",
      "connections": { ... }
    },
    "storage": {
      "status": "operational"
    }
  },
  "metrics": { ... }
}
```

#### Health Check (HEAD)
`HEAD /health`

Headers:
```
X-Health-Status: healthy|unhealthy
```

#### Metrics
`GET /metrics`

Response (200):
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "period": "1h",
  "requests": {
    "total": 1000,
    "byEndpoint": { ... }
  },
  "errors": {
    "total": 10,
    "byEndpoint": { ... }
  },
  "latency": {
    "byEndpoint": {
      "/api/papers": {
        "avg": 50,
        "min": 10,
        "max": 200,
        "p50": 45,
        "p95": 150,
        "p99": 190
      }
    }
  },
  "users": {
    "active": 25
  },
  "storage": {
    "uploads": 100,
    "downloads": 500
  }
}
```

## WebSocket Events (Future)

For real-time chat streaming (to be implemented):

```javascript
const ws = new WebSocket('wss://your-domain.com/ws')

ws.send(JSON.stringify({
  type: 'subscribe',
  sessionId: 'uuid'
}))

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // Handle streaming response
}
```

## Security

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### File Upload Restrictions
- PDF files only
- Maximum file size: 50MB
- File name validation (no path traversal)
- PDF content sanitization

### CORS Configuration
Configured in middleware for production domains.

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## Database Schema

See `/supabase/migrations/20240101000000_initial_schema.sql` for complete schema.

## Environment Variables

Required environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=
NODE_ENV=
LOG_LEVEL=
```

## Deployment

1. Set up Supabase project
2. Run database migrations
3. Configure storage buckets
4. Set environment variables in Vercel
5. Deploy to Vercel

## Support

For issues or questions, please contact the development team.