type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, params?: EventParams) => void;
  }
}

export function trackEvent(eventName: string, params?: EventParams) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

export const analytics = {
  chatOpened: (source: "peek_composer") => {
    trackEvent("chat_opened", { source });
  },
  chatMessageSent: (params: {
    source: "composer" | "follow_up" | "suggested_prompt";
    promptLabel?: string;
    characterCount: number;
    hasConversation: boolean;
  }) => {
    trackEvent("chat_message_sent", {
      source: params.source,
      prompt_label: params.promptLabel,
      character_count: params.characterCount,
      has_conversation: params.hasConversation,
    });
  },
  chatResetClicked: (messageCount: number) => {
    trackEvent("chat_reset_clicked", { message_count: messageCount });
  },
  chatRetryClicked: (messageCount: number) => {
    trackEvent("chat_retry_clicked", { message_count: messageCount });
  },
  chatErrorShown: (message: string) => {
    trackEvent("chat_error_shown", { message: message.slice(0, 120) });
  },
  canvasViewedFromTool: (params: {
    canvasTitle: string;
    toolType: "custom" | "known";
  }) => {
    trackEvent("canvas_viewed_from_tool", {
      canvas_title: params.canvasTitle,
      tool_type: params.toolType,
    });
  },
  emailCaptureShown: (source: "soft_prompt" | "hard_cap") => {
    trackEvent("email_capture_shown", { source });
  },
  emailCaptureDismissed: (source: "soft_prompt" | "hard_cap") => {
    trackEvent("email_capture_dismissed", { source });
  },
  emailCaptureSubmitted: (source: "soft_prompt" | "hard_cap") => {
    trackEvent("email_capture_submitted", { source });
  },
};
