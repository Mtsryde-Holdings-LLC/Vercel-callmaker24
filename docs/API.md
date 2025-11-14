# API Documentation

## Base URL

```
Production: https://callmaker24.com/api
Development: http://localhost:3000/api
```

## Authentication

All API requests (except auth endpoints) require authentication using NextAuth session cookies or API keys.

### Using Session Cookies

Include session cookie obtained after login:

```javascript
fetch('/api/customers', {
  credentials: 'include',
})
```

### Using API Keys

Include API key in request header:

```
Authorization: Bearer your_api_key_here
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Endpoints

### Authentication

#### POST /api/auth/signin
Sign in with credentials

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "ADMIN"
  }
}
```

---

### Customers

#### GET /api/customers
List all customers with pagination

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)
- `search` (optional): Search term for email, name, or phone
- `status` (optional): Filter by status (ACTIVE, INACTIVE, BLOCKED)

**Example:**
```
GET /api/customers?page=1&limit=20&search=john&status=ACTIVE
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cust_123",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "ACTIVE",
      "emailOptIn": true,
      "smsOptIn": true,
      "tags": [
        { "id": "tag_1", "name": "VIP" }
      ],
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### POST /api/customers
Create a new customer

**Request Body:**
```json
{
  "email": "customer@example.com",
  "phone": "+1234567890",
  "firstName": "Jane",
  "lastName": "Smith",
  "company": "Acme Corp",
  "tags": ["tag_id_1", "tag_id_2"],
  "customFields": {
    "industry": "Technology",
    "revenue": "100k-500k"
  },
  "emailOptIn": true,
  "smsOptIn": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cust_456",
    "email": "customer@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "status": "ACTIVE"
  }
}
```

#### GET /api/customers/:id
Get customer details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cust_123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "company": "Tech Inc",
    "status": "ACTIVE",
    "tags": [...],
    "activities": [...],
    "totalSpent": 5000,
    "orderCount": 10,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

#### PATCH /api/customers/:id
Update customer

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe Updated",
  "status": "INACTIVE"
}
```

#### DELETE /api/customers/:id
Delete customer

**Response:**
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

#### POST /api/customers/import
Bulk import customers from CSV

**Request Body:** (multipart/form-data)
- `file`: CSV file with headers: email, firstName, lastName, phone, company

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 45,
    "failed": 5,
    "errors": [...]
  }
}
```

---

### Email Campaigns

#### GET /api/email-campaigns
List all email campaigns

**Query Parameters:**
- `page`: Page number
- `limit`: Results per page
- `status`: Filter by status (DRAFT, SCHEDULED, SENDING, SENT)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "camp_123",
      "name": "Summer Sale",
      "subject": "50% Off Summer Collection",
      "status": "SENT",
      "totalRecipients": 1000,
      "deliveredCount": 980,
      "openedCount": 450,
      "clickedCount": 120,
      "createdAt": "2025-01-01T00:00:00Z",
      "sentAt": "2025-01-02T00:00:00Z"
    }
  ]
}
```

#### POST /api/email-campaigns
Create email campaign

**Request Body:**
```json
{
  "name": "New Product Launch",
  "subject": "Introducing Our Latest Product",
  "previewText": "Be the first to try it",
  "fromName": "Your Company",
  "fromEmail": "noreply@yourcompany.com",
  "replyTo": "support@yourcompany.com",
  "htmlContent": "<html>...</html>",
  "textContent": "Plain text version...",
  "segmentIds": ["segment_1"],
  "tagIds": ["tag_1", "tag_2"],
  "scheduledAt": "2025-01-15T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "camp_456",
    "name": "New Product Launch",
    "status": "SCHEDULED"
  }
}
```

#### POST /api/email-campaigns/:id/send
Send email campaign

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": 950,
    "total": 1000
  }
}
```

#### GET /api/email-campaigns/:id/analytics
Get campaign analytics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRecipients": 1000,
    "delivered": 980,
    "opened": 450,
    "clicked": 120,
    "bounced": 20,
    "unsubscribed": 5,
    "openRate": 45.9,
    "clickRate": 12.2,
    "clickToOpenRate": 26.7
  }
}
```

---

### SMS Campaigns

#### POST /api/sms-campaigns
Create SMS campaign

**Request Body:**
```json
{
  "name": "Flash Sale Alert",
  "message": "🔥 Flash Sale! 30% off everything. Use code FLASH30. Valid 24hrs. Reply STOP to opt out.",
  "segmentIds": ["segment_1"],
  "scheduledAt": "2025-01-15T14:00:00Z"
}
```

