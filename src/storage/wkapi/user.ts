import { fetchEndpoint, WKRequest, WKResponseItem } from "../wkapi";

export async function fetchUser(
  useCache: boolean = true,
  apiKey?: string
): Promise<WKUser> {
  const user = await fetchEndpoint<WKUser>(
    {
      endpoint: "user",
      params: {},
    },
    useCache,
    apiKey
  );
  return user as WKUser;
}

export interface WKUserRequest extends WKRequest {
  endpoint: "user";
  params: {};
}

export interface WKUser extends WKResponseItem {
  current_vacation_started_at: null | string;
  level: number;
  preferences: {
    default_voice_actor_id: number;
    lessons_autoplay_audio: boolean;
    lessons_batch_size: number;
    lessons_presentation_order: string;
    reviews_autoplay_audio: boolean;
    reviews_display_srs_indicator: boolean;
  };
  profile_url: string;
  started_at: string;
  subscription: {
    active: boolean;
    max_level_granted: number;
    period_ends_at: string;
    type: "free" | "recurring" | "lifetime" | "unknown";
  };
  username: string;
}
