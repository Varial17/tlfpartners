import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  users,
  clients,
  conversations,
  messages,
  drafts,
  knowledgeSources,
  knowledgeChunks,
} from "@/lib/db/schema";
import { ingestText } from "@/lib/rag/ingest";
import { generateDraftForConversation } from "@/lib/draft-service";
import { SOP_DOC, FAQ_DOC } from "./knowledge";

type Channel = "email" | "phone" | "chat";
type Lifecycle = "new" | "review" | "sent" | "sent_edited" | "low";

async function main() {
  console.log("Seeding TLF Support Hub…");

  // 1. Clear existing data (FK-safe order).
  await db.delete(drafts);
  await db.delete(messages);
  await db.delete(conversations);
  await db.delete(knowledgeChunks);
  await db.delete(knowledgeSources);
  await db.delete(clients);
  await db.delete(users);

  // 2. Users (all password: "password").
  const pw = await bcrypt.hash("password", 10);
  const staffRows = await db
    .insert(users)
    .values([
      { name: "Gary Limardiono", email: "gary@tlfpartners.com.au", passwordHash: pw, role: "admin" },
      { name: "Troy Bennett", email: "troy@tlfpartners.com.au", passwordHash: pw, role: "admin" },
      { name: "Amelia Cross", email: "amelia@tlfpartners.com.au", passwordHash: pw, role: "staff" },
      { name: "Jordan Mills", email: "jordan@tlfpartners.com.au", passwordHash: pw, role: "staff" },
    ])
    .returning();
  console.log(`  ${staffRows.length} users`);

  // 3. Clients.
  const clientRows = await db
    .insert(clients)
    .values([
      { name: "Sarah Nguyen", type: "individual", notes: "Salaried, small share portfolio.", openItems: ["2024 return outstanding"] },
      { name: "Marcus Webb", type: "individual", notes: "Has a rental property in Geelong." },
      { name: "Priya Patel", entityName: "Greenfield Cafe Pty Ltd", type: "business", notes: "Hospitality, Xero file.", openItems: ["Q3 BAS in progress"] },
      { name: "Tom Saunders", entityName: "BuildRight Constructions Pty Ltd", type: "business", notes: "Subcontractors, TPAR applies." },
      { name: "David Lawson", entityName: "The Lawson Family Super Fund", type: "smsf", notes: "Two-member accumulation fund." },
      { name: "Dr Mei Lin", entityName: "Aurora Dental Pty Ltd", type: "business", openItems: ["Annual accounts due"] },
      { name: "Jessica O'Brien", type: "individual" },
      { name: "Raj Kumar", entityName: "Coastal Logistics Pty Ltd", type: "business", notes: "Monthly BAS lodger." },
      { name: "Karen Henderson", entityName: "Henderson SMSF", type: "smsf", notes: "Pension phase." },
      { name: "Liam Carter", type: "individual", notes: "First-year client." },
    ])
    .returning();
  console.log(`  ${clientRows.length} clients`);

  // 4. Knowledge base.
  const sop = await ingestText({ filename: SOP_DOC.filename, text: SOP_DOC.text });
  const faq = await ingestText({ filename: FAQ_DOC.filename, text: FAQ_DOC.text });
  console.log(`  KB ingested: ${sop.chunkCount + faq.chunkCount} chunks`);

  // 5. Conversations.
  const ci = (n: number) => clientRows[n].id;
  const ai = (n: number) => staffRows[n].id;

  const specs: {
    client: number;
    channel: Channel;
    subject: string;
    body: string;
    priority?: "low" | "normal" | "high";
    assignee?: number;
    lifecycle: Lifecycle;
  }[] = [
    { client: 0, channel: "email", subject: "When is my 2024 tax return due?", body: "Hi, I haven't lodged my tax return yet for last financial year. When is it actually due if you're doing it for me? I don't want to get a fine. Thanks, Sarah", assignee: 2, lifecycle: "review" },
    { client: 1, channel: "email", subject: "What do you need for my rental property return?", body: "Morning — what documents do you need from me to do this year's return? I've got the Geelong rental again. Cheers, Marcus", assignee: 2, lifecycle: "review" },
    { client: 2, channel: "chat", subject: "BAS due date", body: "hey quick one — when's the Q3 BAS due? want to make sure we have the cash ready", priority: "normal", assignee: 3, lifecycle: "review" },
    { client: 3, channel: "phone", subject: "Call back — subcontractor reporting", body: "Voicemail: Tom from BuildRight, wanting to know if he needs to do the taxable payments report for his subbies this year and when it's due. Please call back.", priority: "normal", assignee: 3, lifecycle: "review" },
    { client: 4, channel: "email", subject: "SMSF annual return timing", body: "Hi team, when does our fund's annual return need to be lodged this year? Want to get our documents to you in time. Regards, David", assignee: 0, lifecycle: "review" },
    { client: 5, channel: "email", subject: "Quote for annual accounts", body: "Hello, can you let me know roughly what the annual accounts and tax for the practice will cost this year? Trying to budget. Thanks, Mei", priority: "normal", assignee: 3, lifecycle: "review" },
    { client: 6, channel: "chat", subject: "How much for a basic return?", body: "hi! how much do you charge for a simple tax return? just salary and a bit of bank interest", assignee: 2, lifecycle: "review" },
    { client: 7, channel: "phone", subject: "Book an appointment", body: "Voicemail: Raj here, I'd like to come in and chat about the next quarter. What times do you have and can we do it over Teams?", assignee: 3, lifecycle: "review" },
    { client: 8, channel: "email", subject: "Pension payment question", body: "Hi, can the fund deal with the ATO on my behalf for a small amount I owe? Not sure how that works. Karen", priority: "normal", assignee: 0, lifecycle: "review" },
    { client: 9, channel: "email", subject: "First return — what happens next?", body: "Hi, I'm a new client. What's the process from here and what do you need from me? Liam", assignee: 2, lifecycle: "review" },
    { client: 0, channel: "chat", subject: "Status of my return", body: "hey, just wondering how my return is going? sent everything through last week", assignee: 2, lifecycle: "new" },
    { client: 2, channel: "email", subject: "Invoice payment terms", body: "Hi, when is the invoice you sent through due for payment? Want to make sure I don't miss it. Priya", assignee: 3, lifecycle: "review" },
    { client: 3, channel: "email", subject: "Overdue 2023 company return", body: "Hi, I think last year's company return might still be outstanding — can you check and let me know what the due date is now? Tom", priority: "high", assignee: 0, lifecycle: "review" },
    { client: 6, channel: "phone", subject: "Call back — amend prior return", body: "Voicemail: Jess wants to know if a previous year's return can be amended after a missed deduction.", priority: "normal", assignee: 2, lifecycle: "new" },
    { client: 1, channel: "chat", subject: "Can I upload documents?", body: "where do I send my receipts and statements? is there a portal or just email?", assignee: 2, lifecycle: "sent" },
    { client: 4, channel: "email", subject: "Meeting to review fund strategy", body: "Hi, could we set up a time to review the fund's investment strategy and the year's contributions? David", assignee: 0, lifecycle: "sent" },
    { client: 5, channel: "chat", subject: "Office hours", body: "what hours are you open this week? need to drop something off", assignee: 3, lifecycle: "sent_edited" },
    { client: 7, channel: "email", subject: "Monthly BAS due date", body: "Hi, quick check — what date is our monthly BAS due each month? Raj", assignee: 3, lifecycle: "sent" },
    { client: 9, channel: "chat", subject: "Do you deal with the ATO?", body: "can you guys talk to the ATO for me or do I have to do that myself?", assignee: 2, lifecycle: "review" },
    { client: 8, channel: "email", subject: "Documents needed for SMSF audit", body: "Hi, what records will you need from us for this year's fund work and audit? Karen", priority: "normal", assignee: 0, lifecycle: "review" },
    { client: 6, channel: "email", subject: "Do you offer home loan / mortgage advice?", body: "Hi, slightly different question — do you give advice on home loans or refinancing a mortgage, or know a broker you'd recommend? Jess", assignee: 2, lifecycle: "low" },
  ];

  let made = 0;
  for (const s of specs) {
    const [conv] = await db
      .insert(conversations)
      .values({
        clientId: ci(s.client),
        channel: s.channel,
        subject: s.subject,
        priority: s.priority ?? "normal",
        assigneeId: s.assignee !== undefined ? ai(s.assignee) : null,
        status: "new",
      })
      .returning();

    await db.insert(messages).values({
      conversationId: conv.id,
      direction: "inbound",
      body: s.body,
      channel: s.channel,
    });

    if (s.lifecycle === "new") {
      made++;
      continue;
    }

    const draft = await generateDraftForConversation(conv.id);

    if (s.lifecycle === "low") {
      // Out-of-scope question: the correct behaviour is a holding reply flagged
      // for a human (what the real model returns when the KB can't answer).
      await db
        .update(drafts)
        .set({
          generatedText:
            "Hi Jess,\n\nThanks for your question. Home loan and mortgage advice sits outside the services covered in our knowledge base, so I don't want to give you the wrong steer. Let me check with the team on whether we can help or point you to a trusted broker, and I'll come back to you.\n\nKind regards,\nThe TLF Partners team",
          confidence: 0.28,
          lowConfidence: 1,
          citations: [],
        })
        .where(eq(drafts.id, draft.id));
    }

    if (s.lifecycle === "sent" || s.lifecycle === "sent_edited") {
      const edited =
        s.lifecycle === "sent_edited"
          ? draft.generatedText + "\n\nHappy to help if you need anything else."
          : null;
      const finalText = edited ?? draft.generatedText;
      await db.insert(messages).values({
        conversationId: conv.id,
        direction: "outbound",
        body: finalText,
        channel: s.channel,
      });
      await db
        .update(drafts)
        .set({ status: "sent", editedText: edited })
        .where(eq(drafts.id, draft.id));
      await db
        .update(conversations)
        .set({ status: "sent" })
        .where(eq(conversations.id, conv.id));
    }
    made++;
  }
  console.log(`  ${made} conversations`);

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
