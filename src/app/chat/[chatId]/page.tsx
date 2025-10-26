import { fetchChatMessages } from "../../actions/chat";
import { ChatWindow } from "../../components/chat-window";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const chatId = (await params).chatId;
  const messages = await fetchChatMessages(chatId);

  return (
    <ChatWindow
      key={chatId}
      chatId={chatId}
      initialMessages={messages}
      newChat={false}
    />
  );
}
