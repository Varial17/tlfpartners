import { Mail, Phone, MessageSquare, MessageCircle, Smartphone } from "lucide-react";

export type Channel = "email" | "phone" | "chat" | "sms" | "call";

export const channelMeta: Record<
  string,
  { label: string; icon: typeof Mail }
> = {
  email: { label: "Email", icon: Mail },
  sms: { label: "SMS", icon: Smartphone },
  chat: { label: "Chat", icon: MessageCircle },
  call: { label: "Call", icon: Phone },
  phone: { label: "Phone / SMS", icon: MessageSquare }, // legacy rows
};

export const statusMeta: Record<
  string,
  { label: string; tone: "grey" | "blue" | "amber" | "green" | "navy" }
> = {
  new: { label: "New", tone: "grey" },
  drafted: { label: "Drafted", tone: "blue" },
  awaiting_review: { label: "Awaiting review", tone: "amber" },
  sent: { label: "Sent", tone: "green" },
  resolved: { label: "Resolved", tone: "green" },
};

export const priorityMeta: Record<
  string,
  { label: string; tone: "grey" | "orange" | "red" }
> = {
  low: { label: "Low", tone: "grey" },
  normal: { label: "Normal", tone: "grey" },
  high: { label: "High", tone: "red" },
};

export const clientTypeLabel: Record<string, string> = {
  smsf: "SMSF",
  business: "Business",
  individual: "Individual",
};
