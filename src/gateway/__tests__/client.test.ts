import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GatewayClient } from '../client';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(public url: string) {
    // Schedule connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 0);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  // Test helper to simulate receiving a message
  receiveMessage(data: any) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

describe('GatewayClient', () => {
  let client: GatewayClient;
  let mockWs: MockWebSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    // Replace global WebSocket
    (globalThis as any).WebSocket = MockWebSocket;
    // Mock import.meta.env
    (import.meta as any).env = { VITE_WS_URL: 'http://localhost:4002' };
    // Mock window.location
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
      });
    }

    client = new GatewayClient();
  });

  afterEach(() => {
    client.disconnect();
    vi.useRealTimers();
  });

  function connectClient() {
    client.connect('test-token');
    // Get the mock WebSocket instance
    mockWs = (client as any).ws as MockWebSocket;
    // Simulate connection open
    mockWs.readyState = MockWebSocket.OPEN;
    mockWs.onopen?.();
  }

  describe('connection lifecycle', () => {
    it('should create a WebSocket and send IDENTIFY on connect', () => {
      connectClient();
      const sent = mockWs.sent.map((s) => JSON.parse(s));
      // First message should be identify (op 2)
      expect(sent[0]).toEqual({ op: 2, d: { token: 'test-token', intents: 0x1FFFF } });
    });

    it('should not create duplicate connections', () => {
      connectClient();
      const firstWs = (client as any).ws;
      client.connect('test-token');
      expect((client as any).ws).toBe(firstWs);
    });

    it('should clean up on disconnect', () => {
      connectClient();
      client.disconnect();
      expect((client as any).ws).toBeNull();
      expect((client as any).token).toBeNull();
      expect((client as any).sessionId).toBeNull();
      expect((client as any).lastSequence).toBe(0);
    });
  });

  describe('heartbeat mechanism', () => {
    it('should start heartbeat on HELLO (op 10)', () => {
      connectClient();
      mockWs.receiveMessage({ op: 10, d: { heartbeatInterval: 30000 } });

      // Advance past jitter (max 30s) + interval
      vi.advanceTimersByTime(60000);

      // Should have sent heartbeats (op 1)
      const heartbeats = mockWs.sent
        .map((s) => JSON.parse(s))
        .filter((m: any) => m.op === 1);
      expect(heartbeats.length).toBeGreaterThanOrEqual(1);
    });

    it('should close connection when heartbeat ACK is not received', () => {
      connectClient();
      const closeSpy = vi.spyOn(mockWs, 'close');

      mockWs.receiveMessage({ op: 10, d: { heartbeatInterval: 1000 } });

      // First heartbeat - advance past jitter
      vi.advanceTimersByTime(1000);

      // Now heartbeatAcked is false, next heartbeat should close
      vi.advanceTimersByTime(1000);

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should track heartbeat ACK (op 11)', () => {
      connectClient();
      mockWs.receiveMessage({ op: 10, d: { heartbeatInterval: 5000 } });

      // Advance to send first heartbeat
      vi.advanceTimersByTime(5000);
      // Send ACK
      mockWs.receiveMessage({ op: 11 });

      expect((client as any).heartbeatAcked).toBe(true);
    });
  });

  describe('event handler registration', () => {
    it('should register and call event handlers', () => {
      connectClient();
      const handler = vi.fn();
      client.on('MESSAGE_CREATE', handler);

      mockWs.receiveMessage({ op: 0, t: 'MESSAGE_CREATE', s: 1, d: { content: 'hello' } });

      expect(handler).toHaveBeenCalledWith({ content: 'hello' });
    });

    it('should support multiple handlers for same event', () => {
      connectClient();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      client.on('MESSAGE_CREATE', handler1);
      client.on('MESSAGE_CREATE', handler2);

      mockWs.receiveMessage({ op: 0, t: 'MESSAGE_CREATE', s: 1, d: {} });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should remove handlers with off()', () => {
      connectClient();
      const handler = vi.fn();
      client.on('MESSAGE_CREATE', handler);
      client.off('MESSAGE_CREATE', handler);

      mockWs.receiveMessage({ op: 0, t: 'MESSAGE_CREATE', s: 1, d: {} });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function from on()', () => {
      connectClient();
      const handler = vi.fn();
      const unsub = client.on('TEST_EVENT', handler);

      unsub();
      mockWs.receiveMessage({ op: 0, t: 'TEST_EVENT', s: 1, d: {} });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('reconnection logic', () => {
    it('should schedule reconnect on close when token is set', () => {
      connectClient();
      const createSocketSpy = vi.spyOn(client as any, 'createSocket');

      // Simulate close
      mockWs.onclose?.();

      // Advance timers past reconnect delay (max 30s)
      vi.advanceTimersByTime(31000);

      expect(createSocketSpy).toHaveBeenCalled();
    });

    it('should NOT reconnect on intentional disconnect', () => {
      connectClient();
      const createSocketSpy = vi.spyOn(client as any, 'createSocket');

      client.disconnect();

      vi.advanceTimersByTime(60000);

      // createSocket should not have been called after disconnect
      expect(createSocketSpy).not.toHaveBeenCalled();
    });

    it('should emit __reconnected on reconnect', () => {
      connectClient();
      const handler = vi.fn();
      client.on('__reconnected', handler);

      // Set sessionId to simulate prior connection
      (client as any).sessionId = 'old-session';
      (client as any).reconnectAttempt = 1;

      // Create new socket manually
      (client as any).ws = null;
      (client as any).createSocket();
      const newWs = (client as any).ws as MockWebSocket;
      newWs.readyState = MockWebSocket.OPEN;
      newWs.onopen?.();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('session resume', () => {
    it('should send RESUME (op 6) with sessionId + seq on reconnect, NOT token', () => {
      connectClient();

      // Simulate READY to set sessionId
      mockWs.receiveMessage({ op: 0, t: 'READY', s: 1, d: { sessionId: 'sess-123' } });

      // Simulate some events to advance sequence
      mockWs.receiveMessage({ op: 0, t: 'MESSAGE_CREATE', s: 5, d: {} });

      // Now simulate reconnect
      mockWs.sent.length = 0; // Clear sent messages
      (client as any).ws = null;
      (client as any).createSocket();
      const newWs = (client as any).ws as MockWebSocket;
      newWs.readyState = MockWebSocket.OPEN;
      newWs.onopen?.();

      const sent = newWs.sent.map((s) => JSON.parse(s));
      expect(sent[0]).toEqual({ op: 6, d: { sessionId: 'sess-123', seq: 5 } });
    });

    it('should reset session on INVALID_SESSION (op 9)', () => {
      connectClient();
      (client as any).sessionId = 'sess-123';
      (client as any).lastSequence = 10;

      mockWs.receiveMessage({ op: 9 });

      expect((client as any).sessionId).toBeNull();
      expect((client as any).lastSequence).toBe(0);
    });
  });

  describe('message queuing', () => {
    it('should queue messages sent before READY', () => {
      client.connect('test-token');
      mockWs = (client as any).ws as MockWebSocket;

      // WebSocket not open yet - messages should be queued
      (client as any).send({ op: 3, d: { status: 'online' } });

      expect((client as any).sendQueue).toHaveLength(1);
    });

    it('should drain queue after READY', () => {
      connectClient();

      // Queue a message
      (client as any).sendQueue.push({ op: 3, d: { status: 'online' } });

      // Receive READY event
      mockWs.receiveMessage({ op: 0, t: 'READY', s: 1, d: { sessionId: 'sess-1' } });

      // Queue should be drained
      expect((client as any).sendQueue).toHaveLength(0);
      // Message should have been sent
      const sent = mockWs.sent.map((s) => JSON.parse(s));
      const presenceUpdate = sent.find((m: any) => m.op === 3);
      expect(presenceUpdate).toBeDefined();
    });

    it('should drain queue after RESUMED', () => {
      connectClient();

      (client as any).sendQueue.push({ op: 3, d: { status: 'online' } });
      mockWs.receiveMessage({ op: 0, t: 'RESUMED', s: 1, d: {} });

      expect((client as any).sendQueue).toHaveLength(0);
    });
  });

  describe('RECONNECT (op 7)', () => {
    it('should close connection on op 7', () => {
      connectClient();
      const closeSpy = vi.spyOn(mockWs, 'close');

      mockWs.receiveMessage({ op: 7 });
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('sequence tracking', () => {
    it('should track sequence numbers from dispatch events', () => {
      connectClient();

      mockWs.receiveMessage({ op: 0, t: 'MESSAGE_CREATE', s: 42, d: {} });
      expect((client as any).lastSequence).toBe(42);
    });
  });

  describe('public methods', () => {
    it('should send presence update', () => {
      connectClient();
      client.updatePresence('online', { text: 'Testing' });

      const sent = mockWs.sent.map((s) => JSON.parse(s));
      const presence = sent.find((m: any) => m.op === 3);
      expect(presence).toEqual({
        op: 3,
        d: { status: 'online', customStatus: { text: 'Testing' }, activities: [] },
      });
    });

    it('should send voice state update', () => {
      connectClient();
      client.updateVoiceState('guild1', 'channel1', true, false);

      const sent = mockWs.sent.map((s) => JSON.parse(s));
      const voice = sent.find((m: any) => m.op === 4);
      expect(voice).toEqual({
        op: 4,
        d: { guildId: 'guild1', channelId: 'channel1', selfMute: true, selfDeaf: false },
      });
    });

    it('should send guild member request', () => {
      connectClient();
      client.requestGuildMembers('guild1', 'search');

      const sent = mockWs.sent.map((s) => JSON.parse(s));
      const req = sent.find((m: any) => m.op === 8);
      expect(req).toEqual({
        op: 8,
        d: { guildId: 'guild1', query: 'search', userIds: undefined, limit: 100 },
      });
    });
  });
});
