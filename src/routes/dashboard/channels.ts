import { Mail, Phone, MessageCircle, Camera, Users, Music2, type LucideIcon } from "lucide-react";
import type { Channel } from "@/demo/dashboard";

/**
 * Bewusst neutrale, generische Symbole statt Marken-Logos (lucide führt seit
 * Version 1 keine Markenzeichen mehr) — passt ohnehin besser zu einem
 * seriösen B2B-Werkzeug als nachgebaute Fremdmarken.
 */
export const CHANNEL_CONFIG: Record<Channel, { label: string; icon: LucideIcon; tone: string }> = {
  email: { label: "E-Mail", icon: Mail, tone: "text-neutral-500 bg-neutral-100" },
  telefon: { label: "Telefon", icon: Phone, tone: "text-neutral-500 bg-neutral-100" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, tone: "text-positive bg-positive-tint" },
  instagram: { label: "Instagram", icon: Camera, tone: "text-accent-text bg-accent-tint" },
  meta: { label: "Meta", icon: Users, tone: "text-accent-text bg-accent-tint" },
  tiktok: { label: "TikTok", icon: Music2, tone: "text-neutral-500 bg-neutral-100" },
};
