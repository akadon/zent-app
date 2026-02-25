import { useUIStore } from "@/stores/ui";
import { Compass } from "lucide-react";

export function DiscoverServersModal() {
  const closeModal = useUIStore((s) => s.closeModal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
      <div className="w-[440px] rounded-lg bg-background-secondary p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <Compass size={48} className="mx-auto mb-4 text-brand-light" />
        <h2 className="mb-2 text-lg font-bold text-header-primary">Server Discovery</h2>
        <p className="mb-6 text-sm text-text-muted">Server discovery is coming soon.</p>
        <button
          onClick={closeModal}
          className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
