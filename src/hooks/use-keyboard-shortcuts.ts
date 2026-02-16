"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui";

export function useKeyboardShortcuts() {
  const { openModal, closeModal, activeModal, toggleMemberList, toggleMobileMenu } = useUIStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl/Cmd + K: Quick Switcher
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (activeModal === "quickSwitcher") {
          closeModal();
        } else {
          openModal("quickSwitcher");
        }
        return;
      }

      // Escape: Close modal
      if (e.key === "Escape" && activeModal) {
        e.preventDefault();
        closeModal();
        return;
      }

      // Alt + Shift + D: Toggle member list
      if (e.altKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        toggleMemberList();
        return;
      }

      // Ctrl/Cmd + Shift + M: Toggle mobile menu
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "M") {
        e.preventDefault();
        toggleMobileMenu();
        return;
      }

      // Ctrl/Cmd + E: Focus message input
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        const input = document.querySelector("textarea") as HTMLTextAreaElement | null;
        input?.focus();
        return;
      }

      // Ctrl/Cmd + ,: Open user settings
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        openModal("userSettings");
        return;
      }

      // Ctrl/Cmd + F: Focus search (channel search)
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        // Only intercept if not in an input
        const active = document.activeElement;
        if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") return;
        e.preventDefault();
        const searchBtn = document.querySelector("[data-channel-search]") as HTMLButtonElement | null;
        searchBtn?.click();
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeModal, openModal, closeModal, toggleMemberList, toggleMobileMenu]);
}
