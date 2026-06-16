ALTER TYPE "public"."channel" ADD VALUE 'sms';--> statement-breakpoint
ALTER TYPE "public"."channel" ADD VALUE 'call';--> statement-breakpoint
CREATE INDEX "conversations_client_id_idx" ON "conversations" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "conversations_assignee_id_idx" ON "conversations" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "conversations_status_idx" ON "conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conversations_updated_at_idx" ON "conversations" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "drafts_conversation_status_created_idx" ON "drafts" USING btree ("conversation_id","status","created_at");--> statement-breakpoint
CREATE INDEX "drafts_message_id_idx" ON "drafts" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_source_id_idx" ON "knowledge_chunks" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_created_idx" ON "messages" USING btree ("conversation_id","created_at");