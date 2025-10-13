# Product Requirements Document (PRD): CollabCanvas

## Overview

**Product Name:** CollabCanvas
**Goal:** Build a real-time, AI-powered collaborative design canvas that allows multiple users to design together and interact with AI via natural language commands.
**Sprint Duration:** 1 week
**Phases:**

1. Core collaborative infrastructure (MVP)
2. AI canvas agent (post-MVP)

---

## MVP Definition (Within 24 Hours)

### Objective

Deliver a **real-time collaborative canvas** demonstrating robust multiplayer synchronization. The MVP must prioritize performance, reliability, and real-time state consistency across multiple users.

### Core Requirements

1. **Canvas Fundamentals**

   * Pan and zoom functionality.
   * Support for at least one shape type: rectangle, circle, or text.
   * Ability to create, move, and delete objects.

2. **Collaboration Infrastructure**

   * Real-time synchronization between 2+ users.
   * Display multiplayer cursors with user names.
   * Presence awareness (who’s online).
   * Persistent canvas state (restores after disconnects).

3. **User System**

   * Authentication (unique user names/accounts).

4. **Deployment**

   * Hosted publicly and accessible by testers.

### Performance Targets

* Maintain **60 FPS** for all interactions.
* Sync latency: **<100ms** for object changes, **<50ms** for cursor movements.
* Support **5+ concurrent users** and **500+ simple objects** without performance degradation.

### Deliverables

* Fully deployed multiplayer canvas.
* Backend using Firestore, Supabase, or custom WebSocket server.
* State persistence layer.

### Non-Goals (Not in MVP)

* AI integration.
* Advanced shape types or animations.
* Grouping, snapping, or layer management.
* Undo/redo stack.

---

## Post-MVP Scope (Days 2–7)

Once the collaborative foundation is stable, expand functionality to include the AI agent and extended design capabilities.

### AI Canvas Agent

**Goal:** Enable users to manipulate the canvas through natural language.

#### Requirements

* Integrate AI agent capable of **interpreting and executing canvas commands**.
* Support at least **6 command types** across creation, manipulation, and layout actions.
* Use **function calling** via OpenAI or LangChain.

#### Example Commands

**Creation:**

* “Create a red circle at position 100, 200.”
* “Add a text layer that says ‘Hello World.’”

**Manipulation:**

* “Move the blue rectangle to the center.”
* “Resize the circle to be twice as big.”

**Layout:**

* “Arrange these shapes in a horizontal row.”
* “Create a grid of 3x3 squares.”

**Complex:**

* “Create a login form with username and password fields.”

#### Evaluation Criteria

* Consistent shared AI actions across users.
* Latency under 2 seconds for single-step commands.
* Handles concurrent user requests.
* Executes multi-step tasks with logical planning.

### Shared AI State

* AI-generated objects visible to all users.
* No user conflicts during simultaneous AI operations.

### Technical Requirements

* Tool schema for AI:

  ```ts
  createShape(type, x, y, width, height, color)
  moveShape(shapeId, x, y)
  resizeShape(shapeId, width, height)
  rotateShape(shapeId, degrees)
  createText(text, x, y, fontSize, color)
  getCanvasState()
  ```
* Frontend built in React (or Vue/Svelte) with Konva.js or Fabric.js.
* Backend: Firestore, Supabase, or WebSocket server.

---

## Success Criteria

* **MVP:** Demonstrates a bulletproof multiplayer foundation.
* **Final Product:** Seamless real-time collaboration with working AI-driven design features.
* **Performance:** Meets or exceeds 60 FPS and latency targets.

---

## Out of Scope

* Version control for designs.
* Commenting or annotations.
* AI-based visual generation (e.g., text-to-image).
* 3D or advanced rendering features.

---

---

## Key Principles

* **Multiplayer first.** Collaboration reliability comes before features.
* **AI second.** Add intelligence only after the foundation is solid.
* **Vertical build.** Complete one layer before moving to the next.
* **Continuous testing.** Validate performance with multiple concurrent users.

> A simple, stable multiplayer canvas with a working AI agent beats any feature-rich app with broken sync.
