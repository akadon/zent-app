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

interface UIState {
  // Modals
  activeModal: ModalType;
  modalData: Record<string, unknown>;
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Sidebars
  memberListOpen: boolean;
  toggleMemberList: () => void;

  // Mobile
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  modalData: {},
  openModal: (modal, data = {}) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: {} }),

  memberListOpen: true,
  toggleMemberList: () =>
    set((state) => ({ memberListOpen: !state.memberListOpen })),

  mobileMenuOpen: false,
  toggleMobileMenu: () =>
    set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
}));
