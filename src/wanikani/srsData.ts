export type BroadSrsLevel =
  | "lesson"
  | "apprentice"
  | "guru"
  | "master"
  | "enlightened"
  | "burned";

export class WKSrsData {
  private stage: number;
  private lastReviewDate: number | null;

  constructor();
  constructor(stage: number, lastReviewDate: number);
  constructor(stage?: number, lastReviewDate?: number) {
    this.stage = stage ?? 0;
    this.lastReviewDate = lastReviewDate ?? null;
  }

  getStage(): number {
    return this.stage;
  }

  getLastReviewDate(): number | null {
    return this.lastReviewDate;
  }

  getSrsStageLength(): number {
    const lengths = [
      0,
      4,
      8,
      24 - 1,
      2 * 24 - 1,
      7 * 24 - 1,
      2 * 7 * 24 - 1,
      30 * 24 - 1,
      4 * 30 * 24 - 1,
    ];

    return lengths[this.stage]!;
  }

  isPending(): boolean {
    if (this.lastReviewDate === null) {
      return true;
    }
    if (this.isBurned()) {
      return false;
    }
    const stageLength = this.getSrsStageLength();
    const reviewTime = new Date(
      this.lastReviewDate + stageLength * 60 * 60 * 1000
    );
    console.log("reviewTime", reviewTime, this.lastReviewDate);
    return reviewTime < new Date();
  }

  isBurned(): boolean {
    return this.stage === 9;
  }

  isReview(): boolean {
    return this.stage > 0;
  }

  isLesson(): boolean {
    return this.stage === 0;
  }

  isApprentice(): boolean {
    return this.stage >= 1 && this.stage < 5;
  }

  isGuru(): boolean {
    return this.stage >= 5 && this.stage < 7;
  }

  isMaster(): boolean {
    return this.stage == 7;
  }

  isEnlightened(): boolean {
    return this.stage == 8;
  }

  getBroadLevel(): BroadSrsLevel {
    if (this.isLesson()) {
      return "lesson";
    }
    if (this.isApprentice()) {
      return "apprentice";
    }
    if (this.isGuru()) {
      return "guru";
    }
    if (this.isMaster()) {
      return "master";
    }
    if (this.isEnlightened()) {
      return "enlightened";
    }
    return "burned";
  }

  review(mistakes: number) {
    if (mistakes === 0) {
      this.stage++;
    } else {
      const stageChanges = Math.ceil(mistakes / 2);
      const adjustmentSteps = this.stage >= 5 ? 2 : 1;
      const newStage = Math.max(1, this.stage - stageChanges * adjustmentSteps);
      this.stage = newStage;
    }
    this.lastReviewDate = new Date().setMinutes(0, 0, 0);
  }

  srsDataToText(): string {
    return (
      [
        "Lesson",
        "Apprentice I",
        "Apprentice II",
        "Apprentice III",
        "Apprentice IV",
        "Guru I",
        "Guru II",
        "Master",
        "Enlightened",
        "Burned",
      ][this.stage] ?? "Unknown"
    );
  }

  static hydrate(data: any) {
    Object.setPrototypeOf(data, WKSrsData.prototype);
  }
}
