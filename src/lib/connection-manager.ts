// Multi-server connection manager

export interface ServerConnection {
  serverId: string;
  serverName: string;
  protocol: string;
  apiUrl: string;
  wsUrl: string;
  token: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  icon?: string;
}

const STORAGE_KEY = 'zent:connections';

class ConnectionManagerImpl {
  private connections = new Map<string, ServerConnection>();
  private listeners = new Set<() => void>();

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ServerConnection[];
        parsed.forEach(c => this.connections.set(c.serverId, { ...c, status: 'disconnected' }));
      }
    } catch {}
  }

  addConnection(conn: ServerConnection) {
    this.connections.set(conn.serverId, conn);
    this.save();
    this.notify();
  }

  removeConnection(serverId: string) {
    this.connections.delete(serverId);
    this.save();
    this.notify();
  }

  getConnection(serverId: string): ServerConnection | undefined {
    return this.connections.get(serverId);
  }

  getAllConnections(): ServerConnection[] {
    return Array.from(this.connections.values());
  }

  updateStatus(serverId: string, status: ServerConnection['status']) {
    const conn = this.connections.get(serverId);
    if (conn) {
      conn.status = status;
      this.notify();
    }
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  private save() {
    const data = Array.from(this.connections.values()).map(({ status, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export const connectionManager = new ConnectionManagerImpl();
