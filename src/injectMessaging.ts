export interface Message<MessageData> {
  source: "page-script";
  type: string;
  id: number;
  data: MessageData;
}

export interface ResponseMessage<Response> {
  source: "extension";
  id: number;
  response: Response;
}

let nextId = 0;

export function sendMessage<MessageData, Response>(
  message: MessageData,
  type: string
): Promise<Response> {
  return new Promise((resolve) => {
    const messageId = nextId++;
    window.postMessage({
      source: "page-script",
      type,
      id: messageId,
      data: message,
    });

    window.addEventListener("message", (event) => {
      if (event.source !== window) {
        return;
      }

      const message = event.data as ResponseMessage<Response>;

      if (message.source !== "extension") {
        return;
      }
      if (message.id !== messageId) {
        return;
      }

      resolve(message.response);
    });
  });
}
