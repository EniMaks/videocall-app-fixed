# VideoCall Application - System Architecture

## Overview

VideoCall is a real-time video calling application built with Django REST Framework backend and Vue.js frontend. The system supports anonymous guest access through JWT tokens and real-time communication via WebSockets.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Vue.js SPA Frontend (Vite + TypeScript)                       │
│  ├── Components (VideoCall, Dashboard, etc.)                   │
│  ├── Services (API, WebRTC, Media)                             │
│  ├── Stores (Pinia: Global, Rooms, Auth)                       │
│  └── Router (Vue Router with Auth Guards)                      │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        WEB LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Nginx Reverse Proxy                                           │
│  ├── SSL Termination                                           │
│  ├── Static File Serving                                       │
│  └── Load Balancing                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Django Application Server (ASGI + Daphne)                     │
│  ├── REST API (DRF)                                            │
│  ├── WebSocket Handler (Django Channels)                       │
│  ├── Authentication (Session + JWT)                            │
│  └── Apps:                                                     │
│      ├── authentication (Login, Guest JWT)                     │
│      ├── rooms (Room Management, WebRTC Signaling)             │
│      └── core (System Settings, Activity Logs)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STORAGE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database          │  Redis Cache/Session Store      │
│  ├── User Accounts            │  ├── Room Data (Temporary)      │
│  ├── System Settings          │  ├── Session Storage            │
│  └── Activity Logs            │  └── WebSocket Channels         │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend Stack
- **Framework**: Django + Django REST Framework
- **ASGI Server**: Daphne (for WebSocket support)
- **WebSocket**: Django Channels with Redis
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **Cache**: Redis (Session storage, Room data, Channel layers)
- **Authentication**: Session-based + JWT for guests
- **API**: RESTful API with OpenAPI documentation
- *Все зависимости см. в `backend/requirements.txt`*

### Frontend Stack
- **Framework**: Vue.js (Composition API)
- **Build Tool**: Vite
- **Language**: TypeScript + JavaScript
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **UI Framework**: Tailwind CSS
- **PWA**: Vite PWA Plugin (Service Worker support)
- **WebRTC**: Native WebRTC APIs
- **Internationalization**: Vue I18n
- *Все зависимости см. в `videocall-frontend/package.json`*

### Infrastructure & DevOps
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (Reverse proxy, Static files)
- **Environment**: Production (HTTPS) + Development (HTTP)
- **Security**: CORS, CSRF protection, Rate limiting

## Application Structure

### Backend Structure (`/backend/`)
```
backend/
├── videocall_app/          # Django project configuration
│   ├── settings.py         # Main settings (Production)
│   ├── urls.py            # Main URL configuration
│   ├── wsgi.py            # WSGI application
│   └── asgi.py            # ASGI application (WebSocket)
├── apps/                   # Django applications
│   ├── authentication/    # User auth & guest JWT
│   │   ├── views.py       # LoginView, GuestTokenValidateView
│   │   ├── urls.py        # Auth API endpoints
│   │   └── middleware.py  # JWT middleware for WebSocket
│   ├── rooms/             # Room management & WebRTC
│   │   ├── models.py      # RoomManager (Redis-based)
│   │   ├── views.py       # Room CRUD, Guest link generation
│   │   ├── consumers.py   # WebSocket consumer (signaling)
│   │   └── routing.py     # WebSocket URL patterns
│   └── core/              # System core functionality
│       ├── models.py      # SystemSettings, RoomActivityLog
│       ├── views.py       # Health check, system status
│       └── admin.py       # Django admin interface
├── requirements.txt       # Python dependencies
└── manage.py              # Django management script
```

### Frontend Structure (`/videocall-frontend/`)
```
src/
├── components/            # Vue components
│   ├── VideoCall.vue     # Main video call interface
│   ├── TheDashboard.vue  # User dashboard
│   ├── LoginForm.vue     # Authentication form
│   ├── JoinRoom.vue      # Guest room entry
│   └── ...               # Other UI components
├── services/             # Business logic services
│   ├── api.js           # HTTP API client
│   ├── webrtc.js        # WebRTC peer connection
│   ├── media.js         # Camera/microphone handling
│   └── utils.js         # Utility functions
├── stores/              # Pinia state management
│   ├── global.js        # Global app state
│   ├── rooms.js         # Room management state
│   └── auth.js          # Authentication state
├── router/              # Vue Router configuration
│   └── index.js         # Routes & navigation guards
├── locales/             # Internationalization
├── App.vue              # Root component
└── main.js              # Application entry point
```

## Data Flow Architecture

### 1. Guest Access Flow
```
Guest Link → JWT Validation → Room Redirect → WebSocket Connection → Video Call
```

1. **Guest Link Generation**: Authenticated user creates guest link with JWT token
2. **Token Validation**: Guest accesses link, JWT is validated on backend
3. **Room Entry**: Valid token redirects guest to specific room
4. **WebSocket Connection**: Establishes real-time signaling channel
5. **WebRTC Session**: Direct peer-to-peer video/audio connection

