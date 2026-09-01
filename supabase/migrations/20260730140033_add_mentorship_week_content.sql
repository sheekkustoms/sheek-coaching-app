/*
# Add Mentorship Week Content (per-week editable content management)

1. Overview
   Migrates the hardcoded week-by-week curriculum content (game plans, deliverables,
   frameworks, formulas, checklists, pricing formulas, and the "Just Starting Out"
   adaptive Week 1 variant) from the MentorshipDashboard component into a database
   table so the admin can edit each week's written breakdown, attach a Vimeo video,
   and upload supporting PDF guides/worksheets — matching the Classroom content
   builder pattern.

2. New Table
   - `mentorship_week_content`
     - `week_number` (integer, 1–12, PRIMARY KEY) — identifies which week this content belongs to
     - `title` (text, not null) — the week's main title (e.g. "The Full")
     - `title_em` (text, not null) — the emphasized italic portion of the title (e.g. "Business Autopsy.")
     - `intro` (text, not null) — the week's intro paragraph
     - `body_html` (text, nullable) — rich HTML body containing the "What Sheek Reviews / You Will Leave With / Come Prepared With" lists, frameworks, formulas, extra cards, and the Just Starting Out variant for Week 1
     - `video_url` (text, nullable) — Vimeo embed URL for this week's video
     - `pdf_url` (text, nullable) — public URL to a PDF in the `mentorship-files` storage bucket
     - `deliverable_label` (text, not null) — label for the deliverable box
     - `deliverable_items` (jsonb, not null) — array of deliverable checklist item strings
     - `deliverable_submit_label` (text, not null) — label above the notes textarea
     - `deliverable_placeholder` (text, not null) — placeholder text for the notes textarea
     - `deliverable_btn_text` (text, not null) — submit button text
     - `updated_at` (timestamptz, default now())

3. New Storage Bucket
   - `mentorship-files` — public bucket for PDF guides/worksheets uploaded by admin.
     Same pattern as the existing `lesson-files` bucket used by Classroom.

4. Security (RLS)
   - Enable RLS on `mentorship_week_content`.
   - SELECT: only authenticated users whose profile tier is 'mentorship' OR who are admin.
   - INSERT / UPDATE / DELETE: only authenticated admin users.
   - Same EXISTS-subquery pattern used by `mentorship_videos`.

5. Data Migration
   - Inserts all 12 weeks of existing hardcoded content as initial rows.
   - The rich content (learn/do/get lists, frameworks, formulas, extra cards, and the
     Just Starting Out Week 1 variant) is stored as structured HTML in `body_html`.
   - Deliverable metadata is stored in the dedicated `deliverable_*` columns so the
     existing checklist/submit UI continues to work without changes.
*/

CREATE TABLE IF NOT EXISTS mentorship_week_content (
  week_number integer PRIMARY KEY CHECK (week_number >= 1 AND week_number <= 12),
  title text NOT NULL,
  title_em text NOT NULL,
  intro text NOT NULL,
  body_html text,
  video_url text,
  pdf_url text,
  deliverable_label text NOT NULL,
  deliverable_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  deliverable_submit_label text NOT NULL,
  deliverable_placeholder text NOT NULL,
  deliverable_btn_text text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mentorship_week_content ENABLE ROW LEVEL SECURITY;

-- SELECT: mentorship tier members + admins
DROP POLICY IF EXISTS "select_mentorship_week_content" ON mentorship_week_content;
CREATE POLICY "select_mentorship_week_content"
ON mentorship_week_content FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.tier = 'mentorship'
  )
);

