'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Check, X } from 'lucide-react';
import { requestNotificationPermission, registerServiceWorker } from '@/lib/notifications';

const STORAGE_KEY = 'zent:notification-settings';

interface NotificationSettings {
  messages: boolean;
  mentions: boolean;
  dms: boolean;
  friendRequests: boolean;
}

const defaultSettings: NotificationSettings = {
  messages: false,
  mentions: true,
  dms: true,
  friendRequests: true,
};

function loadSettings(): NotificationSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {}
  return defaultSettings;
}

function saveSettings(settings: NotificationSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function PushNotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    setSettings(loadSettings());
    if (typeof window !== 'undefined') {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setSupported(false);
      } else {
        setPermission(Notification.permission);
      }
    }
  }, []);

  const handleRequestPermission = useCallback(async () => {
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result === 'granted') {
        await registerServiceWorker();
      }
    } catch {}
  }, []);

  const toggleSetting = useCallback(
    (key: keyof NotificationSettings) => {
      const updated = { ...settings, [key]: !settings[key] };
      setSettings(updated);
      saveSettings(updated);
    },
    [settings]
  );

  const PermissionIcon =
    permission === 'granted' ? BellRing : permission === 'denied' ? BellOff : Bell;

  const permissionLabel =
    permission === 'granted' ? 'Granted' : permission === 'denied' ? 'Denied' : 'Not requested';

  const toggleItems: { key: keyof NotificationSettings; label: string; description: string }[] = [
    { key: 'messages', label: 'Messages', description: 'All new messages in channels you are in' },
    { key: 'mentions', label: 'Mentions', description: 'When someone mentions you with @' },
    { key: 'dms', label: 'Direct Messages', description: 'New direct messages from other users' },
    {
      key: 'friendRequests',
      label: 'Friend Requests',
      description: 'Incoming friend requests',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Push Notifications</h3>
        <p className="text-sm text-zinc-400 mt-1">
          Configure how you receive push notifications in your browser.
        </p>
      </div>

      {!supported && (
        <div className="flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          <X className="h-4 w-4 shrink-0" />
          <span>Push notifications are not supported in this browser.</span>
        </div>
      )}

      {supported && (
        <>
          <div className="flex items-center justify-between rounded-md bg-zinc-800/50 p-4">
            <div className="flex items-center gap-3">
              <PermissionIcon className="h-5 w-5 text-zinc-300" />
              <div>
                <p className="text-sm font-medium text-white">Browser Permission</p>
                <p className="text-xs text-zinc-400">{permissionLabel}</p>
              </div>
            </div>
            {permission === 'default' && (
              <button
                onClick={handleRequestPermission}
                className="rounded bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-400 transition-colors"
              >
                Enable
              </button>
            )}
            {permission === 'granted' && (
              <Check className="h-5 w-5 text-green-400" />
            )}
            {permission === 'denied' && (
              <span className="text-xs text-zinc-500">
                Blocked in browser settings
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-300">Notification Types</h4>
            {toggleItems.map(({ key, label, description }) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-md bg-zinc-800/50 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-zinc-400">{description}</p>
                </div>
                <button
                  onClick={() => toggleSetting(key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    settings[key] ? 'bg-indigo-500' : 'bg-zinc-600'
                  }`}
                  role="switch"
                  aria-checked={settings[key]}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      settings[key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