### 2. Room Management Flow
```
Room Creation → Redis Storage → Short Code Generation → Guest Link → Expiration
```

1. **Room Creation**: User creates room, generates UUID and short code
2. **Temporary Storage**: Room data stored in Redis with TTL
3. **Access Methods**: Room accessible by UUID (direct) or short code
4. **Participant Management**: Join/leave events tracked
5. **Cleanup**: Automatic expiration and cleanup when empty

### 3. Real-time Communication Flow
```
Frontend WebSocket ↔ Django Channels ↔ Redis ↔ Other Participants
```

1. **WebSocket Connection**: Client connects to `/ws/room/{room_id}/`
2. **Authentication**: JWT/Session validation via custom middleware
3. **Channel Groups**: Participants added to room-specific group
4. **Message Broadcasting**: WebRTC signaling messages broadcast to group
5. **Connection Management**: Handle connect/disconnect events

## Security Architecture

### Authentication & Authorization
- **User Authentication**: Django session-based authentication
- **Guest Access**: JWT tokens with embedded room_id and expiration
- **API Security**: CSRF protection, CORS configuration
- **Rate Limiting**: Request throttling for anonymous users

### Data Protection
- **No Personal Data Storage**: Rooms stored temporarily in Redis
- **Activity Logging**: Non-personal analytics for system monitoring
- **Secure Cookies**: HTTPS-only cookies in production
- **Input Validation**: All user inputs validated and sanitized

### Network Security
- **HTTPS Enforcement**: All production traffic over HTTPS
- **WebSocket Security**: Origin validation and authentication
- **CORS Policy**: Strict origin control for API access
- **Content Security Policy**: XSS protection headers

## Performance Architecture

### Caching Strategy
- **Redis Cache**: Room data, sessions, WebSocket channels
- **Browser Cache**: Static assets, API responses where appropriate
- **CDN Ready**: Static files served efficiently

### Scalability Considerations
- **Stateless Backend**: Horizontal scaling capability
- **Redis Clustering**: For high-volume deployments
- **Room Expiration**: Automatic cleanup prevents memory leaks
- **WebRTC P2P**: Direct peer connections reduce server load

### Monitoring & Observability
- **Activity Logs**: Room creation, join/leave events
- **Health Checks**: System status endpoints
- **Error Handling**: Comprehensive error responses
- **Performance Metrics**: Ready for APM integration

## Deployment Architecture

### Production Environment
```
Internet → Nginx (SSL) → Django (Daphne) → PostgreSQL + Redis
```

### Development Environment
```
Local → Vite Dev Server (Frontend) + Django Dev Server (Backend) → SQLite
```

### Container Architecture
- **Frontend Container**: Nginx serving built Vue.js application
- **Backend Container**: Django application with Daphne ASGI server
- **Database Container**: PostgreSQL with persistent volumes
- **Cache Container**: Redis for sessions and temporary data

## API Architecture

### REST Endpoints
```
/api/auth/
├── POST /login/           # User authentication
├── GET  /check/           # Authentication status
├── POST /logout/          # User logout
├── POST /guest/generate/  # Generate guest JWT
└── POST /guest/validate/  # Validate guest JWT

/api/rooms/
├── POST /                 # Create new room
├── GET  /{room_id}/       # Get room details
├── POST /join/{code}/     # Join room by short code
└── POST /{room_id}/generate-guest-link # Generate guest access link

/api/
├── GET  /health/          # System health check
└── GET  /metrics/         # System metrics (admin only)
```

### WebSocket Endpoints
```
/ws/room/{room_id}/        # Room-specific WebSocket for WebRTC signaling
```

## State Management Architecture

### Frontend State (Pinia)
- **Global Store**: User authentication, app settings, notifications
- **Rooms Store**: Active room data, participant list, connection status
- **Local Component State**: UI state, form data, temporary values

### Backend State
- **Session Store**: User authentication state (Redis/Database)
- **Room State**: Temporary room data with TTL (Redis)
- **Persistent State**: System settings, activity logs (PostgreSQL)

## Error Handling & Recovery

### Frontend Error Handling
- **API Errors**: Centralized error handling with user notifications
- **WebRTC Errors**: Connection recovery and fallback mechanisms
- **Network Errors**: Offline detection and retry logic

### Backend Error Handling
- **Validation Errors**: Comprehensive input validation with clear messages
- **System Errors**: Logging and graceful degradation
- **Rate Limiting**: Throttling with appropriate HTTP status codes

---

## Maintenance Notes

This architecture documentation should be updated when:
- New applications or services are added
- Database schema changes significantly
- Major technology stack updates
- New deployment environments
- Significant changes to data flow or security model

**Last Updated**: September 27, 2025
**Version**: 1.0
**Status**: Current and Accurate