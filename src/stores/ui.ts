import { create } from "zustand";

type ModalType =
  | "createGuild"
  | "createChannel"
  | "createThread"
  | "channelSettings"
  | "invitePeople"
  | "leaveGuild"
  | "userSettings"
  | "guildSettings"
  | "quickSwitcher"
  | "discoverServers"
  | null;

type MobileTab = "home" | "servers" | "dms" | "search" | "profile";

interface UIState {
  // Modals
  activeModal: ModalType;
  modalData: Record<string, unknown>;
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Navigation (moved from guild store for UI concerns)
  selectedGuildId: string | null;
  selectedChannelId: string | null;
  showFriends: boolean;
  dmChannelId: string | null;
  selectGuild: (id: string | null) => void;
  selectChannel: (id: string | null) => void;
  setShowFriends: (show: boolean) => void;
  setDmChannelId: (id: string | null) => void;

  // Sidebars
  sidebarOpen: boolean;
  memberListOpen: boolean;
  toggleSidebar: () => void;
  toggleMemberList: () => void;

  // Focus mode
  focusMode: boolean;
  toggleFocusMode: () => void;

  // Mobile
  mobileMenuOpen: boolean;
  mobileTab: MobileTab;
  toggleMobileMenu: () => void;
  setMobileTab: (tab: MobileTab) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  modalData: {},
  openModal: (modal, data = {}) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: {} }),

  // Navigation
  selectedGuildId: null,
  selectedChannelId: null,
  showFriends: true,
  dmChannelId: null,
  selectGuild: (id) => set({ selectedGuildId: id, selectedChannelId: null }),
  selectChannel: (id) => set({ selectedChannelId: id }),
  setShowFriends: (show) => set({ showFriends: show }),
  setDmChannelId: (id) => set({ dmChannelId: id }),

  // Sidebars
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  memberListOpen: true,
  toggleMemberList: () => set((s) => ({ memberListOpen: !s.memberListOpen })),

  // Focus mode
  focusMode: false,
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),

  // Mobile
  mobileMenuOpen: false,
  mobileTab: "home",
  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
  setMobileTab: (tab) => set({ mobileTab: tab }),
}));