#### POST /api/sms-campaigns/:id/send
Send SMS campaign

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": 480,
    "total": 500,
    "failed": 20
  }
}
```

---

### AI Content Generation

#### POST /api/ai/generate
Generate marketing content using AI

**Request Body:**
```json
{
  "prompt": "Create an email about our new eco-friendly product line",
  "type": "email",
  "context": "Target audience: environmentally conscious millennials",
  "tone": "friendly",
  "length": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "Subject: 🌱 Meet Our Sustainable Future...\n\nHi there!\n\nWe're thrilled to introduce...",
    "tokensUsed": 450,
    "model": "gpt-4-turbo-preview",
    "cost": 0.0135
  }
}
```

#### POST /api/ai/subject-lines
Generate email subject lines

**Request Body:**
```json
{
  "topic": "New product launch for eco-friendly water bottles",
  "count": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    "🌊 Sip Sustainably with Our New Eco-Bottle",
    "Your Perfect Companion for a Greener Tomorrow",
    "Say Goodbye to Plastic: Meet Your New Water Bottle",
    "Hydrate Better, Impact Less - New Launch Inside",
    "The Water Bottle Your Planet Will Thank You For"
  ]
}
```

#### POST /api/ai/chat
Get AI chatbot response

**Request Body:**
```json
{
  "conversationId": "conv_123",
  "message": "What are your shipping options?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "We offer free standard shipping on orders over $50...",
    "tokensUsed": 120
  }
}
```

---

### Voice/IVR

#### POST /api/voice/call
Initiate outbound call

**Request Body:**
```json
{
  "to": "+1234567890",
  "menuId": "menu_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "callSid": "CA1234567890abcdef",
    "callId": "call_456",
    "status": "initiated"
  }
}
```

#### GET /api/voice/calls
List calls

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "call_123",
      "direction": "OUTBOUND",
      "status": "COMPLETED",
      "from": "+1234567890",
      "to": "+0987654321",
      "duration": 125,
      "recordingUrl": "https://...",
      "startedAt": "2025-01-01T10:00:00Z",
      "endedAt": "2025-01-01T10:02:05Z"
    }
  ]
}
```

---

### Analytics

#### GET /api/analytics/dashboard
Get dashboard overview statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "emailCampaigns": {
      "sent": 50,
      "delivered": 48,
      "opened": 25,
      "clicked": 12,
      "openRate": 52.1,
      "clickRate": 25.0
    },
    "smsCampaigns": {
      "sent": 30,
      "delivered": 29,
      "replied": 8,
      "deliveryRate": 96.7,
      "replyRate": 27.6
    },
    "customers": {
      "total": 5000,
      "active": 4500,
      "new": 150,
      "growthRate": 3.2
    },
    "revenue": {
      "total": 125000,
      "recurring": 85000,
      "average": 250,
      "growth": 15.5
    }
  }
}
```

#### POST /api/analytics/export
Export analytics report

**Request Body:**
```json
{
  "type": "campaign_performance",
  "format": "csv",
  "dateFrom": "2025-01-01",
  "dateTo": "2025-01-31",
  "campaignIds": ["camp_1", "camp_2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileUrl": "https://storage.../report_123.csv",
    "expiresAt": "2025-01-02T00:00:00Z"
  }
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Free tier**: 100 requests per 15 minutes
- **Basic tier**: 500 requests per 15 minutes
- **Pro tier**: 2000 requests per 15 minutes
- **Enterprise tier**: Unlimited

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Webhooks

### Register a Webhook

```
POST /api/webhooks
```

**Request Body:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["email.sent", "email.opened", "sms.delivered"],
  "secret": "your_webhook_secret"
}
```

### Webhook Events

- `email.sent` - Email was sent
- `email.delivered` - Email was delivered
- `email.opened` - Email was opened
- `email.clicked` - Link in email was clicked
- `sms.sent` - SMS was sent
- `sms.delivered` - SMS was delivered
- `sms.received` - SMS reply received
- `subscription.created` - New subscription
- `subscription.updated` - Subscription changed
- `payment.succeeded` - Payment successful

### Webhook Payload

```json
{
  "event": "email.opened",
  "timestamp": "2025-01-01T10:00:00Z",
  "data": {
    "messageId": "msg_123",
    "campaignId": "camp_456",
    "customerId": "cust_789",
    "email": "customer@example.com"
  }
}
```

## Code Examples

### JavaScript/Node.js

```javascript
const response = await fetch('https://your-app.vercel.app/api/customers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_api_key'
  },
  body: JSON.stringify({
    email: 'customer@example.com',
    firstName: 'John',
    lastName: 'Doe'
  })
});

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

response = requests.post(
    'https://your-app.vercel.app/api/customers',
    headers={
        'Authorization': 'Bearer your_api_key'
    },
    json={
        'email': 'customer@example.com',
        'firstName': 'John',
        'lastName': 'Doe'
    }
)

data = response.json()
print(data)
```

### cURL

```bash
curl -X POST https://your-app.vercel.app/api/customers \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```
