import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageInput } from '../message/message-input';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn().mockResolvedValue(undefined),
    getToken: vi.fn().mockReturnValue('test-token'),
  },
  API_URL: 'https://api.test.com',
}));

vi.mock('@/hooks/use-draft-persistence', () => ({
  useDraftPersistence: vi.fn().mockReturnValue({
    draft: '',
    saveDraft: vi.fn(),
    clearDraft: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('lucide-react', () => ({
  PlusCircle: () => <span data-testid="plus-circle-icon" />,
  Smile: () => <span data-testid="smile-icon" />,
  X: () => <span data-testid="x-icon" />,
  Paperclip: () => <span data-testid="paperclip-icon" />,
  BarChart3: () => <span data-testid="barchart-icon" />,
}));

vi.mock('../message/reply-preview', () => ({
  ReplyPreview: ({ message, onCancel }: any) => (
    <div data-testid="reply-preview">
      Replying to {message.id}
      <button data-testid="cancel-reply" onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('./emoji-picker', () => ({
  EmojiPicker: () => <div data-testid="emoji-picker" />,
}));

describe('MessageInput', () => {
  const mockOnSend = vi.fn();
  const mockOnCancelReply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the message textarea', () => {
    render(<MessageInput channelId="ch1" onSend={mockOnSend} />);
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
  });

  it('should render with correct placeholder', () => {
    render(<MessageInput channelId="ch1" onSend={mockOnSend} />);
    expect(screen.getByPlaceholderText('Message #channel')).toBeInTheDocument();
  });

  it('should update value when typing', () => {
    render(<MessageInput channelId="ch1" onSend={mockOnSend} />);
    const textarea = screen.getByTestId('message-input');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    expect(textarea).toHaveValue('Hello world');
  });

  it('should call onSend when Enter is pressed without shift', () => {
    render(<MessageInput channelId="ch1" onSend={mockOnSend} />);
    const textarea = screen.getByTestId('message-input');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(mockOnSend).toHaveBeenCalledWith('Hello', undefined);
  });

  it('should NOT call onSend when Shift+Enter is pressed', () => {
    render(<MessageInput channelId="ch1" onSend={mockOnSend} />);
    const textarea = screen.getByTestId('message-input');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should NOT call onSend when content is empty', () => {
    render(<MessageInput channelId="ch1" onSend={mockOnSend} />);
    const textarea = screen.getByTestId('message-input');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should render file upload button', () => {
    render(<MessageInput channelId="ch1" onSend={mockOnSend} />);
    expect(screen.getByTestId('file-upload-button')).toBeInTheDocument();
  });

  it('should render emoji picker button', () => {
    render(<MessageInput channelId="ch1" onSend={mockOnSend} />);
    expect(screen.getByTestId('emoji-picker-button')).toBeInTheDocument();
  });

  it('should render poll create button', () => {
    render(<MessageInput channelId="ch1" onSend={mockOnSend} />);
    expect(screen.getByTestId('poll-create-button')).toBeInTheDocument();
  });

  it('should show reply preview when replyingTo is set', () => {
    const message = { id: 'msg1', content: 'Hello' } as any;
    render(
      <MessageInput
        channelId="ch1"
        onSend={mockOnSend}
        replyingTo={message}
        onCancelReply={mockOnCancelReply}
      />
    );
    expect(screen.getByTestId('reply-preview')).toBeInTheDocument();
  });

  it('should not show reply preview when replyingTo is null', () => {
    render(<MessageInput channelId="ch1" onSend={mockOnSend} />);
    expect(screen.queryByTestId('reply-preview')).not.toBeInTheDocument();
  });

  it('should pass replyTo id to onSend when replying', () => {
    const message = { id: 'msg1', content: 'Hello' } as any;
    render(
      <MessageInput
        channelId="ch1"
        onSend={mockOnSend}
        replyingTo={message}
        onCancelReply={mockOnCancelReply}
      />
    );
    const textarea = screen.getByTestId('message-input');
    fireEvent.change(textarea, { target: { value: 'Reply text' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(mockOnSend).toHaveBeenCalledWith('Reply text', 'msg1');
  });
});
