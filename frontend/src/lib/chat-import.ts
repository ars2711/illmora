type ImportedMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: number;
};

type ChatGPTConversation = {
  title?: string;
  mapping?: Record<string, any>;
};

const normalizeRole = (value: string) => {
  const role = value?.toLowerCase();
  if (role === "user" || role === "assistant" || role === "system") {
    return role;
  }
  if (role === "human") return "user";
  if (role === "ai" || role === "model") return "assistant";
  return "assistant";
};

const parseChatGptConversation = (conversation: ChatGPTConversation) => {
  if (!conversation?.mapping) return [] as ImportedMessage[];
  const nodes = Object.values(conversation.mapping)
    .map((node: any) => node?.message)
    .filter(Boolean)
    .map((message: any) => {
      const role = normalizeRole(message.author?.role ?? "assistant");
      const parts = message.content?.parts ?? [];
      const content = Array.isArray(parts)
        ? parts.filter(Boolean).join("\n")
        : String(message.content?.text ?? "");
      return {
        role,
        content,
        createdAt: message.create_time
          ? Math.floor(message.create_time * 1000)
          : undefined,
      } as ImportedMessage;
    })
    .filter((msg: ImportedMessage) => msg.content && msg.content.trim());

  return nodes.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
};

const parsePlainTextTranscript = (text: string) => {
  const lines = text.split(/\r?\n/);
  const messages: ImportedMessage[] = [];
  let currentRole: ImportedMessage["role"] | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!currentRole || buffer.length === 0) return;
    const content = buffer.join("\n").trim();
    if (content) {
      messages.push({ role: currentRole, content });
    }
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const match = /^(user|assistant|system)\s*:\s*/i.exec(trimmed);
    if (match) {
      flush();
      currentRole = normalizeRole(match[1]);
      buffer.push(trimmed.replace(/^(user|assistant|system)\s*:\s*/i, ""));
      continue;
    }
    if (!currentRole) {
      currentRole = "assistant";
    }
    buffer.push(line);
  }
  flush();
  return messages;
};

export const parseImportedChat = (rawText: string) => {
  const trimmed = rawText.trim();
  if (!trimmed) return [] as ImportedMessage[];

  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      if (parsed.length && parsed[0]?.mapping) {
        const messages: ImportedMessage[] = [];
        parsed.forEach((conversation: ChatGPTConversation) => {
          const title = conversation.title?.trim();
          if (title) {
            messages.push({
              role: "system",
              content: `Imported conversation: ${title}`,
            });
          }
          messages.push(...parseChatGptConversation(conversation));
        });
        return messages;
      }

      return parsed
        .map((item) => ({
          role: normalizeRole(item.role ?? "assistant"),
          content: String(item.content ?? "").trim(),
          createdAt: item.createdAt ?? undefined,
        }))
        .filter((msg) => msg.content);
    }

    if (parsed?.mapping) {
      return parseChatGptConversation(parsed as ChatGPTConversation);
    }

    if (Array.isArray(parsed?.messages)) {
      return parsed.messages
        .map((item: any) => ({
          role: normalizeRole(item.role ?? "assistant"),
          content: String(item.content ?? "").trim(),
          createdAt: item.createdAt ?? undefined,
        }))
        .filter((msg: ImportedMessage) => msg.content);
    }
  } catch {
    return parsePlainTextTranscript(trimmed);
  }

  return parsePlainTextTranscript(trimmed);
};
