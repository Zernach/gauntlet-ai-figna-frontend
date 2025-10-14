export class WebSocketClient {
  private ws: WebSocket | null = null;
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  connect() {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.ws?.send(JSON.stringify({ type: 'auth', token: this.token }));
    };

    this.ws.onmessage = (event) => {
      console.log('WebSocket message:', event.data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

