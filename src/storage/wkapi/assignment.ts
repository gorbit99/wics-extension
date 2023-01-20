import { WKResponseItem } from "../wkapi";
import { MassCache } from "./massCache";

export class AssignmentHandler extends MassCache<WKAssignment> {
  protected getCachePrefix(): string {
    return "assignments";
  }
  protected getEndpoint(): string {
    return "assignments";
  }
  protected getMinCacheTime(): number {
    return 10 * 1000;
  }

  private static instance: AssignmentHandler;

  public static getInstance(): AssignmentHandler {
    if (!AssignmentHandler.instance) {
      AssignmentHandler.instance = new AssignmentHandler();
    }
    return AssignmentHandler.instance;
  }
}

interface WKAssignment extends WKResponseItem {
  available_at: string | null;
  burned_at: string | null;
  created_at: string;
  hidden: boolean;
  passed_at: string | null;
  resurrected_at: string | null;
  srs_stage: number;
  started_at: string | null;
  subject_id: number;
  subject_type: string;
  unlocked_at: string | null;
}
