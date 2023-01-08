import browser from "webextension-polyfill";
import { Config } from "./config";
import { StorageHandler } from "./storageHandler";

interface InjectMessage {
  type: string;
}

interface InjectReviewItemsMessage extends InjectMessage {
  type: "getReviewItems";
}

interface InjectLessonItemsMessage extends InjectMessage {
  type: "getLessonItems";
}

interface InjectReviewItemDataMessage extends InjectMessage {
  type: "getReviewItemData";
  items: string[];
}

interface LessonCompletionMessage extends InjectMessage {
  type: "lessonCompletion";
  customItems: string[];
}

interface MakeProgressMessage extends InjectMessage {
  type: "makeProgress";
  result: Record<number, [number, number]>;
}

interface FetchItemJsonMessage extends InjectMessage {
  type: "fetchItemJson";
  item: number;
}

interface GetConfigMessage extends InjectMessage {
  type: "getConfig";
}

type Message =
  | InjectReviewItemsMessage
  | InjectReviewItemDataMessage
  | InjectLessonItemsMessage
  | LessonCompletionMessage
  | MakeProgressMessage
  | FetchItemJsonMessage
  | GetConfigMessage;

browser.runtime.onMessageExternal.addListener((message: Message) => {
  switch (message.type) {
    case "getReviewItems":
      return StorageHandler.getInstance().getPendingReviewIds();
    case "getReviewItemData":
      return StorageHandler.getInstance().getReviewItemData(
        message.items.map((item) => parseInt(item))
      );
    case "getLessonItems":
      return StorageHandler.getInstance().getPendingLessons();
    case "lessonCompletion":
      return StorageHandler.getInstance().handleLessonCompletion(
        message.customItems.map((item) => parseInt(item))
      );
    case "makeProgress":
      return StorageHandler.getInstance().handleProgressMade(message.result);
    case "fetchItemJson":
      return StorageHandler.getInstance().getItemJson(message.item);
    case "getConfig":
      return Config.getInstance().getConfig();
  }
});
