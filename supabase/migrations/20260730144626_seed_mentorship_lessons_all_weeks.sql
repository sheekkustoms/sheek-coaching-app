/*
# Seed mentorship_lessons for all 12 weeks

Each week is broken into 2-4 discrete, clickable lessons.
Every lesson has:
  - title, subtitle, lesson_type
  - figure_out[]  — "What We'll Figure Out" bullets
  - leave_with[]  — "You Will Leave With" bullets
  - come_ready[]  — "Come Ready to Share" prompts (nullable)
  - body_html     — optional rich content

Content is generic/universal — applies to any product type, any platform,
any business stage.  No Etsy-specific or category-specific language.

This migration is idempotent: it uses ON CONFLICT to avoid duplicate inserts
on re-run.  A unique constraint on (week_number, position) enforces this.
*/

-- Unique constraint for idempotent upsert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mentorship_lessons_week_pos_key'
  ) THEN
    ALTER TABLE mentorship_lessons ADD CONSTRAINT mentorship_lessons_week_pos_key UNIQUE (week_number, position);
  END IF;
END $$;

-- ================================================================
-- WEEK 1 — The Full Business Autopsy
-- ================================================================

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(1, 1,
 'Your First Session — Building From Zero',
 'A repeatable strategy anyone can follow to start from scratch',
 'strategy',
 ARRAY[
   'What you want to make and why',
   'Who you are going to sell to',
   'What materials and tools you need',
   'Where you will sell your first products',
   'A simple pricing method for beginners',
   'Your first 3 products to create'
 ],
 ARRAY[
   'Your product idea validated',
   'Your first customer profile sketched out',
   'A materials and startup budget list',
   'Your selling platform chosen and set up',
   'Your first 3 products planned',
   'A 30-day action plan to your first sale'
 ],
 ARRAY[
   'What you love making (even if it is a hobby right now)',
   'Photos of things you have already made',
   'Rough idea of who you would want to buy from you',
   'Your budget for getting started',
   'How much time you have each week',
   'Any skills or experience you already have'
 ],
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(1, 2,
 'The Full Business Audit',
 'Look at everything — your products, pricing, content, and actual numbers',
 'worksheet',
 ARRAY[
   'Your full product catalog and pricing',
   'Your storefront listings and photography',
   'Last 90 days of content performance',
   'Your views-to-sales conversion rate',
   'Customer retention and repeat purchase rate',
   'Cost of goods vs. your actual take-home'
 ],
 ARRAY[
   'Your Written Business Audit Document',
   'Your #1 revenue leak named',
   'Your biggest untapped opportunity identified',
   'Your 12-week priority roadmap',
   'Your personal income target set'
 ],
 ARRAY[
   'Last 90 days of sales numbers',
   'Your storefront pulled up and ready',
   'Your cost of materials per product',
   'How long each product takes you to make',
   'Your current prices written down'
 ],
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(1, 3,
 'Your Pre-Call Checklist',
 '5 steps to prepare so you get the most out of your first session',
 'worksheet',
 ARRAY[
   'How to pull your numbers before the call',
   'What to write down about your current prices',
   'How to calculate your true costs',
   'What to have open and ready on screen',
   'How to articulate your biggest frustration'
 ],
 ARRAY[
   'Your sales numbers from last month',
   'Every product price written down',
   'Your cost of materials per product',
   'Your storefront ready to review',
   'Your biggest frustration named specifically'
 ],
 NULL,
 '<div class="space-y-4"><div class="border-l-2 border-gold pl-4"><strong class="text-cream">1. Pull your numbers</strong><p class="text-cream-dim mt-1">Total sales last month. Total expenses last month. How many new customers vs. returning customers.</p></div><div class="border-l-2 border-gold pl-4"><strong class="text-cream">2. Write down your prices</strong><p class="text-cream-dim mt-1">Every product you sell and what you currently charge for it. Be honest — do not adjust before the call.</p></div><div class="border-l-2 border-gold pl-4"><strong class="text-cream">3. Know your costs</strong><p class="text-cream-dim mt-1">What does each product cost you in materials? How long does it take to make? What do you charge per hour for your time — right now, honestly?</p></div><div class="border-l-2 border-gold pl-4"><strong class="text-cream">4. Have your shop open</strong><p class="text-cream-dim mt-1">Whatever you sell on, have it up and ready. Your mentor will look at it exactly as a customer would.</p></div><div class="border-l-2 border-gold pl-4"><strong class="text-cream">5. Write down your biggest frustration</strong><p class="text-cream-dim mt-1">The one thing about your business that keeps you up at night. Be specific. Not "I am not making enough money" — what specifically is not working?</p></div></div>')
ON CONFLICT (week_number, position) DO NOTHING;

-- ================================================================
-- WEEK 2 — The Pricing Truth Session
-- ================================================================

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(2, 1,
 'The True Cost Formula',
 'The complete pricing framework — not the YouTube version',
 'strategy',
 ARRAY[
   'The True Cost Formula — every component explained',
   'Value-based pricing vs. cost-based pricing',
   'How to read your market without racing to the bottom',
   'Why "too expensive" is a positioning problem — not a price problem',
   'Platform-specific pricing strategy per channel'
 ],
 ARRAY[
   'The True Cost Formula memorized and understood',
   'Your 3 highest-margin offers identified',
   'Your new minimum order value set',
   'Your price increase announcement drafted'
 ],
 NULL,
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(2, 2,
 'The Pricing Formula Worksheet',
 'Calculate every product you sell — live',
 'worksheet',
 ARRAY[
   'Materials cost for each product',
   'Labor: your hourly rate times time to make',
   'Overhead: equipment, packaging, fees, shipping supplies',
   'Profit margin: at least 30% on top',
   'Expertise premium: your years, skill, and reputation'
 ],
 ARRAY[
   'Recalculated pricing sheet for all products',
   'The gap between current price and real price identified',
   'New prices set using the complete formula'
 ],
 ARRAY[
   'Your current prices for every product',
   'Cost of materials for each product',
   'Time it takes to make each product',
   'Your packaging and shipping costs'
 ],
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(2, 3,
 'Holding Your Price — Objection Scripts',
 'The exact words to use when a customer says "that is too expensive"',
 'strategy',
 ARRAY[
   'Why "too expensive" is about positioning, not price',
   '3 response scripts for different pushback scenarios',
   'How to say "you can get it cheaper" with confidence',
   'How to handle "can you go lower if I order more"',
   'How to respond to "I saw someone else doing it for less"'
 ],
 ARRAY[
   '3 objection-handling scripts memorized',
   'Confidence to hold your price without folding',
   'A custom order pricing script',
   'A bundle upsell script'
 ],
 NULL,
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

-- ================================================================
-- WEEK 3 — Know Your Buyer Cold
-- ================================================================

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(3, 1,
 'Building Your Buyer Profile',
 'Create a customer profile so precise you can read their mind',
 'strategy',
 ARRAY[
   'How to build a buyer profile from your actual sales data',
   'The 5 questions your customer asks before she buys',
   'Pain points vs. desire points — which one converts',
   'How to write in your customer voice, not yours'
 ],
 ARRAY[
   'Your Buyer Persona One-Pager completed',
   'Your top listing rewritten using buyer language',
   '20 content prompts written in your customer words'
 ],
 NULL,
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(3, 2,
 'The Problem-Solution-Proof-CTA Framework',
 'A repeatable formula for writing listings and captions that convert',
 'strategy',
 ARRAY[
   'How to state the exact pain your customer feels',
   'How to present your product as the direct answer',
   'How to use proof (numbers, reviews, years) effectively',
   'How to write a clear, single-action call to action'
 ],
 ARRAY[
   'The 4-step framework memorized',
   'Your top listing rewritten using the formula',
   'A template you can reuse for every future listing'
 ],
 NULL,
 '<div class="space-y-4"><div class="border-l-2 border-gold pl-4"><strong class="text-cream">1. Problem</strong><p class="text-cream-dim mt-1">State the exact pain your customer feels. Not what your product does — what she is frustrated by right now.</p></div><div class="border-l-2 border-gold pl-4"><strong class="text-cream">2. Solution</strong><p class="text-cream-dim mt-1">Your product is the answer. Say it directly, not cleverly.</p></div><div class="border-l-2 border-gold pl-4"><strong class="text-cream">3. Proof</strong><p class="text-cream-dim mt-1">Orders, reviews, years in business, returning customers. One real number is worth a thousand adjectives.</p></div><div class="border-l-2 border-gold pl-4"><strong class="text-cream">4. CTA</strong><p class="text-cream-dim mt-1">Tell her exactly what to do next. "Link in bio." "Add to cart." "DM me your size." One action only.</p></div></div>')
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(3, 3,
 'The Customer Deep Dive Worksheet',
 'Fill this out to complete your buyer persona',
 'worksheet',
 ARRAY[
   'Who is your ideal customer — age, lifestyle, values',
   'What problem are they solving when they buy from you',
   'What are they willing to spend and why',
   'Where do they discover new products',
   'What objections do they have before buying'
 ],
 ARRAY[
   'Your Buyer Persona One-Pager completed',
   'Your top 3 customer objections named',
   'One post drafted from your customer perspective'
 ],
 NULL,
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

-- ================================================================
-- WEEK 4 — Build the Offer Suite
-- ================================================================

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(4, 1,
 'The 3-Tier Offer Architecture',
 'Entry, Core, Premium — a suite for every buyer',
 'strategy',
 ARRAY[
   'The 3-tier offer architecture: entry, core, premium',
   'How to build upsells without feeling salesy',
   'Bundling strategies that increase average order value',
   'When to retire or refresh underperforming products'
 ],
 ARRAY[
   'Your complete Offer Suite document',
   'Bundle pricing sheet',
   'Upsell sequence scripts',
   'Product refresh hit list'
 ],
 NULL,
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(4, 2,
 'Designing Your Offer Suite',
 'Map your current products and fill the gaps',
 'worksheet',
 ARRAY[
   'How to map current offers to the 3-tier framework',
   'How to identify gaps in your product lineup',
   'How to design 2 new offers that fill those gaps',
   'How to create bundle pricing for your top 3 products'
 ],
 ARRAY[
   'All current products mapped to 3 tiers',
   '2 new offers designed to fill gaps',
   'Bundle pricing created for top 3 products',
   'Product descriptions written for each new offer'
 ],
 ARRAY[
   'Your full product list with current prices',
   'Your cost per product',
   'Your best-selling products identified',
   'Products that have not sold in 90 days'
 ],
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

-- ================================================================
-- WEEK 5 — Content That Sells
-- ================================================================

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(5, 1,
 'The 4 Content Types That Sell',
 'Educate, Showcase, Sell, Connect — not just likes',
 'strategy',
 ARRAY[
   'The 4 content types that drive sales (not just likes)',
   'How to write captions that sell without being pushy',
   'The posting cadence that maximizes reach and conversion',
   'How to repurpose one piece of content across 5 platforms'
 ],
 ARRAY[
   'The 4 content types understood and memorized',
   'A content system that turns followers into buyers',
   'A reusable framework for every post you write'
 ],
 NULL,
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(5, 2,
 'Your 30-Day Content Calendar',
 'Plan, write, and schedule a full month of selling content',
 'worksheet',
 ARRAY[
   'How to build a 30-day content calendar',
   'How to write 12 selling captions using the framework',
   'How to plan 3 batched content shoots',
   'How to create your brand content style guide'
 ],
 ARRAY[
   '30-day content calendar filled in',
   '12 written captions ready to post',
   'Content shoot checklist',
   'Brand content style guide'
 ],
 ARRAY[
   'Your current posting schedule',
   'Your best-performing posts from last month',
   'Photos or video of your products ready to use',
   'Your brand colors and fonts'
 ],
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

-- ================================================================
-- WEEK 6 — Platform Mastery
-- ================================================================

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(6, 1,
 'The Platform Priority Matrix',
 'Pick your #1 platform and master it before spreading out',
 'strategy',
 ARRAY[
   'How to identify which platform your sales actually come from',
   'Platform-specific SEO and search optimization',
   'Algorithm-friendly posting times and frequencies',
   'How to optimize listings for search and conversion',
   'Cross-platform strategy without duplicating work'
 ],
 ARRAY[
   'Platform optimization checklist',
   'Your #1 platform identified and prioritized',
   'A repurposing strategy for secondary platforms'
 ],
 NULL,
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(6, 2,
 'Platform Optimization Worksheet',
 'Audit and rewrite your listings for search and conversion',
 'worksheet',
 ARRAY[
   'How to audit your top 3 listings per platform',
   'How to rewrite titles and tags for search',
   'How to create a hook bank for short-form video',
   'How to optimize your profile bio and highlights'
 ],
 ARRAY[
   'Top 3 listings audited per platform',
   'Titles and tags rewritten for search',
   'A 15-hook bank for short-form video',
   'Profile bio and highlights overhauled'
 ],
 ARRAY[
   'Links to your storefront on each platform',
   'Your current top 3 listings identified',
   'Your current profile bio text'
 ],
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

-- ================================================================
-- WEEK 7 — The Repeat Customer Machine
-- ================================================================

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(7, 1,
 'The Repeat Customer Timeline',
 'Turn one-time buyers into loyal fans who bring friends',
 'strategy',
 ARRAY[
   'The post-purchase follow-up sequence that doubles repeat rate',
   'How to build an email list from your existing customers',
   'Loyalty incentives that do not eat your margin',
   'The surprise and delight tactics that create superfans'
 ],
 ARRAY[
   'A repeat customer system designed',
   'A follow-up timeline mapped out',
   'A loyalty incentive designed'
 ],
 NULL,
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(7, 2,
 'Your Post-Purchase Email Sequence',
 'Write the 5 emails that turn buyers into repeat customers',
 'worksheet',
 ARRAY[
   'Day 1: The thank you that feels personal',
   'Day 7: The check-in that shows you care',
   'Day 14: The review request that is easy to say yes to',
   'Day 30: The re-engage message most makers skip',
   'Day 60+: The loyalty loop that makes them feel special'
 ],
 ARRAY[
   '5-email post-purchase sequence written',
   'Review request template created',
   'Customer email list exported and organized'
 ],
 ARRAY[
   'Your past customer emails or order data',
   'Any current follow-up emails you send',
   'Your repeat purchase rate if you know it'
 ],
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

-- ================================================================
-- WEEK 8 — Sound Like Nobody Else
-- ================================================================

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(8, 1,
 'Finding Your Brand Voice',
 'Stop sounding like every other maker — find your unmistakable voice',
 'strategy',
 ARRAY[
   'How to identify your brand voice',
   'The 5 voice dimensions: formal/casual, serious/funny, respectful/irreverent, matter-of-fact/emotional, literal/figurative',
   'Writing in a voice that scales — from DMs to product descriptions',
   'How to maintain voice consistency across platforms'
 ],
 ARRAY[
   'Your Brand Voice Style Guide',
   '5 rewritten captions in your new voice',
   'Brand elevator pitch written',
   'Voice dos and do-nots cheat sheet'
 ],
 NULL,
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(8, 2,
 'The Voice Discovery Worksheet',
 'A 4-step process to uncover your natural brand voice',
 'worksheet',
 ARRAY[
   'How to list 5 brands whose voice you admire — and find the pattern',
   'How to record yourself talking about your work and transcribe it',
   'How to identify your 3 voice words',
   'How to build a swipe file of 10 sentences that sound like you'
 ],
 ARRAY[
   'Your 3 voice words chosen',
   'A swipe file of 10 brand-voice sentences',
   '5 old captions rewritten in your new voice'
 ],
 ARRAY[
   '5 brands whose voice you love',
   'A voice memo of you talking about your work',
   '5 of your old captions to rewrite'
 ],
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

-- ================================================================
-- WEEK 9 — Become the Name They Know
-- ================================================================

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(9, 1,
 'The 3 Pillars of Authority',
 'Teach, Show, Get Mentioned — become the go-to person in your niche',
 'strategy',
 ARRAY[
   'The 3 pillars of authority positioning',
   'How to become the go-to person in your niche',
   'Collaboration and PR strategy for makers',
   'Building a body of work that establishes expertise'
 ],
 ARRAY[
   'Your Authority Positioning document',
   'Positioning statement for bio and about pages',
   'Collaboration outreach list',
   'Signature content plan'
 ],
 NULL,
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(9, 2,
 'Your Authority Positioning Worksheet',
 'Define your pillars, write your statement, plan your outreach',
 'worksheet',
 ARRAY[
   'How to define your 3 authority pillars',
   'How to write a positioning statement',
   'How to identify 5 collaboration or PR opportunities',
   'How to plan your first signature piece of content'
 ],
 ARRAY[
   '3 authority pillars defined',
   'Positioning statement written',
   '5 collaboration opportunities identified',
   'Signature content piece planned'
 ],
 ARRAY[
   'Your niche or craft category',
   'Brands or creators you would want to collaborate with',
   'Your most popular or proudest piece of content'
 ],
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

-- ================================================================
-- WEEK 10 — Build the Launch Machine
-- ================================================================

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(10, 1,
 'The 14-Day Launch Timeline',
 'Tease, Reveal, Build, Drop — a campaign, not a listing',
 'strategy',
 ARRAY[
   'The 14-day launch timeline (tease, build, drop)',
   'How to create genuine urgency without being manipulative',
   'Email and content sequence for launch week',
   'Pricing and scarcity strategy for drops and limited editions'
 ],
 ARRAY[
   '14-day launch calendar built',
   '7-email launch sequence written',
   'Launch content plan created',
   'Pricing and scarcity strategy set'
 ],
 NULL,
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(10, 2,
 'Your Launch Plan Worksheet',
 'Build the full campaign — calendar, emails, content, pricing',
 'worksheet',
 ARRAY[
   'How to map your 14-day launch calendar day by day',
   'How to write a 7-email launch sequence',
   'How to create tease, reveal, and push content',
   'How to set launch pricing and quantity limits'
 ],
 ARRAY[
   '14-day launch calendar completed',
   '7-email launch sequence written',
   'Launch content plan finalized',
   'Pricing and quantity limits set'
 ],
 ARRAY[
   'The product you plan to launch',
   'Your current email list size',
   'Your past launch or sales data if any'
 ],
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

-- ================================================================
-- WEEK 11 — Launch Week — For Real
-- ================================================================

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(11, 1,
 'Launch Day Execution',
 'The drop, the momentum, the scarcity, the close',
 'strategy',
 ARRAY[
   'Day-by-day launch execution checklist',
   'How to handle launch-day chaos (sold-outs, restocks, DMs)',
   'Real-time adjustment strategy when things do not go as planned',
   'Post-launch follow-up to capture last-minute buyers'
 ],
 ARRAY[
   'Daily launch execution checklist',
   'Real-time sales tracker',
   'DM and comment response templates',
   'Launch debrief template'
 ],
 NULL,
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(11, 2,
 'Your Daily Launch Checklist',
 'Execute day by day — post, email, respond, sell',
 'worksheet',
 ARRAY[
   'Day 1: The drop — post, email, be present, celebrate every sale',
   'Day 2: Momentum — share early results, post customer excitement',
   'Day 3: Restock or scarcity — announce timeline or last-chance push',
   'Day 4: Social proof — customer photos, reviews, unboxing videos',
   'Day 5: Final call — clear, direct, this closes tonight',
   'Day 6: Close and thank — set expectations for what is next',
   'Day 7: Debrief — count numbers, what worked, what did not'
 ],
 ARRAY[
   'Launch executed day by day',
   'Sales and engagement tracked in real time',
   'Every DM and comment responded to within 2 hours',
   'Launch debrief template completed'
 ],
 ARRAY[
   'Your launch plan from Week 10',
   'Your launch product inventory confirmed',
   'Your email sequence scheduled'
 ],
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

-- ================================================================
-- WEEK 12 — The Debrief
-- ================================================================

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(12, 1,
 'The 12-Week Business Debrief',
 'Look at everything — the numbers, the wins, the misses',
 'strategy',
 ARRAY[
   'How to read your 12-week business results',
   'Identifying your highest-leverage activities going forward',
   'Building your 90-day post-program plan',
   'How to maintain momentum without the cohort structure'
 ],
 ARRAY[
   'Your 12-Week Business Debrief document',
   '90-day post-program action plan',
   'Key metrics dashboard (before vs. after)',
   'Your CEO operating rhythm template'
 ],
 NULL,
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;

INSERT INTO mentorship_lessons (week_number, position, title, subtitle, lesson_type, figure_out, leave_with, come_ready, body_html)
VALUES
(12, 2,
 'Your 90-Day Post-Program Plan',
 'What happens after the cohort — your CEO operating rhythm',
 'worksheet',
 ARRAY[
   'What was your monthly revenue before the program vs. now',
   'What 3 things had the biggest impact — double down on these',
   'What 2 things flopped — fix it or drop it',
   'Your top 3 priorities for the next 90 days',
   'Your weekly, monthly, quarterly CEO rhythm'
 ],
 ARRAY[
   '12-Week Business Debrief worksheet completed',
   'Total revenue growth and key metric changes calculated',
   '90-day post-program action plan written',
   '3 biggest lessons from the program identified'
 ],
 ARRAY[
   'Your revenue numbers from before the program',
   'Your current revenue numbers',
   'Your launch results from Week 11',
   'Your biggest win and biggest miss from the program'
 ],
 NULL)
ON CONFLICT (week_number, position) DO NOTHING;
