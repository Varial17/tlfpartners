import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  vector,
  index,
} from "drizzle-orm/pg-core";

// ---- enums (PRD §7) -------------------------------------------------------

export const userRole = pgEnum("user_role", ["staff", "admin"]);
export const clientType = pgEnum("client_type", [
  "smsf",
  "business",
  "individual",
]);
export const channel = pgEnum("channel", ["email", "phone", "chat"]);
export const conversationStatus = pgEnum("conversation_status", [
  "new",
  "drafted",
  "awaiting_review",
  "sent",
  "resolved",
]);
export const priority = pgEnum("priority", ["low", "normal", "high"]);
export const direction = pgEnum("direction", ["inbound", "outbound"]);
export const draftStatus = pgEnum("draft_status", [
  "pending",
  "sent",
  "discarded",
]);
export const sourceStatus = pgEnum("source_status", [
  "processing",
  "ingested",
  "error",
]);

// ---- tables ---------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("staff"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  entityName: text("entity_name"),
  type: clientType("type").notNull(),
  notes: text("notes"),
  openItems: jsonb("open_items").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    channel: channel("channel").notNull(),
    subject: text("subject").notNull(),
    status: conversationStatus("status").notNull().default("new"),
    priority: priority("priority").notNull().default("normal"),
    assigneeId: uuid("assignee_id").references(() => users.id),
    needsPartnerReview: integer("needs_partner_review").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("conversations_client_id_idx").on(t.clientId),
    index("conversations_assignee_id_idx").on(t.assigneeId),
    index("conversations_status_idx").on(t.status),
    index("conversations_updated_at_idx").on(t.updatedAt),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    direction: direction("direction").notNull(),
    body: text("body").notNull(),
    channel: channel("channel").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("messages_conversation_created_idx").on(
      t.conversationId,
      t.createdAt,
    ),
  ],
);

export type Citation = {
  chunkId: string;
  sourceId: string;
  filename: string;
  snippet: string;
  section?: string | null;
};

export const drafts = pgTable(
  "drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
    generatedText: text("generated_text").notNull(),
    editedText: text("edited_text"),
    status: draftStatus("status").notNull().default("pending"),
    confidence: real("confidence").notNull().default(0),
    lowConfidence: integer("low_confidence").notNull().default(0),
    citations: jsonb("citations").$type<Citation[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("drafts_conversation_status_created_idx").on(
      t.conversationId,
      t.status,
      t.createdAt,
    ),
    index("drafts_message_id_idx").on(t.messageId),
  ],
);

export const knowledgeSources = pgTable("knowledge_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  status: sourceStatus("status").notNull().default("processing"),
  chunkCount: integer("chunk_count").notNull().default(0),
  error: text("error"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
});

export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => knowledgeSources.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    metadata: jsonb("metadata").$type<{
      section?: string;
      chunkIndex?: number;
    }>(),
  },
  (t) => [
    index("knowledge_chunks_source_id_idx").on(t.sourceId),
    index("knowledge_chunks_embedding_idx").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops"),
    ),
  ],
);

// ---- inferred types -------------------------------------------------------

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
export type KnowledgeSource = typeof knowledgeSources.$inferSelect;
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
