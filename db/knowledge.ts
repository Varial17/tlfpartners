// Placeholder TLF knowledge base content used to seed the RAG layer until
// Gary supplies the real 60-page SOP + FAQ set (PRD §10). Written so the seeded
// conversations have something concrete to ground against.

import { readFileSync } from "fs";
import { join } from "path";

// Richer advisory/technical knowledge (Division 296, NALI, Div 7A, CGT, etc.)
// kept as an editable Markdown file so it can also be uploaded via the UI.
export const ADVISORY_DOC = {
  filename: "TLF Partners — Advisory & Technical Knowledge.md",
  text: readFileSync(join(process.cwd(), "knowledge/TLF-Advisory-Knowledge.md"), "utf8"),
};

export const SOP_DOC = {
  filename: "TLF Partners — SOP (excerpt).md",
  text: `TLF PARTNERS STANDARD OPERATING PROCEDURES (EXCERPT)

LODGEMENT DEADLINES
Individual tax returns: clients who self-lodge must lodge by 31 October. Clients lodging through TLF Partners (a registered tax agent) generally have an extended due date, typically 15 May the following year, provided they are on our lodgement program and prior-year returns are up to date.
Company and trust tax returns: due dates vary; most April–May the following year when lodged via TLF as agent. New clients or those with overdue prior-year returns may have an earlier due date.
SMSF annual returns: lodged via agent, generally due 15 May. Newly registered funds have a 28 February due date for their first return.

BUSINESS ACTIVITY STATEMENTS (BAS)
Quarterly BAS due dates when lodged through TLF as agent: Quarter 1 (Jul–Sep) due 25 November; Quarter 2 (Oct–Dec) due 28 February; Quarter 3 (Jan–Mar) due 25 May; Quarter 4 (Apr–Jun) due 25 August. Self-lodgers have earlier dates (28th of the month following quarter end). Monthly BAS is due on the 21st of the following month.

DOCUMENT REQUESTS — INDIVIDUAL TAX RETURNS
To prepare an individual return we ask clients to provide: PAYG payment summaries / income statements, bank interest, dividend statements, private health insurance statement, work-related expense receipts, motor vehicle logbook (if claiming), rental property income and expense summaries, and any capital gains records (e.g. share or property sales).

DOCUMENT REQUESTS — BUSINESS CLIENTS
For business work we typically need: bank statements for all accounts, loan statements, asset purchase invoices, payroll reports, and access to the accounting file (Xero). Clients can upload documents via their secure client portal or email them to their client manager.

FEES AND BILLING
Most individual returns are charged on a fixed-fee basis. Standard individual return from $180; returns with rental property or capital gains from $330. Business and SMSF work is quoted per engagement and confirmed in the engagement letter before work begins. Advisory and virtual-CFO services are billed on a monthly fixed-fee retainer. Invoices are issued on completion and are payable within 14 days. We do not commence new work where prior invoices are overdue beyond 30 days.

APPOINTMENTS AND CONTACT
Office hours are Monday to Friday, 9:00am to 5:00pm (AEST). Clients can book an appointment by replying to their client manager, calling the office, or using the online booking link. We offer in-person, phone and video (Teams) meetings. Please allow up to one business day for a response to general enquiries.

CHECKING THE STATUS OF WORK
Clients can ask their client manager for an update at any time. Standard turnaround for an individual return once all documents are received is 5–10 business days during non-peak periods. BAS preparation is completed within 5 business days of receiving the records.

ENGAGEMENT AND ONBOARDING
New clients receive an engagement letter setting out scope and fees, and an authority to act so we can deal with the ATO on their behalf. We must verify the correct legal entity name on all engagement and ethical clearance letters before they are issued.
`,
};

export const FAQ_DOC = {
  filename: "TLF Partners — Client FAQ.md",
  text: `TLF PARTNERS — FREQUENTLY ASKED QUESTIONS

Q: When is my tax return due?
A: If we lodge on your behalf and your prior returns are up to date, your individual return is generally due by 15 May the following year. Self-lodgers must lodge by 31 October. We will let you know your specific due date.

Q: What do you need from me to do my tax return?
A: Your income statement/PAYG summary, bank interest, dividends, private health statement, work-related expense details, and records for any rental property or asset sales. You can upload these to your client portal or email your client manager.

Q: When is my BAS due?
A: For quarterly lodgers using TLF as agent: Q1 25 Nov, Q2 28 Feb, Q3 25 May, Q4 25 Aug. We prepare your BAS within 5 business days of receiving your records.

Q: How much will it cost?
A: Individual returns start from $180 (from $330 with rental or capital gains). Business, SMSF and advisory work is quoted up front in your engagement letter. Invoices are payable within 14 days.

Q: How do I book an appointment?
A: Reply to your client manager, call the office on (03) 9000 0000, or use the online booking link. We offer in-person, phone and Teams video meetings, Monday to Friday 9am–5pm.

Q: How can I check on the progress of my return or BAS?
A: Just ask your client manager for an update. Individual returns are usually completed within 5–10 business days of us receiving all your documents.

Q: Can you deal with the ATO for me?
A: Yes. Once you've signed our engagement letter and authority to act, we can liaise with the ATO on your behalf, including arranging payment plans where needed.
`,
};
