import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need a fresh ConnectionManagerImpl for each test
// since the module exports a singleton
describe('ConnectionManager', () => {
  let ConnectionManagerImpl: any;
  let manager: any;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    vi.restoreAllMocks();
  });

  async function createManager() {
    // Dynamic import to get fresh module each time won't work with vitest caching,
    // so we'll test the singleton behavior directly
    const mod = await import('../connection-manager');
    return mod.connectionManager;
  }

  // Since the module is a singleton, test it directly
  // We'll use the exported connectionManager
  beforeEach(async () => {
    const mod = await import('../connection-manager');
    manager = mod.connectionManager;
    // Clean up all connections
    for (const conn of manager.getAllConnections()) {
      manager.removeConnection(conn.serverId);
    }
  });

  const createConn = (id: string) => ({
    serverId: id,
    serverName: `Server ${id}`,
    protocol: 'zent',
    apiUrl: `https://api-${id}.test.com`,
    wsUrl: `wss://ws-${id}.test.com`,
    token: `token-${id}`,
    status: 'connected' as const,
  });

  describe('addConnection', () => {
    it('should add a connection', () => {
      const conn = createConn('s1');
      manager.addConnection(conn);
      expect(manager.getConnection('s1')).toBeDefined();
      expect(manager.getConnection('s1')!.serverName).toBe('Server s1');
    });

    it('should persist to localStorage', () => {
      const conn = createConn('s1');
      manager.addConnection(conn);
      const stored = JSON.parse(localStorage.getItem('zent:connections') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].serverId).toBe('s1');
      // status should NOT be persisted
      expect(stored[0].status).toBeUndefined();
    });
  });

  describe('removeConnection', () => {
    it('should remove a connection', () => {
      manager.addConnection(createConn('s1'));
      manager.addConnection(createConn('s2'));
      manager.removeConnection('s1');
      expect(manager.getConnection('s1')).toBeUndefined();
      expect(manager.getConnection('s2')).toBeDefined();
    });

    it('should update localStorage', () => {
      manager.addConnection(createConn('s1'));
      manager.removeConnection('s1');
      const stored = JSON.parse(localStorage.getItem('zent:connections') || '[]');
      expect(stored).toHaveLength(0);
    });
  });

  describe('getAllConnections', () => {
    it('should return all connections', () => {
      manager.addConnection(createConn('s1'));
      manager.addConnection(createConn('s2'));
      const all = manager.getAllConnections();
      expect(all).toHaveLength(2);
    });

    it('should return empty array when no connections', () => {
      expect(manager.getAllConnections()).toHaveLength(0);
    });
  });

  describe('updateStatus', () => {
    it('should update connection status', () => {
      manager.addConnection(createConn('s1'));
      manager.updateStatus('s1', 'disconnected');
      expect(manager.getConnection('s1')!.status).toBe('disconnected');
    });

    it('should do nothing for unknown server', () => {
      // Should not throw
      manager.updateStatus('unknown', 'connected');
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on add', () => {
      const listener = vi.fn();
      manager.subscribe(listener);

      manager.addConnection(createConn('s1'));
      expect(listener).toHaveBeenCalled();
    });

    it('should notify listeners on remove', () => {
      manager.addConnection(createConn('s1'));
      const listener = vi.fn();
      manager.subscribe(listener);

      manager.removeConnection('s1');
      expect(listener).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsub = manager.subscribe(listener);

      unsub();
      manager.addConnection(createConn('s1'));
      expect(listener).not.toHaveBeenCalled();
    });

    it('should notify on status update', () => {
      manager.addConnection(createConn('s1'));
      const listener = vi.fn();
      manager.subscribe(listener);

      manager.updateStatus('s1', 'error');
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('localStorage persistence', () => {
    it('should save connections without status field', () => {
      manager.addConnection(createConn('s1'));
      const stored = JSON.parse(localStorage.getItem('zent:connections') || '[]');
      expect(stored[0]).not.toHaveProperty('status');
      expect(stored[0].serverId).toBe('s1');
      expect(stored[0].token).toBe('token-s1');
    });
  });
});
