import { RemoteGraph } from "@langchain/langgraph/remote";
import type { BaseMessage } from "@langchain/core/messages";
import { AIMessage } from "@langchain/core/messages";

export interface LangGraphConfig {
  apiUrl?: string;
  apiKey?: string;
  graphId: string;
  assistantId: string;
}

export interface StreamingOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (message: BaseMessage) => void;
  onError?: (error: Error) => void;
}

export class LangGraphAdapter {
  private remoteGraph: RemoteGraph;
  private assistantId: string;

  constructor(config: LangGraphConfig) {
    this.remoteGraph = new RemoteGraph({
      graphId: config.graphId,
      url: config.apiUrl,
      apiKey: config.apiKey,
    });
    this.assistantId = config.assistantId;
  }

  async streamMessage(
    messages: BaseMessage[],
    options?: StreamingOptions,
  ): Promise<void> {
    try {
      const stream = await this.remoteGraph.stream(
        { messages },
        {
          configurable: { assistant_id: this.assistantId },
          streamMode: "messages",
        },
      );

      let fullContent = "";
      for await (const chunk of stream) {
        if (chunk.messages && chunk.messages.length > 0) {
          const message = chunk.messages[chunk.messages.length - 1];
          if (message.content) {
            const chunkContent =
              typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content);

            fullContent += chunkContent;
            options?.onChunk?.(chunkContent);
          }
        }
      }

      // Create final message for completion callback
      if (options?.onComplete) {
        const finalMessage = new AIMessage({
          content: fullContent,
          additional_kwargs: {},
          response_metadata: {},
        });
        options.onComplete(finalMessage);
      }
    } catch (error) {
      options?.onError?.(error as Error);
    }
  }

  async invokeMessage(messages: BaseMessage[]): Promise<BaseMessage> {
    const result = await this.remoteGraph.invoke(
      { messages },
      { configurable: { assistant_id: this.assistantId } },
    );

    if (result.messages && result.messages.length > 0) {
      return result.messages[result.messages.length - 1];
    }

    throw new Error("No message returned from LangGraph");
  }

  updateAssistantId(assistantId: string): void {
    this.assistantId = assistantId;
  }
}
