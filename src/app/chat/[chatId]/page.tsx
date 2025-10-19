import { fetchChatMessages } from "../../actions/chat";
import { ChatWindow } from "../../components/chat-window";

export default async function ChatPage({
  params,
}: {
  params: { chatId: string };
}) {
  const messages = await fetchChatMessages(params.chatId);

  return <ChatWindow chatId={params.chatId} initialMessages={messages} />;
}
