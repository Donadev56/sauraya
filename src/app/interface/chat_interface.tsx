export interface MessagesInterface {
  messages: MessageInterface[];
  conversationId: string;
  time: number;
}

export interface MessageInterface {
  content: string;
  role: "user" | "assistant" | "system" | "thinking_loader";
}

export interface ChatResponse {
  id: string;
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done_reason: string;
  done: boolean;
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  eval_count: number;
  eval_duration: number;
}

interface Conversation {
  title: string;
  messages: MessageInterface[];
}

export type ConversationsInterface = {
  [date: string]: {
    [conversationId: string]: Conversation;
  };
};

export interface PartialResponse {
  model: string;
  created_at: string; // Format ISO 8601
  message: MessageInterface;
  done: boolean;
  isfirst?: boolean;
}

export interface ChatRequestInterface {
  model: string;
  messages: MessageInterface[];
  stream: boolean;
}

export interface ImageRequestInterface {
  model: string;
  prompt: string;
  images: string[];
  stream: boolean;
}
