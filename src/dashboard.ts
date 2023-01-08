import { StorageHandler } from "./storageHandler";

console.log("Load");

export { };

const pendingLessons = StorageHandler.getInstance().getPendingLessons();
const pendingReviewIds = StorageHandler.getInstance().getPendingReviewIds();

window.addEventListener("DOMContentLoaded", () => {
  doChanges();

  const mutationObserver = new MutationObserver(() => {
    doChanges();
  });
  mutationObserver.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
  });
});

function getPossibleClasses(buttonType: "review" | "lesson") {
  const buttonClasses =
    buttonType === "review" ? reviewButtonClasses : lessonButtonClasses;
  const prefix =
    buttonType === "review"
      ? "lessons-and-reviews__reviews-button"
      : "lessons-and-reviews__lessons-button";
  return buttonClasses.map((count) => `${prefix}--${count}`);
}

function doChanges() {
  const body = document.querySelector("#turbo-body") ?? document.body;
  if (body.classList.contains("wics-handled")) {
    return;
  }

  const reviewsButton = document.querySelector(
    ".lessons-and-reviews__reviews-button"
  ) as HTMLElement | undefined;
  const lessonsButton = document.querySelector(
    ".lessons-and-reviews__lessons-button"
  ) as HTMLElement | undefined;

  const reviewsNavigationShortcut = document.querySelector(
    ".navigation-shortcut--reviews, .navigation-shortcut__link[href='/review']"
  ) as HTMLElement | undefined;
  const lessonsNavigationShortcut = document.querySelector(
    ".navigation-shortcut--lessons, .navigation-shortcut__link[href='/lesson']"
  ) as HTMLElement | undefined;

  const reviewQueueCount = document.querySelector("#review-queue-count") as
    | HTMLElement
    | undefined;
  const lessonQueueCount = document.querySelector("#lesson-queue-count") as
    | HTMLElement
    | undefined;

  pendingReviewIds.then((ids) => {
    if (reviewsButton) {
      const reviewSpan = reviewsButton.querySelector("span") as HTMLSpanElement;
      const originalReviewCount = parseInt(reviewSpan.textContent!);
      const newReviewCount = originalReviewCount + ids.length;
      reviewSpan.textContent = newReviewCount.toString();
      reviewsButton.classList.remove(...getPossibleClasses("review"));
      reviewsButton.classList.add(
        getAppropriateClass("review", newReviewCount)
      );
    }

    if (reviewsNavigationShortcut) {
      const reviewSpan = reviewsNavigationShortcut.querySelector(
        "span"
      ) as HTMLSpanElement;
      const originalReviewCount = parseInt(reviewSpan.textContent!);
      const newReviewCount = originalReviewCount + ids.length;
      reviewSpan.textContent = newReviewCount.toString();
    }

    if (reviewQueueCount) {
      const originalReviewCount = parseInt(reviewQueueCount.textContent!);
      const newReviewCount = originalReviewCount + ids.length;
      reviewQueueCount.textContent = newReviewCount.toString();
      if (newReviewCount > 0) {
        const link = reviewQueueCount.parentElement!.querySelector("a")!;
        link.classList.remove("disabled");
        link.addEventListener("click", (e) => {
          e.preventDefault();
          location.href = "/review/session";
        });
      }
    }
  });

  pendingLessons.then((lessons) => {
    if (lessonsButton) {
      const lessonSpan = lessonsButton.querySelector("span") as HTMLSpanElement;
      const originalLessonCount = parseInt(lessonSpan.textContent!);
      const newLessonCount = originalLessonCount + lessons.length;
      lessonSpan.textContent = newLessonCount.toString();
      lessonsButton.classList.remove(...getPossibleClasses("lesson"));
      lessonsButton.classList.add(
        getAppropriateClass("lesson", newLessonCount)
      );
    }

    if (lessonsNavigationShortcut) {
      const lessonSpan = lessonsNavigationShortcut.querySelector(
        "span"
      ) as HTMLSpanElement;
      const originalLessonCount = parseInt(lessonSpan.textContent!);
      const newLessonCount = originalLessonCount + lessons.length;
      lessonSpan.textContent = newLessonCount.toString();
    }

    if (lessonQueueCount) {
      const originalLessonCount = parseInt(lessonQueueCount.textContent!);
      const newLessonCount = originalLessonCount + lessons.length;
      lessonQueueCount.textContent = newLessonCount.toString();
      if (newLessonCount > 0) {
        const link = lessonQueueCount.parentElement!.querySelector("a")!;
        link.classList.remove("disabled");
        link.addEventListener("click", (e) => {
          e.preventDefault();
          location.href = "/lesson/session";
        });
      }
    }
  });

  body.classList.add("wics-handled");
}

const reviewButtonClasses = [0, 1, 50, 100, 250, 500, 1000];

const lessonButtonClasses = [0, 1, 25, 50, 100, 250, 500];

function getAppropriateClass(buttonType: "review" | "lesson", pending: number) {
  console.log(buttonType, pending);
  const buttonClasses =
    buttonType === "review" ? reviewButtonClasses : lessonButtonClasses;
  const prefix =
    buttonType === "review"
      ? "lessons-and-reviews__reviews-button"
      : "lessons-and-reviews__lessons-button";
  const largest = buttonClasses
    .reverse()
    .findIndex((count) => count <= pending);
  if (largest === -1) {
    return `${prefix}--${buttonClasses[buttonClasses.length - 1]}`;
  }
  return `${prefix}--${buttonClasses[largest]}`;
}
