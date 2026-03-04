
const DB_NAME = "zent-cache";
const DB_VERSION = 2;

interface CacheStore {
  messages: { key: string; channelId: string; data: any; timestamp: number };
  channels: { key: string; guildId: string; data: any; timestamp: number };
  guilds: { key: string; data: any; timestamp: number };
  users: { key: string; data: any; timestamp: number };
  members: { key: string; guildId: string; data: any; timestamp: number };
  outbox: { key: string; channelId: string; content: string; timestamp: number; status: string };
}

type StoreName = keyof CacheStore;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const stores: { name: StoreName; keyPath: string; indexes?: { name: string; keyPath: string }[] }[] = [
        { name: "messages", keyPath: "key", indexes: [{ name: "channelId", keyPath: "channelId" }] },
        { name: "channels", keyPath: "key", indexes: [{ name: "guildId", keyPath: "guildId" }] },
        { name: "guilds", keyPath: "key" },
        { name: "users", keyPath: "key" },
        { name: "members", keyPath: "key", indexes: [{ name: "guildId", keyPath: "guildId" }] },
        { name: "outbox", keyPath: "key", indexes: [{ name: "channelId", keyPath: "channelId" }] },
      ];
      for (const store of stores) {
        if (!db.objectStoreNames.contains(store.name)) {
          const os = db.createObjectStore(store.name, { keyPath: store.keyPath });
          if (store.indexes) {
            for (const idx of store.indexes) {
              os.createIndex(idx.name, idx.keyPath, { unique: false });
            }
          }
        }
      }
    };
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = openDB().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

async function getFromStore<T>(storeName: StoreName, key: string): Promise<T | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result?.data as T);
  });
}

async function putInStore(storeName: StoreName, key: string, data: any, extras: Record<string, any> = {}): Promise<void> {
  const db = await getDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.put({ key, data, timestamp: Date.now(), ...extras });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllByIndex<T>(storeName: StoreName, indexName: string, value: string): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result.map((r: any) => r.data) as T[]);
  });
}

async function deleteFromStore(storeName: StoreName, key: string): Promise<void> {
  const db = await getDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearStore(storeName: StoreName): Promise<void> {
  const db = await getDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// High-level cache API
export const cache = {
  // Messages
  async getMessages(channelId: string) {
    return getAllByIndex("messages", "channelId", channelId);
  },
  async putMessage(message: any) {
    await putInStore("messages", message.id, message, { channelId: message.channelId });
  },
  async putMessages(channelId: string, messages: any[]) {
    if (messages.length === 0) return;
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("messages", "readwrite");
      const store = tx.objectStore("messages");
      for (const msg of messages) {
        store.put({ key: msg.id, data: msg, timestamp: Date.now(), channelId: msg.channelId || channelId });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async deleteMessage(messageId: string) {
    await deleteFromStore("messages", messageId);
  },
  async getLastMessageId(channelId: string): Promise<string | null> {
    const messages = await getAllByIndex<any>("messages", "channelId", channelId);
    if (messages.length === 0) return null;
    return messages.reduce((latest, msg) => msg.id > latest.id ? msg : latest).id;
  },

  // Guilds
  async getGuild(guildId: string) {
    return getFromStore("guilds", guildId);
  },
  async putGuild(guild: any) {
    await putInStore("guilds", guild.id, guild);
  },
  async putGuilds(guilds: any[]) {
    await Promise.all(guilds.map((g) => putInStore("guilds", g.id, g)));
  },

  // Channels
  async getChannels(guildId: string) {
    return getAllByIndex("channels", "guildId", guildId);
  },
  async putChannel(channel: any) {
    await putInStore("channels", channel.id, channel, { guildId: channel.guildId });
  },
  async putChannels(guildId: string, channels: any[]) {
    await Promise.all(channels.map((ch) => putInStore("channels", ch.id, ch, { guildId })));
  },

  // Users
  async getUser(userId: string) {
    return getFromStore("users", userId);
  },
  async putUser(user: any) {
    await putInStore("users", user.id, user);
  },

  // Members
  async getMembers(guildId: string) {
    return getAllByIndex("members", "guildId", guildId);
  },
  async putMember(guildId: string, member: any) {
    await putInStore("members", member.userId || member.id, member, { guildId });
  },

  // Outbox (offline messages)
  async addToOutbox(channelId: string, content: string) {
    const key = Date.now().toString(36) + Math.random().toString(36).slice(2);
    await putInStore("outbox", key, { channelId, content }, { channelId, content, status: "pending" });
    return key;
  },
  async getOutbox() {
    const db = await getDB();
    return new Promise<any[]>((resolve, reject) => {
      const tx = db.transaction("outbox", "readonly");
      const store = tx.objectStore("outbox");
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },
  async removeFromOutbox(key: string) {
    await deleteFromStore("outbox", key);
  },

  // Clear all
  async clearAll() {
    const stores: StoreName[] = ["messages", "channels", "guilds", "users", "members", "outbox"];
    for (const store of stores) {
      await clearStore(store);
    }
  },
};
