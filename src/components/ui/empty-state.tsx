import { Hash, MessageSquare, Users, Shield } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-text-muted/30">
        {icon ?? <MessageSquare size={64} />}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-header-primary">{title}</h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-text-muted">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function NoMessagesState({ channelName }: { channelName?: string }) {
  return (
    <EmptyState
      icon={<Hash size={64} />}
      title={channelName ? `Welcome to #${channelName}!` : "Welcome to the channel!"}
      description="This is the beginning of this channel. Send a message to get the conversation started."
    />
  );
}

export function NoChannelsState({ onCreateChannel }: { onCreateChannel: () => void }) {
  return (
    <EmptyState
      icon={<Hash size={64} />}
      title="No channels yet"
      description="Create a channel to start chatting with your server members."
      action={{ label: "Create Channel", onClick: onCreateChannel }}
    />
  );
}

export function NoMembersState() {
  return (
    <EmptyState
      icon={<Users size={64} />}
      title="No members found"
      description="Invite people to your server to start building your community."
    />
  );
}

export function NoResultsState() {
  return (
    <EmptyState
      icon={<MessageSquare size={64} />}
      title="No results found"
      description="Try adjusting your search or filters."
    />
  );
}