-- INSERT: admin only
DROP POLICY IF EXISTS "insert_mentorship_week_content" ON mentorship_week_content;
CREATE POLICY "insert_mentorship_week_content"
ON mentorship_week_content FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- UPDATE: admin only
DROP POLICY IF EXISTS "update_mentorship_week_content" ON mentorship_week_content;
CREATE POLICY "update_mentorship_week_content"
ON mentorship_week_content FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- DELETE: admin only
DROP POLICY IF EXISTS "delete_mentorship_week_content" ON mentorship_week_content;
CREATE POLICY "delete_mentorship_week_content"
ON mentorship_week_content FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Storage bucket for mentorship PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('mentorship-files', 'mentorship-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: admin can upload, anyone can read (public bucket)
DROP POLICY IF EXISTS "mentorship_files_read" ON storage.objects;
CREATE POLICY "mentorship_files_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'mentorship-files');

DROP POLICY IF EXISTS "mentorship_files_upload" ON storage.objects;
CREATE POLICY "mentorship_files_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mentorship-files'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

DROP POLICY IF EXISTS "mentorship_files_update" ON storage.objects;
CREATE POLICY "mentorship_files_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'mentorship-files'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

DROP POLICY IF EXISTS "mentorship_files_delete" ON storage.objects;
CREATE POLICY "mentorship_files_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'mentorship-files'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================
-- DATA MIGRATION: Insert all 12 weeks of existing content
-- ============================================================

INSERT INTO mentorship_week_content (week_number, title, title_em, intro, body_html, deliverable_label, deliverable_items, deliverable_submit_label, deliverable_placeholder, deliverable_btn_text) VALUES

-- Week 1
(1, 'The Full', 'Business Autopsy.',
'This is the most important call of the entire program. Before we touch strategy, we look at everything — your products, your pricing, your content, your actual numbers. Come prepared. Come honest. Sheek will do the rest.',
'<div class="mw-section"><div class="mw-section-label">What Happens in This Session</div><div class="mw-three-col"><div><div class="mw-col-head">What Sheek Reviews</div><ul class="mw-list"><li><span class="mw-arrow">→</span>Your full product catalog and pricing</li><li><span class="mw-arrow">→</span>Your storefront listings and photography</li><li><span class="mw-arrow">→</span>Last 90 days of content performance</li><li><span class="mw-arrow">→</span>Your views-to-sales conversion rate</li><li><span class="mw-arrow">→</span>Customer retention and repeat purchase rate</li><li><span class="mw-arrow">→</span>Cost of goods vs. your actual take-home</li></ul></div><div><div class="mw-col-head">You Will Leave With</div><ul class="mw-list"><li><span class="mw-star">✦</span>Your Written Business Audit Document</li><li><span class="mw-star">✦</span>Your #1 revenue leak named</li><li><span class="mw-star">✦</span>Your biggest untapped opportunity identified</li><li><span class="mw-star">✦</span>Your 12-week priority roadmap</li><li><span class="mw-star">✦</span>Your personal income target set</li></ul></div><div><div class="mw-col-head">Come Prepared With</div><ul class="mw-list"><li><span class="mw-up">↗</span>Last 90 days of sales numbers</li><li><span class="mw-up">↗</span>Your Etsy/TikTok/site pulled up and ready</li><li><span class="mw-up">↗</span>Your cost of materials per product</li><li><span class="mw-up">↗</span>How long each product takes you to make</li><li><span class="mw-up">↗</span>Your current prices written down</li></ul></div></div></div><div class="mw-section"><div class="mw-section-label">How to Prepare</div><div class="mw-framework"><div class="mw-framework-title">Your Pre-Call Checklist</div><div class="mw-step"><span class="mw-step-num">1</span><span><strong>Pull your numbers</strong>Total sales last month. Total expenses last month. How many new customers vs. returning customers.</span></div><div class="mw-step"><span class="mw-step-num">2</span><span><strong>Write down your prices</strong>Every product you sell and what you currently charge for it. Be honest — don''t adjust before the call.</span></div><div class="mw-step"><span class="mw-step-num">3</span><span><strong>Know your costs</strong>What does each product cost you in materials? How long does it take to make? What do you charge per hour for your time — right now, honestly?</span></div><div class="mw-step"><span class="mw-step-num">4</span><span><strong>Have your shop open</strong>Etsy, TikTok Shop, website — whatever you sell on, have it up and ready. Sheek will look at it exactly as a customer would.</span></div><div class="mw-step"><span class="mw-step-num">5</span><span><strong>Write down your biggest frustration</strong>The one thing about your business that keeps you up at night. Be specific. Not "I''m not making enough money" — what specifically isn''t working?</span></div></div></div><div class="mw-divider">▼ Just Starting Out? Your Week 1 session is different ▼</div><div class="mw-section"><div class="mw-section-label"><span class="mw-rocket">🚀</span> Your First Session — Building From Zero</div><p class="mw-intro-p">You''re brand new — and that''s actually an advantage. No bad habits to unlearn. No underpriced listings to fix. We''re building this right from day one. No Etsy talk, no sales audits, no number-crunching. Just you, your craft, and a clear plan to get your first product in front of your first customer.</p><div class="mw-three-col"><div><div class="mw-col-head">What We''ll Figure Out</div><ul class="mw-list"><li><span class="mw-arrow">→</span>What you want to make and why</li><li><span class="mw-arrow">→</span>Who you''re going to sell to</li><li><span class="mw-arrow">→</span>What materials and tools you need</li><li><span class="mw-arrow">→</span>Where you''ll sell your first products</li><li><span class="mw-arrow">→</span>A simple pricing method for beginners</li><li><span class="mw-arrow">→</span>Your first 3 products to create</li></ul></div><div><div class="mw-col-head">You Will Leave With</div><ul class="mw-list"><li><span class="mw-star">✦</span>Your product idea validated</li><li><span class="mw-star">✦</span>Your first customer profile sketched out</li><li><span class="mw-star">✦</span>A materials and startup budget list</li><li><span class="mw-star">✦</span>Your selling platform chosen and set up</li><li><span class="mw-star">✦</span>Your first 3 products planned</li><li><span class="mw-star">✦</span>A 30-day action plan to your first sale</li></ul></div><div><div class="mw-col-head">Come Ready To Share</div><ul class="mw-list"><li><span class="mw-up">↗</span>What you love making (even if it''s a hobby right now)</li><li><span class="mw-up">↗</span>Photos of things you''ve already made</li><li><span class="mw-up">↗</span>Rough idea of who you''d want to buy from you</li><li><span class="mw-up">↗</span>Your budget for getting started</li><li><span class="mw-up">↗</span>How much time you have each week</li><li><span class="mw-up">↗</span>Any skills or experience you already have</li></ul></div></div></div><div class="mw-section"><div class="mw-section-label">Your Step-by-Step First Session</div><div class="mw-framework"><div class="mw-framework-title">From Zero to Your First Product Plan</div><div class="mw-step"><span class="mw-step-num">1</span><span><strong>What do you want to make?</strong>We''ll nail down your craft. Not 20 things — one thing you''re genuinely good at and excited to make. This becomes your starting product.</span></div><div class="mw-step"><span class="mw-step-num">2</span><span><strong>Who''s going to buy it?</strong>We''ll sketch your first customer. Not a full persona — just: who would want this, where do they hang out, and why would they choose you?</span></div><div class="mw-step"><span class="mw-step-num">3</span><span><strong>What do you need to make it?</strong>Materials, tools, workspace. We''ll list everything and put real numbers to it so you know your startup cost.</span></div><div class="mw-step"><span class="mw-step-num">4</span><span><strong>Where will you sell?</strong>We''ll pick your first platform — Instagram, Etsy, or a simple site. Just one. You can expand later. We''ll set it up together.</span></div><div class="mw-step"><span class="mw-step-num">5</span><span><strong>How much should you charge?</strong>Simple version: materials + your time + a profit margin. No complicated formulas. Just enough to make sure you''re not losing money on every sale.</span></div><div class="mw-step"><span class="mw-step-num">6</span><span><strong>Your 30-day plan</strong>We''ll map out the next 30 days — what to make, what to post, and how to get your first sale. One step at a time. No overwhelm.</span></div></div></div><div class="mw-section"><div class="mw-section-label">Simple Pricing for Your First Products</div><div class="mw-framework"><div class="mw-framework-title">The Beginner''s Price Formula</div><div class="mw-formula-cells"><div class="mw-formula-cell"><div class="mw-formula-label">Materials</div><div class="mw-formula-sub">What it costs you to make</div></div><span class="mw-plus">+</span><div class="mw-formula-cell"><div class="mw-formula-label">Your Time</div><div class="mw-formula-sub">Hours × at least $15/hr</div></div><span class="mw-plus">+</span><div class="mw-formula-cell"><div class="mw-formula-label">Profit</div><div class="mw-formula-sub">Add 30% on top</div></div></div><div class="mw-formula-result"><div class="mw-formula-result-label">= Your First Price</div><div class="mw-formula-result-val">Don''t undercharge from day one. You deserve to get paid.</div></div><p class="mw-formula-note"><em>This is the simple version. Once you''re up and running, we''ll get into the full True Cost Formula in later weeks. For now, just make sure you''re covering materials, paying yourself something, and building in profit.</em></p></div></div>',
'Week 1 Deliverable — Due Before Week 2 Group Call',
'["Review and sign off on your Business Audit Document (Sheek sends after your 1:1)","Write down 3 things that surprised you from the audit","Confirm your 12-week income target by replying to Sheek''s email"]'::jsonb,
'Notes / Questions for Week 2 (optional)',
'Anything from your audit you want to dig into more next session...',
'Submit'),

-- Week 2
(2, 'The Pricing', 'Truth Session.',
'You''re undercharging. We''re going to prove it with math, fix it with a framework you keep forever, and make sure you have the exact words to hold your price when a customer pushes back. No more folding.',
'<div class="mw-section"><div class="mw-section-label">What Happens in This Session</div><div class="mw-three-col"><div><div class="mw-col-head">What Sheek Reviews</div><ul class="mw-list"><li><span class="mw-arrow">→</span>The True Cost Formula — the complete version, not YouTube''s version</li><li><span class="mw-arrow">→</span>Value-based pricing vs. cost-based pricing and why it matters</li><li><span class="mw-arrow">→</span>How to read your market without racing to the bottom</li><li><span class="mw-arrow">→</span>Why "too expensive" is a positioning problem — not a price problem</li><li><span class="mw-arrow">→</span>Platform-specific pricing strategy per channel</li></ul></div><div><div class="mw-col-head">You Will Leave With</div><ul class="mw-list"><li><span class="mw-star">✦</span>Recalculate every single product you sell — live</li><li><span class="mw-star">✦</span>Identify your 3 highest-margin offers</li><li><span class="mw-star">✦</span>Set your new minimum order value</li><li><span class="mw-star">✦</span>Draft your price increase announcement</li></ul></div><div><div class="mw-col-head">Come Prepared With</div><ul class="mw-list"><li><span class="mw-up">↗</span>Recalculated pricing sheet for all products</li><li><span class="mw-up">↗</span>3 objection-handling scripts</li><li><span class="mw-up">↗</span>Price increase announcement (email + social)</li><li><span class="mw-up">↗</span>Custom order pricing script</li><li><span class="mw-up">↗</span>Bundle upsell script</li></ul></div></div></div><div class="mw-section"><div class="mw-section-label">The True Cost Formula</div><div class="mw-framework"><div class="mw-framework-title">How to Price Every Product You Make</div><div class="mw-formula-cells"><div class="mw-formula-cell"><div class="mw-formula-label">Materials</div><div class="mw-formula-sub">Every supply used, down to the thread</div></div><span class="mw-plus">+</span><div class="mw-formula-cell"><div class="mw-formula-label">Labor</div><div class="mw-formula-sub">Your hourly rate × time to make</div></div><span class="mw-plus">+</span><div class="mw-formula-cell"><div class="mw-formula-label">Overhead</div><div class="mw-formula-sub">Equipment, packaging, fees, shipping supplies</div></div><span class="mw-plus">+</span><div class="mw-formula-cell"><div class="mw-formula-label">Profit Margin</div><div class="mw-formula-sub">At least 30% on top — this is your business income</div></div><span class="mw-plus">+</span><div class="mw-formula-cell"><div class="mw-formula-label">Expertise Premium</div><div class="mw-formula-sub">Your years, skill, and reputation — this is real and it costs</div></div></div><div class="mw-formula-result"><div class="mw-formula-result-label">= Your Real Price</div><div class="mw-formula-result-val">If any of these are zero — you are losing money.</div></div><p class="mw-formula-note"><em>Sheek''s Price Floor Rule: Your price must cover all five of these — always. The moment you start cutting corners on any one of them to compete on price, you''ve already lost. You are not Shein. You are a maker.</em></p></div></div><div class="mw-section"><div class="mw-section-label">When They Say "That''s Too Expensive"</div><div class="mw-framework"><div class="mw-framework-title">3 Responses — Pick the One That Fits</div><p class="mw-body-p">1. "You''re right — you can get it cheaper." Say it confidently. Then: "If price is the #1 priority, that''s the right call for you. But if you want something handmade with care that nobody else has — that''s what I make."<br><br>2. "Can you go lower if I order more?" "My prices are based on what it actually costs to make each piece well. Volume orders get priority in my queue — but the pricing doesn''t change, because the quality doesn''t change."<br><br>3. "I saw someone else doing it for less." "Different makers, different quality, different experience. I can only speak to what it costs me to make something I''m proud to put my name on."</p></div></div><div class="mw-section"><div class="mw-section-label">Your Pricing Worksheet</div><div class="mw-framework"><div class="mw-framework-title">Fill This Out for Every Product Before Next Session</div><p class="mw-body-p">For each product, calculate: Materials cost + (Hours × your hourly rate) + Overhead + 30% profit margin. Write the number down. Then write what you currently charge. The gap between those two numbers is your audit result.<br><br>Most students find they need to raise prices by 30–60%. That is normal. That is the point of this session.</p></div></div>',
'Week 2 Deliverables — Due Before Week 3 Group Call',
'["Recalculate every product using the True Cost Formula","Identify your 3 highest-margin products and write them down","Set your new minimum order value","Write your price increase announcement (email or social post)","Practice saying all 3 objection responses out loud — yes, actually out loud"]'::jsonb,
'Submit Your Recalculated Pricing Sheet or Notes',
'Paste your new pricing numbers here, or share any questions about the formula...',
'Submit to Sheek'),

-- Week 3
(3, 'Know Your', 'Buyer Cold.',
'You can''t sell to everyone. Trying to means you sell to nobody. This session builds your buyer profile so precisely you''ll feel like you''re reading her mind every time you write a caption.',
'<div class="mw-section"><div class="mw-section-label">What Happens in This Session</div><div class="mw-three-col"><div><div class="mw-col-head">What Sheek Reviews</div><ul class="mw-list"><li><span class="mw-arrow">→</span>How to build a buyer profile from your actual sales data</li><li><span class="mw-arrow">→</span>The 5 questions your customer asks before she buys</li><li><span class="mw-arrow">→</span>Pain points vs. desire points — which one converts</li><li><span class="mw-arrow">→</span>How to write in your customer''s voice, not yours</li></ul></div><div><div class="mw-col-head">You Will Leave With</div><ul class="mw-list"><li><span class="mw-star">✦</span>Complete the Sheek Customer Deep Dive worksheet</li><li><span class="mw-star">✦</span>Rewrite your top listing using buyer language</li><li><span class="mw-star">✦</span>Draft one post from your customer''s perspective</li><li><span class="mw-star">✦</span>Name your top 3 customer objections</li></ul></div><div><div class="mw-col-head">Come Prepared With</div><ul class="mw-list"><li><span class="mw-up">↗</span>Your Buyer Persona One-Pager</li><li><span class="mw-up">↗</span>Your listing rewritten using the formula</li><li><span class="mw-up">↗</span>20 content prompts written in your customer''s own words</li></ul></div></div></div><div class="mw-section"><div class="mw-section-label">How to Prepare</div><div class="mw-framework"><div class="mw-framework-title">Problem → Solution → Proof → CTA</div><div class="mw-step"><span class="mw-step-num">1</span><span><strong>Problem</strong>State the exact pain your customer feels. Not what your product does — what she''s frustrated by right now.</span></div><div class="mw-step"><span class="mw-step-num">2</span><span><strong>Solution</strong>Your product is the answer. Say it directly, not cleverly.</span></div><div class="mw-step"><span class="mw-step-num">3</span><span><strong>Proof</strong>Orders, reviews, years in business, returning customers. One real number is worth a thousand adjectives.</span></div><div class="mw-step"><span class="mw-step-num">4</span><span><strong>CTA</strong>Tell her exactly what to do next. "Link in bio." "Add to cart." "DM me your size." One action only.</span></div></div></div>',
'Week 3 Deliverables — Due Before Week 4',
'["Complete the Buyer Persona One-Pager worksheet","Rewrite your top listing using the Problem→Solution→Proof→CTA formula","Write 20 content prompts in your customer''s voice (not yours)"]'::jsonb,
'Paste your rewritten listing or buyer persona notes',
'Share your rewritten listing, your buyer persona, or questions about the framework...',
'Submit to Sheek'),

-- Week 4
(4, 'Build the', 'Offer Suite.',
'One product won''t build a business. We''re going to build a suite of offers at different price points so you have something for every buyer — from the browser to the splurger. By the end, you''ll never lose a sale because "I don''t have anything at that price."',
'<div class="mw-section"><div class="mw-section-label">What Happens in This Session</div><div class="mw-three-col"><div><div class="mw-col-head">What Sheek Reviews</div><ul class="mw-list"><li><span class="mw-arrow">→</span>The 3-tier offer architecture: entry, core, premium</li><li><span class="mw-arrow">→</span>How to build upsells without feeling salesy</li><li><span class="mw-arrow">→</span>Bundling strategies that increase average order value</li><li><span class="mw-arrow">→</span>When to retire or refresh underperforming products</li></ul></div><div><div class="mw-col-head">You Will Leave With</div><ul class="mw-list"><li><span class="mw-star">✦</span>Map your current offers to the 3-tier framework</li><li><span class="mw-star">✦</span>Design 2 new offers to fill gaps in your suite</li><li><span class="mw-star">✦</span>Create bundle pricing for your top 3 products</li><li><span class="mw-star">✦</span>Write product descriptions for each new offer</li></ul></div><div><div class="mw-col-head">Come Prepared With</div><ul class="mw-list"><li><span class="mw-up">↗</span>Your complete Offer Suite document</li><li><span class="mw-up">↗</span>Bundle pricing sheet</li><li><span class="mw-up">↗</span>Upsell sequence scripts</li><li><span class="mw-up">↗</span>Product refresh hit list</li></ul></div></div></div><div class="mw-section"><div class="mw-section-label">How to Prepare</div><div class="mw-framework"><div class="mw-framework-title">The 3-Tier Offer Architecture</div><div class="mw-step"><span class="mw-step-num">1</span><span><strong>Entry Offer ($15–40)</strong>Low-risk way to get a new customer through the door. Should be easy to make, easy to ship, and genuinely good — not junk. This is your handshake.</span></div><div class="mw-step"><span class="mw-step-num">2</span><span><strong>Core Offer ($50–150)</strong>Your bread and butter. The product you''re known for. This should be your highest-margin item and the one you''d be happy making 100 of.</span></div><div class="mw-step"><span class="mw-step-num">3</span><span><strong>Premium Offer ($200+)</strong>Your signature piece. Custom work, limited editions, or commissioned pieces. This is where your expertise premium lives. Most customers won''t buy this — but it makes your core offer look reasonable.</span></div></div></div>',
'Week 4 Deliverables — Due Before Week 5',
'["Map all current products to the 3-tier framework","Design 2 new offers to fill gaps","Create bundle pricing for your top 3 products","Write product descriptions for each new offer"]'::jsonb,
'Submit Your Offer Suite',
'Paste your offer suite map, bundle pricing, or questions...',
'Submit to Sheek'),

-- Week 5
(5, 'Content That', 'Sells.',
'Pretty pictures don''t pay the bills. This week, we''re building a content system that turns followers into buyers. You''ll leave with a month of content planned, written, and ready to post — content that actually converts.',
'<div class="mw-section"><div class="mw-section-label">What Happens in This Session</div><div class="mw-three-col"><div><div class="mw-col-head">What Sheek Reviews</div><ul class="mw-list"><li><span class="mw-arrow">→</span>The 4 content types that drive sales (not just likes)</li><li><span class="mw-arrow">→</span>How to write captions that sell without being pushy</li><li><span class="mw-arrow">→</span>The posting cadence that maximizes reach and conversion</li><li><span class="mw-arrow">→</span>How to repurpose one piece of content across 5 platforms</li></ul></div><div><div class="mw-col-head">You Will Leave With</div><ul class="mw-list"><li><span class="mw-star">✦</span>Build your 30-day content calendar</li><li><span class="mw-star">✦</span>Write 12 selling captions using the framework</li><li><span class="mw-star">✦</span>Plan 3 content shoots (batched, not daily)</li><li><span class="mw-star">✦</span>Create your brand content style guide</li></ul></div><div><div class="mw-col-head">Come Prepared With</div><ul class="mw-list"><li><span class="mw-up">↗</span>30-day content calendar (filled in)</li><li><span class="mw-up">↗</span>12 written captions ready to post</li><li><span class="mw-up">↗</span>Content shoot checklist</li><li><span class="mw-up">↗</span>Brand content style guide</li></ul></div></div></div><div class="mw-section"><div class="mw-section-label">How to Prepare</div><div class="mw-framework"><div class="mw-framework-title">The 4 Content Types That Sell</div><div class="mw-step"><span class="mw-step-num">1</span><span><strong>Educate</strong>Teach something useful. Show your process, your materials, your expertise. This builds trust and positions you as the expert.</span></div><div class="mw-step"><span class="mw-step-num">2</span><span><strong>Showcase</strong>Show the product in action. Customer photos, styling ideas, behind-the-scenes making. This helps people picture owning it.</span></div><div class="mw-step"><span class="mw-step-num">3</span><span><strong>Sell</strong>Direct offer. "This is available now. Here''s the price. Here''s the link." Clear, confident, no apology.</span></div><div class="mw-step"><span class="mw-step-num">4</span><span><strong>Connect</strong>Share your story, your why, your personality. This is why they buy from you instead of a stranger.</span></div></div></div>',
'Week 5 Deliverables — Due Before Week 6',
'["Build your 30-day content calendar","Write 12 selling captions using the 4-type framework","Plan 3 batched content shoots","Create your brand content style guide"]'::jsonb,
'Submit Your Content Calendar',
'Paste your content calendar, captions, or questions...',
'Submit to Sheek'),

-- Week 6
(6, 'Platform', 'Mastery.',
'Every platform has rules — and the makers who win aren''t breaking them, they''re using them. This week, we go deep on Etsy, TikTok Shop, Instagram, and your own site. You''ll know exactly what to post, where, and when.',
'<div class="mw-section"><div class="mw-section-label">What Happens in This Session</div><div class="mw-three-col"><div><div class="mw-col-head">What Sheek Reviews</div><ul class="mw-list"><li><span class="mw-arrow">→</span>Platform-specific SEO (Etsy tags, TikTok hooks, IG keywords)</li><li><span class="mw-arrow">→</span>Algorithm-friendly posting times and frequencies</li><li><span class="mw-arrow">→</span>How to optimize listings for search and conversion</li><li><span class="mw-arrow">→</span>Cross-platform strategy without duplicating work</li></ul></div><div><div class="mw-col-head">You Will Leave With</div><ul class="mw-list"><li><span class="mw-star">✦</span>Audit your top 3 listings per platform</li><li><span class="mw-star">✦</span>Rewrite your Etsy titles and tags for search</li><li><span class="mw-star">✦</span>Create a TikTok hook bank (15 hooks)</li><li><span class="mw-star">✦</span>Optimize your Instagram bio and highlights</li></ul></div><div><div class="mw-col-head">Come Prepared With</div><ul class="mw-list"><li><span class="mw-up">↗</span>Platform optimization checklist</li><li><span class="mw-up">↗</span>Rewritten Etsy listings (titles, tags, descriptions)</li><li><span class="mw-up">↗</span>TikTok hook bank</li><li><span class="mw-up">↗</span>Instagram bio and highlights overhaul</li></ul></div></div></div><div class="mw-section"><div class="mw-section-label">How to Prepare</div><div class="mw-framework"><div class="mw-framework-title">The Platform Priority Matrix</div><div class="mw-step"><span class="mw-step-num">1</span><span><strong>Identify your #1 platform</strong>Where do your sales actually come from? Not where you spend the most time — where the money is. That''s your primary platform.</span></div><div class="mw-step"><span class="mw-step-num">2</span><span><strong>Optimize it fully</strong>Spend 80% of your platform effort here. Perfect the listings, the posting cadence, the SEO. Become a master of this one channel first.</span></div><div class="mw-step"><span class="mw-step-num">3</span><span><strong>Repurpose to secondary platforms</strong>Take what works on your primary and adapt it — don''t start from scratch on every platform. 20% effort, 80% of the reach.</span></div></div></div>',
'Week 6 Deliverables — Due Before Week 7',
'["Audit your top 3 listings per platform","Rewrite Etsy titles and tags for search","Create a TikTok hook bank (15 hooks)","Optimize your Instagram bio and highlights"]'::jsonb,
'Submit Your Platform Optimizations',
'Paste your optimized listings, hook bank, or questions...',
'Submit to Sheek'),

-- Week 7
(7, 'The Repeat Customer', 'Machine.',
'A new customer is expensive. A repeat customer is profit. This week, we build the system that turns one-time buyers into loyal fans who come back again and again — and bring their friends.',
'<div class="mw-section"><div class="mw-section-label">What Happens in This Session</div><div class="mw-three-col"><div><div class="mw-col-head">What Sheek Reviews</div><ul class="mw-list"><li><span class="mw-arrow">→</span>The post-purchase follow-up sequence that doubles repeat rate</li><li><span class="mw-arrow">→</span>How to build an email list from your existing customers</li><li><span class="mw-arrow">→</span>Loyalty incentives that don''t eat your margin</li><li><span class="mw-arrow">→</span>The "surprise and delight" tactics that create superfans</li></ul></div><div><div class="mw-col-head">You Will Leave With</div><ul class="mw-list"><li><span class="mw-star">✦</span>Write your post-purchase email sequence (5 emails)</li><li><span class="mw-star">✦</span>Design a loyalty or repeat-buyer incentive</li><li><span class="mw-star">✦</span>Create your review request template</li><li><span class="mw-star">✦</span>Build your customer email list from past orders</li></ul></div><div><div class="mw-col-head">Come Prepared With</div><ul class="mw-list"><li><span class="mw-up">↗</span>5-email post-purchase sequence</li><li><span class="mw-up">↗</span>Loyalty incentive design</li><li><span class="mw-up">↗</span>Review request template</li><li><span class="mw-up">↗</span>Customer email list (exported and organized)</li></ul></div></div></div><div class="mw-section"><div class="mw-section-label">How to Prepare</div><div class="mw-framework"><div class="mw-framework-title">The Repeat Customer Timeline</div><div class="mw-step"><span class="mw-step-num">1</span><span><strong>Day 1: Thank You</strong>Immediate confirmation that feels personal, not automated. Include care instructions or a small bonus.</span></div><div class="mw-step"><span class="mw-step-num">2</span><span><strong>Day 7: Check-In</strong>"How''s it holding up?" Shows you care about the product after the sale, not just before.</span></div><div class="mw-step"><span class="mw-step-num">3</span><span><strong>Day 14: Review Request</strong>Ask for a review or photo. Make it easy. Offer a small incentive for their next purchase.</span></div><div class="mw-step"><span class="mw-step-num">4</span><span><strong>Day 30: Re-Engage</strong>New offer, seasonal update, or "thought of you" message. This is where most makers drop the ball.</span></div><div class="mw-step"><span class="mw-step-num">5</span><span><strong>Day 60+: Loyalty Loop</strong>Exclusive access, early drops, or VIP pricing for returning customers. Make them feel special for coming back.</span></div></div></div>',
'Week 7 Deliverables — Due Before Week 8',
'["Write your 5-email post-purchase sequence","Design a loyalty or repeat-buyer incentive","Create your review request template","Export and organize your customer email list"]'::jsonb,
'Submit Your Repeat Customer System',
'Paste your email sequence, loyalty design, or questions...',
'Submit to Sheek'),

-- Week 8
(8, 'Sound Like', 'Nobody Else.',
'If your captions could be written by any maker, they''re not yours yet. This week, we find your voice — the specific, unmistakable way you talk about your work that makes people feel like they know you before they ever buy.',
'<div class="mw-section"><div class="mw-section-label">What Happens in This Session</div><div class="mw-three-col"><div><div class="mw-col-head">What Sheek Reviews</div><ul class="mw-list"><li><span class="mw-arrow">→</span>How to identify your brand voice (and stop sounding like everyone else)</li><li><span class="mw-arrow">→</span>The 5 voice dimensions: formal/casual, serious/funny, respectful/irreverent, matter-of-fact/emotional, literal/figurative</li><li><span class="mw-arrow">→</span>Writing in a voice that scales — from DMs to product descriptions</li><li><span class="mw-arrow">→</span>How to maintain voice consistency across platforms</li></ul></div><div><div class="mw-col-head">You Will Leave With</div><ul class="mw-list"><li><span class="mw-star">✦</span>Complete the Brand Voice Finder worksheet</li><li><span class="mw-star">✦</span>Rewrite 5 old captions in your new voice</li><li><span class="mw-star">✦</span>Create a voice style guide for future reference</li><li><span class="mw-star">✦</span>Write your brand "elevator pitch" in your voice</li></ul></div><div><div class="mw-col-head">Come Prepared With</div><ul class="mw-list"><li><span class="mw-up">↗</span>Your Brand Voice Style Guide</li><li><span class="mw-up">↗</span>5 rewritten captions in your voice</li><li><span class="mw-up">↗</span>Brand elevator pitch</li><li><span class="mw-up">↗</span>Voice do''s and don''ts cheat sheet</li></ul></div></div></div><div class="mw-section"><div class="mw-section-label">How to Prepare</div><div class="mw-framework"><div class="mw-framework-title">The Voice Discovery Process</div><div class="mw-step"><span class="mw-step-num">1</span><span><strong>List 5 brands you love</strong>Not competitors — brands whose voice you admire. What do they have in common? That''s a clue to your natural voice.</span></div><div class="mw-step"><span class="mw-step-num">2</span><span><strong>Record yourself talking about your work</strong>Speak, don''t write. Your natural speaking voice is your brand voice. Transcribe it and find the patterns.</span></div><div class="mw-step"><span class="mw-step-num">3</span><span><strong>Identify your 3 voice words</strong>Are you warm? Witty? Direct? Luxurious? Pick 3 words that describe how you want to sound. Everything you write should pass this test.</span></div><div class="mw-step"><span class="mw-step-num">4</span><span><strong>Write the "swipe file" of your voice</strong>10 sentences that sound definitively like you. Use these as templates for every caption, email, and listing going forward.</span></div></div></div>',
'Week 8 Deliverables — Due Before Week 9',
'["Complete the Brand Voice Finder worksheet","Rewrite 5 old captions in your new voice","Create your Voice Style Guide","Write your brand elevator pitch in your voice"]'::jsonb,
'Submit Your Brand Voice Guide',
'Paste your voice guide, rewritten captions, or questions...',
'Submit to Sheek'),

-- Week 9
(9, 'Become the Name', 'They Know.',
'There''s a difference between "someone who sells candles" and "the candle person." This week is about positioning — making sure that when people think of your craft, they think of you. We''ll build your authority platform.',
'<div class="mw-section"><div class="mw-section-label">What Happens in This Session</div><div class="mw-three-col"><div><div class="mw-col-head">What Sheek Reviews</div><ul class="mw-list"><li><span class="mw-arrow">→</span>The 3 pillars of authority positioning</li><li><span class="mw-arrow">→</span>How to become the go-to person in your niche</li><li><span class="mw-arrow">→</span>Collaboration and PR strategy for makers</li><li><span class="mw-arrow">→</span>Building a body of work that establishes expertise</li></ul></div><div><div class="mw-col-head">You Will Leave With</div><ul class="mw-list"><li><span class="mw-star">✦</span>Define your 3 authority pillars</li><li><span class="mw-star">✦</span>Write your positioning statement</li><li><span class="mw-star">✦</span>Identify 5 collaboration or PR opportunities</li><li><span class="mw-star">✦</span>Plan your first "signature piece" of content</li></ul></div><div><div class="mw-col-head">Come Prepared With</div><ul class="mw-list"><li><span class="mw-up">↗</span>Your Authority Positioning document</li><li><span class="mw-up">↗</span>Positioning statement for bio/about pages</li><li><span class="mw-up">↗</span>Collaboration outreach list</li><li><span class="mw-up">↗</span>Signature content plan</li></ul></div></div></div><div class="mw-section"><div class="mw-section-label">How to Prepare</div><div class="mw-framework"><div class="mw-framework-title">The 3 Pillars of Authority</div><div class="mw-step"><span class="mw-step-num">1</span><span><strong>Teach What You Know</strong>Share your expertise freely. Tutorials, tips, process videos. The more you teach, the more people see you as the expert.</span></div><div class="mw-step"><span class="mw-step-num">2</span><span><strong>Show Your Work</strong>Document your making process. People buy from makers they see as craftspeople, not factories. Transparency builds authority.</span></div><div class="mw-step"><span class="mw-step-num">3</span><span><strong>Get Mentioned</strong>Features, collaborations, customer spotlights. When others talk about you, it''s more powerful than when you talk about you.</span></div></div></div>',
'Week 9 Deliverables — Due Before Week 10',
'["Define your 3 authority pillars","Write your positioning statement","Identify 5 collaboration or PR opportunities","Plan your first signature piece of content"]'::jsonb,
'Submit Your Authority Positioning',
'Paste your positioning doc, collaboration list, or questions...',
'Submit to Sheek'),

-- Week 10
(10, 'Build the', 'Launch Machine.',
'A launch isn''t "putting something up for sale." It''s a campaign. This week, we build the machine — the timeline, the content, the emails, the urgency — that turns a product drop into an event your audience can''t ignore.',
'<div class="mw-section"><div class="mw-section-label">What Happens in This Session</div><div class="mw-three-col"><div><div class="mw-col-head">What Sheek Reviews</div><ul class="mw-list"><li><span class="mw-arrow">→</span>The 14-day launch timeline (tease, build, drop)</li><li><span class="mw-arrow">→</span>How to create genuine urgency without being manipulative</li><li><span class="mw-arrow">→</span>Email and content sequence for launch week</li><li><span class="mw-arrow">→</span>Pricing and scarcity strategy for drops and limited editions</li></ul></div><div><div class="mw-col-head">You Will Leave With</div><ul class="mw-list"><li><span class="mw-star">✦</span>Build your 14-day launch calendar</li><li><span class="mw-star">✦</span>Write your launch email sequence (7 emails)</li><li><span class="mw-star">✦</span>Create your launch content plan (tease, reveal, push)</li><li><span class="mw-star">✦</span>Set your launch pricing and quantity limits</li></ul></div><div><div class="mw-col-head">Come Prepared With</div><ul class="mw-list"><li><span class="mw-up">↗</span>14-day launch calendar</li><li><span class="mw-up">↗</span>7-email launch sequence</li><li><span class="mw-up">↗</span>Launch content plan</li><li><span class="mw-up">↗</span>Pricing and scarcity strategy</li></ul></div></div></div><div class="mw-section"><div class="mw-section-label">How to Prepare</div><div class="mw-framework"><div class="mw-framework-title">The 14-Day Launch Timeline</div><div class="mw-step"><span class="mw-step-num">1</span><span><strong>Days 1–5: Tease</strong>Hints, behind-the-scenes, "something''s coming." Build curiosity without revealing the product. Get people asking.</span></div><div class="mw-step"><span class="mw-step-num">2</span><span><strong>Days 6–9: Reveal</strong>Show the product. Tell the story. Explain why it matters. Build desire before you ask for the sale.</span></div><div class="mw-step"><span class="mw-step-num">3</span><span><strong>Days 10–13: Build</strong>Social proof, countdowns, "only X left." Make the urgency real — limited quantity, limited time, or both.</span></div><div class="mw-step"><span class="mw-step-num">4</span><span><strong>Day 14: Drop</strong>Launch day. Clear CTA, easy checkout, celebration energy. Follow up with anyone who engaged but didn''t buy.</span></div></div></div>',
'Week 10 Deliverables — Due Before Launch Week',
'["Build your 14-day launch calendar","Write your 7-email launch sequence","Create your launch content plan","Set your launch pricing and quantity limits"]'::jsonb,
'Submit Your Launch Plan',
'Paste your launch calendar, email sequence, or questions...',
'Submit to Sheek'),

-- Week 11
(11, 'Launch Week —', 'For Real.',
'This is it. You''ve done the work for 10 weeks. Now you launch. This week is execution — posting, emailing, responding, selling. Sheek is on call for real-time support. No theory. Just the launch.',
'<div class="mw-section"><div class="mw-section-label">What Happens in This Session</div><div class="mw-three-col"><div><div class="mw-col-head">What Sheek Reviews</div><ul class="mw-list"><li><span class="mw-arrow">→</span>Day-by-day launch execution checklist</li><li><span class="mw-arrow">→</span>How to handle launch-day chaos (sold-outs, restocks, DMs)</li><li><span class="mw-arrow">→</span>Real-time adjustment strategy when things don''t go as planned</li><li><span class="mw-arrow">→</span>Post-launch follow-up to capture last-minute buyers</li></ul></div><div><div class="mw-col-head">You Will Leave With</div><ul class="mw-list"><li><span class="mw-star">✦</span>Execute your launch plan day by day</li><li><span class="mw-star">✦</span>Track sales and engagement in real time</li><li><span class="mw-star">✦</span>Respond to every DM and comment within 2 hours</li><li><span class="mw-star">✦</span>Document what worked and what didn''t</li></ul></div><div><div class="mw-col-head">Come Prepared With</div><ul class="mw-list"><li><span class="mw-up">↗</span>Daily launch execution checklist</li><li><span class="mw-up">↗</span>Real-time sales tracker</li><li><span class="mw-up">↗</span>DM and comment response templates</li><li><span class="mw-up">↗</span>Launch debrief template</li></ul></div></div></div><div class="mw-section"><div class="mw-section-label">How to Prepare</div><div class="mw-framework"><div class="mw-framework-title">Launch Week Daily Checklist</div><div class="mw-step"><span class="mw-step-num">1</span><span><strong>Day 1: The Drop</strong>Post launch content. Send launch email. Be present and responsive. Celebrate every sale publicly.</span></div><div class="mw-step"><span class="mw-step-num">2</span><span><strong>Day 2: Momentum</strong>Share early results. "Half gone already!" Post customer excitement. Keep energy high.</span></div><div class="mw-step"><span class="mw-step-num">3</span><span><strong>Day 3: Restock/Scarcity</strong>If selling out, announce restock timeline. If not, create a "last chance" push with genuine urgency.</span></div><div class="mw-step"><span class="mw-step-num">4</span><span><strong>Day 4: Social Proof</strong>Share customer photos, reviews, unboxing videos. Let your buyers sell for you.</span></div><div class="mw-step"><span class="mw-step-num">5</span><span><strong>Day 5: Final Call</strong>Last 24 hours. Clear, direct, no-apology "this closes tonight" messaging.</span></div><div class="mw-step"><span class="mw-step-num">6</span><span><strong>Day 6: Close + Thank</strong>Close the launch. Thank everyone — buyers and browsers. Set expectations for what''s next.</span></div><div class="mw-step"><span class="mw-step-num">7</span><span><strong>Day 7: Debrief</strong>Count the numbers. What worked? What didn''t? What will you change next time? Write it all down.</span></div></div></div>',
'Week 11 Deliverables — Launch Week Execution',
'["Execute your launch plan daily using the checklist","Track sales and engagement in real time","Respond to every DM and comment within 2 hours","Complete the launch debrief template by end of week"]'::jsonb,
'Submit Your Launch Results & Debrief',
'Share your launch numbers, what worked, what didn''t, and any questions...',
'Submit to Sheek'),

-- Week 12
(12, 'The', 'Debrief.',
'You did it. Twelve weeks. A new business. Now we look at everything — the numbers, the wins, the misses — and build the plan for what comes next. This isn''t the end. It''s the beginning of you running this like a CEO.',
'<div class="mw-section"><div class="mw-section-label">What Happens in This Session</div><div class="mw-three-col"><div><div class="mw-col-head">What Sheek Reviews</div><ul class="mw-list"><li><span class="mw-arrow">→</span>How to read your 12-week business results</li><li><span class="mw-arrow">→</span>Identifying your highest-leverage activities going forward</li><li><span class="mw-arrow">→</span>Building your 90-day post-program plan</li><li><span class="mw-arrow">→</span>How to maintain momentum without the cohort structure</li></ul></div><div><div class="mw-col-head">You Will Leave With</div><ul class="mw-list"><li><span class="mw-star">✦</span>Complete the 12-Week Business Debrief worksheet</li><li><span class="mw-star">✦</span>Calculate your total revenue growth and key metric changes</li><li><span class="mw-star">✦</span>Write your 90-day post-program action plan</li><li><span class="mw-star">✦</span>Identify your 3 biggest lessons from the program</li></ul></div><div><div class="mw-col-head">Come Prepared With</div><ul class="mw-list"><li><span class="mw-up">↗</span>Your 12-Week Business Debrief document</li><li><span class="mw-up">↗</span>90-day post-program action plan</li><li><span class="mw-up">↗</span>Key metrics dashboard (before vs. after)</li><li><span class="mw-up">↗</span>Your CEO operating rhythm template</li></ul></div></div></div><div class="mw-section"><div class="mw-section-label">How to Prepare</div><div class="mw-framework"><div class="mw-framework-title">The Debrief Framework</div><div class="mw-step"><span class="mw-step-num">1</span><span><strong>Revenue Check</strong>What was your monthly revenue before the program? What is it now? What drove the change? Be specific.</span></div><div class="mw-step"><span class="mw-step-num">2</span><span><strong>What Worked</strong>List the 3 things that had the biggest impact. Double down on these. Don''t chase new tactics — repeat what worked.</span></div><div class="mw-step"><span class="mw-step-num">3</span><span><strong>What Didn''t</strong>List the 2 things that flopped. Why? Was it the tactic or the execution? Decide: fix it or drop it.</span></div><div class="mw-step"><span class="mw-step-num">4</span><span><strong>The 90-Day Plan</strong>What are your top 3 priorities for the next 90 days? What weekly rhythm will keep you on track without the cohort?</span></div><div class="mw-step"><span class="mw-step-num">5</span><span><strong>Your CEO Rhythm</strong>Weekly: review numbers, plan content. Monthly: review pricing, audit offers. Quarterly: big-picture strategy check. This is how you run it like a business, not a hobby.</span></div></div></div>',
'Week 12 Deliverables — Your Final Debrief',
'["Complete the 12-Week Business Debrief worksheet","Calculate your total revenue growth and key metric changes","Write your 90-day post-program action plan","Identify your 3 biggest lessons from the program"]'::jsonb,
'Submit Your Final Debrief',
'Share your debrief, your numbers, your 90-day plan, and anything else you want Sheek to know...',
'Submit Final Debrief')

ON CONFLICT (week_number) DO NOTHING;