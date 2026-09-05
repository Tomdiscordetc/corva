/** Vormerkungen für die Benachrichtigungs-Vorschau, ohne echte Zustellung. */
export const DEFAULT_NOTIFICATION_PREFERENCES = {
  inquiries: true,
  assignments: true,
  appointments: true,
  summary: false,
  email: false,
};

export type NotificationPreference = keyof typeof DEFAULT_NOTIFICATION_PREFERENCES;
export type NotificationPreferences = Record<NotificationPreference, boolean>;

export const PLANNED_CONNECTIONS = ["email", "phone", "whatsapp", "social"] as const;
