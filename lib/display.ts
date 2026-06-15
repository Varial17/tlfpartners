import { Mail, Phone, MessageSquare } from "lucide-react";

export const channelMeta = {
  email: { label: "Email", icon: Mail },
  phone: { label: "Phone / SMS", icon: Phone },
  chat: { label: "Chat", icon: MessageSquare },
} as const;

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
