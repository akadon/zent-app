import type { Message, Channel } from "@yxc/types";

const DB_NAME = "zent-cache";
const DB_VERSION = 1;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("messages")) {
        const msgStore = db.createObjectStore("messages", { keyPath: "id" });
        msgStore.createIndex("channelId", "channelId", { unique: false });
      }
      if (!db.objectStoreNames.contains("channels")) {
        db.createObjectStore("channels", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("drafts")) {
        db.createObjectStore("drafts", { keyPath: "channelId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheMessages(
  channelId: string,
  messages: Message[]
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("messages", "readwrite");
  const store = tx.objectStore("messages");
  for (const msg of messages) {
    store.put({ ...msg, channelId });
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getCachedMessages(
  channelId: string
): Promise<Message[]> {
  const db = await openDB();
  const tx = db.transaction("messages", "readonly");
  const store = tx.objectStore("messages");
  const index = store.index("channelId");
  const request = index.getAll(channelId);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result as Message[]);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function cacheChannels(channels: Channel[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("channels", "readwrite");
  const store = tx.objectStore("channels");
  for (const ch of channels) {
    store.put(ch);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getCachedChannels(): Promise<Channel[]> {
  const db = await openDB();
  const tx = db.transaction("channels", "readonly");
  const store = tx.objectStore("channels");
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result as Channel[]);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function saveDraftOffline(
  channelId: string,
  content: string
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("drafts", "readwrite");
  const store = tx.objectStore("drafts");
  store.put({ channelId, content });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getDraftOffline(
  channelId: string
): Promise<string | null> {
  const db = await openDB();
  const tx = db.transaction("drafts", "readonly");
  const store = tx.objectStore("drafts");
  const request = store.get(channelId);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      const result = request.result as
        | { channelId: string; content: string }
        | undefined;
      resolve(result?.content ?? null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function clearCache(): Promise<void> {
  const db = await openDB();
  const storeNames = ["messages", "channels", "drafts"] as const;
  const tx = db.transaction([...storeNames], "readwrite");
  for (const name of storeNames) {
    tx.objectStore(name).clear();
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export function isOnline(): boolean {
  return navigator.onLine;
}
