# Quick Start: Real-Time Tracking & Automation

## 🚀 5-Minute Setup

### 1. Install Dependencies
```bash
npm install ioredis@^5.3.2
```

### 2. Start Redis
```bash
docker run -d -p 6379:6379 redis:latest
# OR
redis-server
```

### 3. Set Environment Variables
```bash
# .env
REDIS_URL=redis://localhost:6379
PORT=5000
BREVO_API_KEY=your_key_here  # Optional: for email/SMS
```

### 4. Start the Server
```bash
npm run dev
```

That's it! Real-time features are now active.

---

## 📡 WebSocket Connection

### Connect from Client
```javascript
// Connect to analytics channel
const ws = new WebSocket('ws://localhost:5000/ws/analytics');

ws.onopen = () => {
  // Subscribe to project events
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['project:your-project-id']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time event:', data);
};
```

### Available Paths
- `/ws/collaboration` - Document editing
- `/ws/analytics` - Live metrics
- `/ws/notifications` - User alerts
- `/ws/presence` - Team status

---

## ✍️ Track Writing Session

### Start Session
```bash
curl -X POST http://localhost:5000/api/realtime/writing/sessions/start \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "projectId": "proj_123",
    "documentId": "doc_456",
    "sessionType": "writing"
  }'
```

Response:
```json
{
  "id": "session_1699564820_abc",
  "userId": "user_123",
  "projectId": "proj_123",
  "documentId": "doc_456",
  "state": "idle",
  "wordsWritten": 0,
  "currentWordCount": 0
}
```

### Track Keystrokes
```bash
curl -X POST http://localhost:5000/api/realtime/writing/sessions/session_id/keystroke \
  -H "Content-Type: application/json" \
  -d '{
    "wordCountDelta": 1,
    "cursorPosition": { "line": 10, "column": 25 }
  }'
```

### Get Live Metrics
```bash
curl http://localhost:5000/api/realtime/writing/sessions/session_id/metrics
```

Response:
```json
{
  "sessionId": "session_1699564820_abc",
  "currentWPM": 45,
  "averageWPM": 42,
  "totalWords": 250,
  "sessionDuration": 6,
  "state": "active_writing",
  "flowStateDuration": 0
}
```

---

## 👥 Track Collaboration

### Update Presence
```bash
curl -X POST http://localhost:5000/api/realtime/collaboration/presence \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_456",
    "projectId": "proj_123",
    "presenceData": {
      "status": "online",
      "mode": "edit",
      "cursorPosition": { "line": 15, "column": 10 }
    }
  }'
```

### Get Active Collaborators
```bash
curl http://localhost:5000/api/realtime/collaboration/document/doc_456/collaborators
```

Response:
```json
[
  {
    "userId": "user_123",
    "userName": "John Doe",
    "color": "#FF6B6B",
    "status": "online",
    "cursorPosition": { "line": 15, "column": 10 },
    "mode": "edit",
    "isTyping": true
  }
]
```

### Check for Conflicts
```bash
curl http://localhost:5000/api/realtime/collaboration/document/doc_456/conflicts
```

---

## 🔔 Send Notifications

### Send to User
```bash
curl -X POST http://localhost:5000/api/realtime/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "category": "publishing_milestone",
    "priority": "high",
    "title": "Book Published!",
    "message": "Your book is now live on Amazon KDP",
    "channels": ["in_app", "email"],
    "actionUrl": "/projects/proj_123/publishing"
  }'
```

### Get User Notifications
```bash
curl http://localhost:5000/api/realtime/notifications?limit=10&unreadOnly=true
```

---

## ⚙️ Create Workflow

### Register Workflow
```javascript
import { WorkflowEngine } from './server/automation';

const engine = WorkflowEngine.getInstance();

await engine.registerWorkflow({
  name: 'Auto-Save Every 5 Minutes',
  description: 'Save document every 5 minutes',
  trigger: {
    type: 'schedule',
    schedule: '*/5 * * * *' // Every 5 minutes
  },
  actions: [
    {
      id: 'save_doc',
      type: 'database_operation',
      name: 'Save Document',
      config: {
        operation: 'update',
        table: 'documents',
        data: { updatedAt: 'NOW()' }
      }
    }
  ],
  status: 'pending',
  enabled: true
});
```

### Use Pre-Built Template
```javascript
import { workflowTemplates } from './server/automation/workflowTemplates';

const workflow = await engine.registerWorkflow({
  ...workflowTemplates.autoSave,
  createdBy: 'user_123'
});
```

### Execute Workflow
```javascript
const execution = await engine.executeWorkflow(
  workflow.id,
  'user_123',
  { documentId: 'doc_456' }
);

console.log('Execution status:', execution.status);
console.log('Logs:', execution.logs);
```

---

## 📊 Monitor System

### WebSocket Statistics
```bash
curl http://localhost:5000/api/realtime/websocket/stats
```

```json
{
  "totalConnections": 142,
  "connectionsByPath": {
    "/ws/collaboration": 98,
    "/ws/analytics": 32,
    "/ws/notifications": 12
  },
  "totalChannels": 45
}
```

### Event Stream Info
```bash
curl http://localhost:5000/api/realtime/events/writing/info
```

---

## 🧪 Test Real-Time Features

### Test Flow State Detection
1. Start a writing session
2. Send 200+ keystrokes per minute
3. Watch for `flow_state_entered` event
4. Notification appears: "🔥 Flow State Activated!"

### Test Conflict Prevention
1. Open document in two browsers
2. Move cursors to nearby lines
3. Watch for conflict warning
4. See suggestion to coordinate

### Test Sales Spike Alert
1. Update sales data with 2x baseline
2. Workflow automatically executes
3. Notification sent: "📈 Sales Spike Detected!"
4. Email and SMS delivered

---

## 🔍 Debug Mode

### Enable Verbose Logging
```bash
DEBUG=realtime:* npm run dev
```

### Monitor Redis
```bash
redis-cli MONITOR
```

### Check Event Streams
```bash
redis-cli XINFO STREAM event_stream:writing
```

---

## 📚 Learn More

- [Event Schema](server/events/eventSchema.ts) - All event types
- [Workflow Templates](server/automation/workflowTemplates.ts) - Pre-built workflows
- [API Documentation](server/realtime-api.ts) - All endpoints
- [Implementation Report](FINAL_IMPLEMENTATION_REPORT.md) - Full details

---

## 🆘 Troubleshooting

### WebSocket won't connect
- Check Redis is running: `redis-cli ping`
- Verify PORT in .env matches server
- Check authentication cookies

### Events not publishing
- Verify Redis URL is correct
- Check event schema validation
- Look for errors in server logs

### Workflows not triggering
- Ensure workflow is enabled
- Check trigger conditions
- Verify event types match

---

## ✨ Pro Tips

1. **Batch keystrokes** - Client sends every 10 keystrokes, not every one
2. **Subscribe selectively** - Only to channels you need
3. **Use digest mode** - For low-priority notifications
4. **Monitor metrics** - Check `/api/realtime/websocket/stats` regularly
5. **Test workflows** - In development before enabling in production

---

**Need Help?** Check [FINAL_IMPLEMENTATION_REPORT.md](FINAL_IMPLEMENTATION_REPORT.md) for complete documentation.
