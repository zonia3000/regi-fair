import { APIRequestContext, expect } from "@playwright/test";

const MAILPIT_API_BASE_URL = 'http://127.0.0.1:8025/api/v1';

export type Message = {
  ID: string
  Subject: string;
  From: { Address: string };
  To: Array<{ Address: string }>;
  Text: string;
}

export async function searchMessage(request: APIRequestContext, query: string): Promise<Message> {
  let messages = await searchMessages(request, query);
  messages = messages.filter(m => m.Subject.includes(query));
  expect(messages).toHaveLength(1);
  return messages[0];
}

export async function searchMessages(request: APIRequestContext, query: string): Promise<Message[]> {

  const response = await request.get(`${MAILPIT_API_BASE_URL}/search?query=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error(`Error while contacting mailpit API. Response status is ${response.status}.`);
  }

  const result: { messages: Message[] } = await response.json();

  for (const message of result.messages) {
    message.Text = await getMessageText(request, message);
    expect(message.From.Address).toEqual('noreply@example.com');
  }

  return result.messages;
}

export async function getMessageText(request: APIRequestContext, message: Message): Promise<string> {

  const response = await request.get(`${MAILPIT_API_BASE_URL}/message/${message.ID}`);

  if (!response.ok) {
    throw new Error(`Error while contacting mailpit API. Response status is ${response.status}.`);
  }

  const result: { Text: string } = await response.json();
  return result.Text;
}
