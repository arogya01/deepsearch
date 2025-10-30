import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatWindow } from './chat-window';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('./tool-call-card', () => ({
  ToolCallCard: ({ part }: { part: { toolName: string } }) => <div>{part.toolName}</div>,
}));

jest.mock('streamdown', () => ({
  Streamdown: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/app/actions/chat', () => ({
  revalidateSidebar: jest.fn(),
}));

jest.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: () => <div />,
}));

describe('ChatWindow', () => {
  it('renders tool calls that are not searchWeb', () => {
    const messages = [
      {
        id: '1',
        role: 'assistant',
        parts: [
          {
            type: 'tool-call',
            toolCallId: 'tool_123',
            toolName: 'someOtherTool',
            args: {},
          },
        ],
      },
    ];

    render(<ChatWindow initialMessages={messages} />);

    expect(screen.getByText('someOtherTool')).toBeInTheDocument();
  });
});
