import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
import { toast } from "sonner";
import { X } from "lucide-react";

export function CreateGuildModal() {
  const [name, setName] = useState("");
  const closeModal = useUIStore((s) => s.closeModal);
  const queryClient = useQueryClient();

  const createGuild = useMutation({
    mutationFn: (data: { name: string }) => api.post("/guilds", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      closeModal();
      toast.success("Server created");
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to create server");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-[440px] rounded-md bg-background-primary p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-header-primary">
            Create a server
          </h2>
          <button
            onClick={closeModal}
            className="text-interactive-normal hover:text-interactive-hover"
          >
            <X size={24} />
          </button>
        </div>

        <p className="mb-4 text-sm text-text-muted">
          Give your new server a name. You can always change it later.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) createGuild.mutate({ name: name.trim() });
          }}
        >
          <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">
            Server Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Server"
            autoFocus
            className="mb-4 w-full rounded-[3px] border-none bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-[3px] px-4 py-2 text-sm text-text-normal hover:underline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createGuild.isPending}
              className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              {createGuild.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
