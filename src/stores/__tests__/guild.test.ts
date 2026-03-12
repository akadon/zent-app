import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGuildStore } from '../guild';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    setToken: vi.fn(),
    getToken: vi.fn(),
  },
}));

vi.mock('livekit-client', () => ({
  Room: vi.fn(),
  RoomEvent: {},
  Track: { Source: { Microphone: 'microphone' } },
}));

describe('Guild Store', () => {
  beforeEach(() => {
    useGuildStore.setState({
      guilds: [],
      channels: new Map(),
      members: new Map(),
      typingUsers: new Map(),
      readStates: [],
      voiceStates: new Map(),
      voiceConnection: null,
      pendingVoiceServer: null,
    });
  });

  describe('initial state', () => {
    it('should have empty guilds array', () => {
      expect(useGuildStore.getState().guilds).toEqual([]);
    });

    it('should have empty channels map', () => {
      expect(useGuildStore.getState().channels.size).toBe(0);
    });

    it('should have empty members map', () => {
      expect(useGuildStore.getState().members.size).toBe(0);
    });

    it('should have null voiceConnection', () => {
      expect(useGuildStore.getState().voiceConnection).toBeNull();
    });
  });

  describe('setGuilds', () => {
    it('should update guild list', () => {
      const guilds = [
        { id: '1', name: 'Guild 1' },
        { id: '2', name: 'Guild 2' },
      ] as any[];
      useGuildStore.getState().setGuilds(guilds);
      expect(useGuildStore.getState().guilds).toEqual(guilds);
    });
  });

  describe('addGuild', () => {
    it('should add a guild to the list', () => {
      const guild = { id: '1', name: 'New Guild' } as any;
      useGuildStore.getState().addGuild(guild);
      expect(useGuildStore.getState().guilds).toHaveLength(1);
      expect(useGuildStore.getState().guilds[0]).toEqual(guild);
    });

    it('should append to existing guilds', () => {
      useGuildStore.setState({ guilds: [{ id: '1', name: 'Existing' } as any] });
      useGuildStore.getState().addGuild({ id: '2', name: 'New' } as any);
      expect(useGuildStore.getState().guilds).toHaveLength(2);
    });
  });

  describe('removeGuild', () => {
    it('should remove a guild by id', () => {
      useGuildStore.setState({
        guilds: [
          { id: '1', name: 'Guild 1' },
          { id: '2', name: 'Guild 2' },
        ] as any[],
      });
      useGuildStore.getState().removeGuild('1');
      expect(useGuildStore.getState().guilds).toHaveLength(1);
      expect(useGuildStore.getState().guilds[0].id).toBe('2');
    });

    it('should also clean up channels, members, and voiceStates for removed guild', () => {
      const channels = new Map<string, any[]>();
      channels.set('1', [{ id: 'ch1' }, { id: 'ch2' }]);
      const members = new Map<string, any[]>();
      members.set('1', [{ id: 'm1' }]);
      const voiceStates = new Map<string, any[]>();
      voiceStates.set('ch1', [{ userId: 'u1' }]);

      useGuildStore.setState({
        guilds: [{ id: '1', name: 'Guild 1' }] as any[],
        channels,
        members,
        voiceStates,
      });

      useGuildStore.getState().removeGuild('1');

      expect(useGuildStore.getState().channels.has('1')).toBe(false);
      expect(useGuildStore.getState().members.has('1')).toBe(false);
      expect(useGuildStore.getState().voiceStates.has('ch1')).toBe(false);
    });
  });

  describe('updateGuild', () => {
    it('should update an existing guild', () => {
      useGuildStore.setState({
        guilds: [{ id: '1', name: 'Old Name', icon: null }] as any[],
      });
      useGuildStore.getState().updateGuild({ id: '1', name: 'New Name' } as any);
      expect(useGuildStore.getState().guilds[0].name).toBe('New Name');
    });

    it('should not affect other guilds', () => {
      useGuildStore.setState({
        guilds: [
          { id: '1', name: 'Guild 1' },
          { id: '2', name: 'Guild 2' },
        ] as any[],
      });
      useGuildStore.getState().updateGuild({ id: '1', name: 'Updated' } as any);
      expect(useGuildStore.getState().guilds[1].name).toBe('Guild 2');
    });
  });

  describe('setChannels', () => {
    it('should set channels for a guild', () => {
      const channels = [{ id: 'ch1', name: 'general' }] as any[];
      useGuildStore.getState().setChannels('guild1', channels);
      expect(useGuildStore.getState().channels.get('guild1')).toEqual(channels);
    });
  });

  describe('addChannel', () => {
    it('should add a channel to a guild', () => {
      useGuildStore.getState().addChannel('guild1', { id: 'ch1', name: 'general' } as any);
      expect(useGuildStore.getState().channels.get('guild1')).toHaveLength(1);
    });

    it('should append to existing channels', () => {
      useGuildStore.getState().setChannels('guild1', [{ id: 'ch1', name: 'general' }] as any[]);
      useGuildStore.getState().addChannel('guild1', { id: 'ch2', name: 'random' } as any);
      expect(useGuildStore.getState().channels.get('guild1')).toHaveLength(2);
    });
  });

  describe('updateChannel', () => {
    it('should update an existing channel', () => {
      useGuildStore.getState().setChannels('guild1', [
        { id: 'ch1', name: 'old-name', guildId: 'guild1' },
      ] as any[]);
      useGuildStore.getState().updateChannel({ id: 'ch1', name: 'new-name', guildId: 'guild1' } as any);
      expect(useGuildStore.getState().channels.get('guild1')![0].name).toBe('new-name');
    });
  });

  describe('removeChannel', () => {
    it('should remove a channel from a guild', () => {
      useGuildStore.getState().setChannels('guild1', [
        { id: 'ch1', name: 'general' },
        { id: 'ch2', name: 'random' },
      ] as any[]);
      useGuildStore.getState().removeChannel('guild1', 'ch1');
      const channels = useGuildStore.getState().channels.get('guild1')!;
      expect(channels).toHaveLength(1);
      expect(channels[0].id).toBe('ch2');
    });
  });

  describe('setMembers', () => {
    it('should set members for a guild', () => {
      const members = [{ id: 'm1', username: 'user1' }] as any[];
      useGuildStore.getState().setMembers('guild1', members);
      expect(useGuildStore.getState().members.get('guild1')).toEqual(members);
    });
  });

  describe('setTyping / clearTyping', () => {
    it('should set a typing indicator', () => {
      useGuildStore.getState().setTyping('ch1', 'user1');
      const typing = useGuildStore.getState().typingUsers.get('ch1');
      expect(typing).toBeDefined();
      expect(typing!.has('user1')).toBe(true);
    });

    it('should clear a typing indicator', () => {
      useGuildStore.getState().setTyping('ch1', 'user1');
      useGuildStore.getState().clearTyping('ch1', 'user1');
      const typing = useGuildStore.getState().typingUsers.get('ch1');
      expect(typing === undefined || typing.size === 0).toBe(true);
    });
  });

  describe('setReadStates', () => {
    it('should set read states', () => {
      const states = [{ channelId: 'ch1', lastMessageId: 'msg1', mentionCount: 2 }];
      useGuildStore.getState().setReadStates(states);
      expect(useGuildStore.getState().readStates).toEqual(states);
    });
  });

  describe('voice states', () => {
    it('should set and get voice states', () => {
      const states = [{ userId: 'u1', channelId: 'ch1' }] as any[];
      useGuildStore.getState().setVoiceStates('ch1', states);
      expect(useGuildStore.getState().getVoiceStates('ch1')).toEqual(states);
    });

    it('should return empty array for unknown channel', () => {
      expect(useGuildStore.getState().getVoiceStates('unknown')).toEqual([]);
    });
  });

  describe('voice connection', () => {
    it('should set voice connection', () => {
      const conn = {
        guildId: 'g1',
        channelId: 'ch1',
        selfMute: false,
        selfDeaf: false,
        selfVideo: false,
        selfStream: false,
        livekitRoom: null,
        livekitToken: null,
      };
      useGuildStore.getState().setVoiceConnection(conn);
      expect(useGuildStore.getState().voiceConnection).toEqual(conn);
    });

    it('should toggle self mute', () => {
      useGuildStore.setState({
        voiceConnection: {
          guildId: 'g1',
          channelId: 'ch1',
          selfMute: false,
          selfDeaf: false,
          selfVideo: false,
          selfStream: false,
          livekitRoom: null,
          livekitToken: null,
        },
      });
      useGuildStore.getState().toggleSelfMute();
      expect(useGuildStore.getState().voiceConnection!.selfMute).toBe(true);
    });

    it('should disconnect voice and clear state', () => {
      useGuildStore.setState({
        voiceConnection: {
          guildId: 'g1',
          channelId: 'ch1',
          selfMute: false,
          selfDeaf: false,
          selfVideo: false,
          selfStream: false,
          livekitRoom: null,
          livekitToken: null,
        },
        pendingVoiceServer: { guildId: 'g1', token: 't', endpoint: 'e' },
      });
      useGuildStore.getState().disconnectVoice();
      expect(useGuildStore.getState().voiceConnection).toBeNull();
      expect(useGuildStore.getState().pendingVoiceServer).toBeNull();
    });
  });

  describe('consumeVoiceServer', () => {
    it('should return and clear pending voice server', () => {
      const pending = { guildId: 'g1', token: 't', endpoint: 'e' };
      useGuildStore.setState({ pendingVoiceServer: pending });
      const result = useGuildStore.getState().consumeVoiceServer();
      expect(result).toEqual(pending);
      expect(useGuildStore.getState().pendingVoiceServer).toBeNull();
    });

    it('should return null when no pending voice server', () => {
      expect(useGuildStore.getState().consumeVoiceServer()).toBeNull();
    });
  });

  describe('initGatewayHandlers', () => {
    it('should return a cleanup function (no-op)', () => {
      const cleanup = useGuildStore.getState().initGatewayHandlers();
      expect(typeof cleanup).toBe('function');
      cleanup(); // should not throw
    });
  });
});
