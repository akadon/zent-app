import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../ui';

describe('UI Store', () => {
  beforeEach(() => {
    useUIStore.setState({
      activeModal: null,
      modalData: {},
      selectedGuildId: null,
      selectedChannelId: null,
      showFriends: true,
      dmChannelId: null,
      sidebarOpen: true,
      memberListOpen: true,
      focusMode: false,
      connectionStatus: 'disconnected',
      mobileMenuOpen: false,
      mobileTab: 'home',
    });
  });

  describe('modals', () => {
    it('should open a modal with data', () => {
      useUIStore.getState().openModal('createGuild', { foo: 'bar' });
      expect(useUIStore.getState().activeModal).toBe('createGuild');
      expect(useUIStore.getState().modalData).toEqual({ foo: 'bar' });
    });

    it('should open a modal without data', () => {
      useUIStore.getState().openModal('invitePeople');
      expect(useUIStore.getState().activeModal).toBe('invitePeople');
      expect(useUIStore.getState().modalData).toEqual({});
    });

    it('should close a modal and reset data', () => {
      useUIStore.getState().openModal('createChannel', { guildId: '1' });
      useUIStore.getState().closeModal();
      expect(useUIStore.getState().activeModal).toBeNull();
      expect(useUIStore.getState().modalData).toEqual({});
    });
  });

  describe('navigation', () => {
    it('should select a guild and reset channel', () => {
      useUIStore.setState({ selectedChannelId: 'ch1' });
      useUIStore.getState().selectGuild('guild1');
      expect(useUIStore.getState().selectedGuildId).toBe('guild1');
      expect(useUIStore.getState().selectedChannelId).toBeNull();
    });

    it('should select a channel', () => {
      useUIStore.getState().selectChannel('ch1');
      expect(useUIStore.getState().selectedChannelId).toBe('ch1');
    });

    it('should set showFriends', () => {
      useUIStore.getState().setShowFriends(false);
      expect(useUIStore.getState().showFriends).toBe(false);
    });

    it('should set DM channel id', () => {
      useUIStore.getState().setDmChannelId('dm1');
      expect(useUIStore.getState().dmChannelId).toBe('dm1');
    });

    it('should set guild to null', () => {
      useUIStore.getState().selectGuild('guild1');
      useUIStore.getState().selectGuild(null);
      expect(useUIStore.getState().selectedGuildId).toBeNull();
    });
  });

  describe('connection status', () => {
    it('should track connection status', () => {
      useUIStore.getState().setConnectionStatus('connected');
      expect(useUIStore.getState().connectionStatus).toBe('connected');
    });

    it('should update to reconnecting', () => {
      useUIStore.getState().setConnectionStatus('reconnecting');
      expect(useUIStore.getState().connectionStatus).toBe('reconnecting');
    });

    it('should update to disconnecting', () => {
      useUIStore.getState().setConnectionStatus('disconnecting');
      expect(useUIStore.getState().connectionStatus).toBe('disconnecting');
    });

    it('should start as disconnected', () => {
      expect(useUIStore.getState().connectionStatus).toBe('disconnected');
    });
  });

  describe('sidebar toggles', () => {
    it('should toggle sidebar open/closed', () => {
      expect(useUIStore.getState().sidebarOpen).toBe(true);
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should toggle member list open/closed', () => {
      expect(useUIStore.getState().memberListOpen).toBe(true);
      useUIStore.getState().toggleMemberList();
      expect(useUIStore.getState().memberListOpen).toBe(false);
    });
  });

  describe('focus mode', () => {
    it('should toggle focus mode', () => {
      expect(useUIStore.getState().focusMode).toBe(false);
      useUIStore.getState().toggleFocusMode();
      expect(useUIStore.getState().focusMode).toBe(true);
      useUIStore.getState().toggleFocusMode();
      expect(useUIStore.getState().focusMode).toBe(false);
    });
  });

  describe('mobile', () => {
    it('should toggle mobile menu', () => {
      expect(useUIStore.getState().mobileMenuOpen).toBe(false);
      useUIStore.getState().toggleMobileMenu();
      expect(useUIStore.getState().mobileMenuOpen).toBe(true);
    });

    it('should set mobile tab', () => {
      useUIStore.getState().setMobileTab('servers');
      expect(useUIStore.getState().mobileTab).toBe('servers');
    });
  });
});
