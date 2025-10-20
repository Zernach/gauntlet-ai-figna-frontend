%% ARCHITECTURE: Backend Proxy Pattern
%% Frontend CAN access: Supabase Auth (direct)
%% Frontend CANNOT access: Supabase DB/Realtime (must use Railway backend proxy)
%% All DB operations: Frontend -> Railway API -> Supabase DB
%% All realtime updates: Supabase Realtime -> Railway WebSocket -> Frontend

graph TB
subgraph "Client Browser"
subgraph "React Application"
UI[UI Components]

            subgraph "Components Layer"
                Auth[Auth Components<br/>Login/Signup]
                Canvas[Canvas Components<br/>Canvas/Rectangle/Controls<br/>5000x5000px bounded]
                Collab[Collaboration Components<br/>Cursor/Presence]
                Layout[Layout Components<br/>Navbar]
            end

            subgraph "State Management"
                AuthCtx[Auth Context<br/>User State]
                CanvasCtx[Canvas Context<br/>Shapes State]
            end

            subgraph "Custom Hooks"
                useAuth[useAuth<br/>Auth Operations]
                useCanvas[useCanvas<br/>Canvas Operations]
                useCursors[useCursors<br/>Cursor Tracking]
                usePresence[usePresence<br/>Presence Management]
            end

            subgraph "Services Layer"
                AuthSvc[Auth Service<br/>signup/login/Google/logout]
                CanvasSvc[Canvas Service<br/>CRUD + Locking operations]
                CursorSvc[Cursor Service<br/>Position updates]
                PresenceSvc[Presence Service<br/>Online status]
                SupabaseInit[Supabase Initialization<br/>Config & Client Setup]
                APIClient[API Client<br/>Railway Backend Connection]
            end

            subgraph "Rendering Engine"
                Konva[Konva.js<br/>Canvas Rendering<br/>60 FPS]
            end

            subgraph "Utilities"
                Helpers[Helper Functions<br/>generateUserColor]
                Constants[Constants<br/>Canvas dimensions]
            end
        end
    end

    subgraph "Backend Services"
        subgraph "Supabase"
            SupaAuth[Supabase Auth<br/>User Management<br/>Email/Password + Google]
            SupaDB[(PostgreSQL Database<br/>Canvas + Shapes tables<br/>Persistent Storage)]
            SupaRT[Supabase Realtime<br/>WebSocket subscriptions<br/>Shape updates + Presence]
        end

        subgraph "Railway Hosted Backend"
            ExpressAPI[Express API Server<br/>Database Proxy<br/>REST endpoints + Auth middleware]
            WSServer[WebSocket Server<br/>Realtime Proxy<br/>Cursor/Presence/Shapes updates]
        end

        subgraph "Hosting"
            Hosting[Static File Hosting<br/>Deployed React App<br/>Vercel/Cloudflare]
        end
    end

    subgraph "Testing Infrastructure"
        subgraph "Test Suite"
            UnitTests[Unit Tests<br/>Vitest + Testing Library]
            IntegrationTests[Integration Tests<br/>Multi-user scenarios]
        end

        subgraph "Test Environment"
            LocalBackend[Local Express Server]
            SupabaseLocal[Supabase Local Dev<br/>Docker containers]
        end
    end

    %% Component to Context connections
    Auth --> AuthCtx
    Canvas --> CanvasCtx
    Collab --> CanvasCtx
    Layout --> AuthCtx

    %% Context to Hooks connections
    AuthCtx --> useAuth
    CanvasCtx --> useCanvas
    CanvasCtx --> useCursors
    CanvasCtx --> usePresence

    %% Hooks to Services connections
    useAuth --> AuthSvc
    useCanvas --> CanvasSvc
    useCursors --> CursorSvc
    usePresence --> PresenceSvc

    %% Services to Supabase/API Init
    AuthSvc --> SupabaseInit
    CanvasSvc --> APIClient
    CursorSvc --> APIClient
    PresenceSvc --> APIClient

    %% Auth: Frontend directly to Supabase
    SupabaseInit --> SupaAuth
    
    %% All other operations: Frontend to Backend (proxy pattern)
    APIClient --> ExpressAPI
    APIClient --> WSServer
    
    %% Backend to Supabase (proxy)
    ExpressAPI --> SupaDB
    WSServer --> SupaDB
    SupaRT --> WSServer

    %% Rendering
    Canvas --> Konva

    %% Utilities
    Helpers -.-> Collab
    Constants -.-> Canvas

    %% Real-time sync paths (ALL through backend proxy)
    CanvasSvc -->|HTTP: Create/Update/Delete<br/>Lock/Unlock<br/>under 100ms| ExpressAPI
    ExpressAPI -->|SQL queries| SupaDB
    SupaDB -->|DB changes| SupaRT
    SupaRT -->|Change notifications| WSServer
    WSServer -->|WebSocket: Shape updates| CanvasSvc

    CursorSvc -->|WebSocket: Position updates<br/>under 50ms at 20-30 FPS| WSServer
    WSServer -->|Broadcast to all clients| CursorSvc

    PresenceSvc -->|WebSocket: Online status<br/>onConnect/onDisconnect| WSServer
    WSServer -->|Broadcast presence| PresenceSvc

    %% Auth flow
    AuthSvc -->|signup/login| SupaAuth
    SupaAuth -->|JWT token<br/>Session state| AuthSvc

    %% Deployment
    UI -.->|Build & Deploy<br/>npm run build| Hosting

    %% Testing connections
    UnitTests -.->|Test| AuthSvc
    UnitTests -.->|Test| CanvasSvc
    UnitTests -.->|Test| Helpers

    IntegrationTests -.->|Test via| LocalBackend
    IntegrationTests -.->|Test via| SupabaseLocal

    %% User interactions
    User([Users<br/>Multiple Browsers]) -->|Interact| UI
    User -->|Access deployed app| Hosting

    %% Styling
    classDef client fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef backend fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef testing fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef rendering fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef user fill:#fce4ec,stroke:#c2185b,stroke-width:3px

    class Auth,Canvas,Collab,Layout,AuthCtx,CanvasCtx,useAuth,useCanvas,useCursors,usePresence,AuthSvc,CanvasSvc,CursorSvc,PresenceSvc,SupabaseInit,APIClient,Helpers,Constants client
    class SupaAuth,SupaDB,SupaRT,ExpressAPI,WSServer,Hosting backend
    class UnitTests,IntegrationTests,LocalBackend,SupabaseLocal testing
    class Konva rendering
    class User user
