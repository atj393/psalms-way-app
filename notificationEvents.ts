/** Shared event name + payload type for notification-tap routing. */
export const NOTIF_PRESS_EVENT = 'psalmway_notif_press';
export type NotifPressPayload = {
  chapter: number;
  verse: number;
  source?: 'prayer';   // set when navigating from a prayer psalm reference
  prayerId?: string;   // which prayer to return to
};
