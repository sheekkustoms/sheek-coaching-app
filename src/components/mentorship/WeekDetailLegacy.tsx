import { Lock, Check, Loader2, Sparkles, Store, Rocket } from 'lucide-react';
import type { MentorshipIntake, BusinessStage } from '@/lib/types';

interface WeekData {
  num: number;
  label: string;
  name: string;
  phase: string;
  sessionType: string;
  eyebrow: string;
  title: string;
  titleEm: string;
  intro: string;
  hasContent: boolean;
  content?: {
    learn: string[];
    do: string[];
    get: string[];
    framework?: { title: string; steps: { n: number; strong: string; body: string }[] };
    formula?: { cells: { label: string; sub: string }[]; resultLabel: string; resultVal: string; note: string };
    extraCards?: { label: string; title: string; body: string }[];
  };
  deliverable: {
    label: string;
    items: string[];
    submitLabel: string;
    placeholder: string;
    btnText: string;
  };
}

export const WEEKS: WeekData[] = [
  {
    num: 1, label: 'Week 1 · 1:1 Call', name: 'The Full Business Autopsy',
    phase: 'Phase 1 · Diagnose · Wks 1–3', sessionType: 'Private 1:1 Call',
    eyebrow: 'Week 1 · Private 1:1 Call · Phase 1: Diagnose',
    title: 'The Full', titleEm: 'Business Autopsy.',
    intro: 'This is the most important call of the entire program. Before we touch strategy, we look at everything — your products, your pricing, your content, your actual numbers. Come prepared. Come honest. Sheek will do the rest.',
    hasContent: true,
    content: {
      learn: ['Your full product catalog and pricing','Your storefront listings and photography','Last 90 days of content performance','Your views-to-sales conversion rate','Customer retention and repeat purchase rate','Cost of goods vs. your actual take-home'],
      do: ['Your Written Business Audit Document','Your #1 revenue leak named','Your biggest untapped opportunity identified','Your 12-week priority roadmap','Your personal income target set'],
      get: ['Last 90 days of sales numbers','Your Etsy/TikTok/site pulled up and ready','Your cost of materials per product','How long each product takes you to make','Your current prices written down'],
      framework: { title: 'Your Pre-Call Checklist', steps: [
        { n: 1, strong: 'Pull your numbers', body: 'Total sales last month. Total expenses last month. How many new customers vs. returning customers.' },
        { n: 2, strong: 'Write down your prices', body: 'Every product you sell and what you currently charge for it. Be honest — don\'t adjust before the call.' },
        { n: 3, strong: 'Know your costs', body: 'What does each product cost you in materials? How long does it take to make? What do you charge per hour for your time — right now, honestly?' },
        { n: 4, strong: 'Have your shop open', body: 'Etsy, TikTok Shop, website — whatever you sell on, have it up and ready. Sheek will look at it exactly as a customer would.' },
        { n: 5, strong: 'Write down your biggest frustration', body: 'The one thing about your business that keeps you up at night. Be specific. Not "I\'m not making enough money" — what specifically isn\'t working?' },
      ]},
    },
    deliverable: {
      label: 'Week 1 Deliverable — Due Before Week 2 Group Call',
      items: ['Review and sign off on your Business Audit Document (Sheek sends after your 1:1)','Write down 3 things that surprised you from the audit','Confirm your 12-week income target by replying to Sheek\'s email'],
      submitLabel: 'Notes / Questions for Week 2 (optional)',
      placeholder: 'Anything from your audit you want to dig into more next session...',
      btnText: 'Submit',
    },
  },
  {
    num: 2, label: 'Week 2 · Group Session', name: 'The Pricing Truth Session',
    phase: 'Phase 1 · Diagnose · Wks 1–3', sessionType: 'Group Session',
    eyebrow: 'Week 2 · Group Session · Phase 1: Diagnose',
    title: 'The Pricing', titleEm: 'Truth Session.',
    intro: 'You\'re undercharging. We\'re going to prove it with math, fix it with a framework you keep forever, and make sure you have the exact words to hold your price when a customer pushes back. No more folding.',
    hasContent: true,
    content: {
      learn: ['The True Cost Formula — the complete version, not YouTube\'s version','Value-based pricing vs. cost-based pricing and why it matters','How to read your market without racing to the bottom','Why "too expensive" is a positioning problem — not a price problem','Platform-specific pricing strategy per channel'],
      do: ['Recalculate every single product you sell — live','Identify your 3 highest-margin offers','Set your new minimum order value','Draft your price increase announcement'],
      get: ['Recalculated pricing sheet for all products','3 objection-handling scripts','Price increase announcement (email + social)','Custom order pricing script','Bundle upsell script'],
      formula: { cells: [
        { label: 'Materials', sub: 'Every supply used, down to the thread' },
        { label: 'Labor', sub: 'Your hourly rate × time to make' },
        { label: 'Overhead', sub: 'Equipment, packaging, fees, shipping supplies' },
        { label: 'Profit Margin', sub: 'At least 30% on top — this is your business income' },
        { label: 'Expertise Premium', sub: 'Your years, skill, and reputation — this is real and it costs' },
      ], resultLabel: '= Your Real Price', resultVal: 'If any of these are zero — you are losing money.', note: 'Sheek\'s Price Floor Rule: Your price must cover all five of these — always. The moment you start cutting corners on any one of them to compete on price, you\'ve already lost. You are not Shein. You are a maker.' },
      extraCards: [
        { label: 'When They Say "That\'s Too Expensive"', title: '3 Responses — Pick the One That Fits', body: '1. "You\'re right — you can get it cheaper." Say it confidently. Then: "If price is the #1 priority, that\'s the right call for you. But if you want something handmade with care that nobody else has — that\'s what I make."\n2. "Can you go lower if I order more?" "My prices are based on what it actually costs to make each piece well. Volume orders get priority in my queue — but the pricing doesn\'t change, because the quality doesn\'t change."\n3. "I saw someone else doing it for less." "Different makers, different quality, different experience. I can only speak to what it costs me to make something I\'m proud to put my name on."' },
        { label: 'Your Pricing Worksheet', title: 'Fill This Out for Every Product Before Next Session', body: 'For each product, calculate: Materials cost + (Hours × your hourly rate) + Overhead + 30% profit margin. Write the number down. Then write what you currently charge. The gap between those two numbers is your audit result.\n\nMost students find they need to raise prices by 30–60%. That is normal. That is the point of this session.' },
      ],
    },
    deliverable: {
      label: 'Week 2 Deliverables — Due Before Week 3 Group Call',
      items: ['Recalculate every product using the True Cost Formula','Identify your 3 highest-margin products and write them down','Set your new minimum order value','Write your price increase announcement (email or social post)','Practice saying all 3 objection responses out loud — yes, actually out loud'],
      submitLabel: 'Submit Your Recalculated Pricing Sheet or Notes',
      placeholder: 'Paste your new pricing numbers here, or share any questions about the formula...',
      btnText: 'Submit to Sheek',
    },
  },
  {
    num: 3, label: 'Week 3 · Group Session', name: 'Know Your Buyer Cold',
    phase: 'Phase 1 · Diagnose · Wks 1–3', sessionType: 'Group Session',
    eyebrow: 'Week 3 · Group Session · Phase 1: Diagnose',
    title: 'Know Your', titleEm: 'Buyer Cold.',
    intro: 'You can\'t sell to everyone. Trying to means you sell to nobody. This session builds your buyer profile so precisely you\'ll feel like you\'re reading her mind every time you write a caption.',
    hasContent: true,
    content: {
      learn: ['How to build a buyer profile from your actual sales data','The 5 questions your customer asks before she buys','Pain points vs. desire points — which one converts','How to write in your customer\'s voice, not yours'],
      do: ['Complete the Sheek Customer Deep Dive worksheet','Rewrite your top listing using buyer language','Draft one post from your customer\'s perspective','Name your top 3 customer objections'],
      get: ['Your Buyer Persona One-Pager','Your listing rewritten using the formula','20 content prompts written in your customer\'s own words'],
      framework: { title: 'Problem → Solution → Proof → CTA', steps: [
        { n: 1, strong: 'Problem', body: 'State the exact pain your customer feels. Not what your product does — what she\'s frustrated by right now.' },
        { n: 2, strong: 'Solution', body: 'Your product is the answer. Say it directly, not cleverly.' },
        { n: 3, strong: 'Proof', body: 'Orders, reviews, years in business, returning customers. One real number is worth a thousand adjectives.' },
        { n: 4, strong: 'CTA', body: 'Tell her exactly what to do next. "Link in bio." "Add to cart." "DM me your size." One action only.' },
      ]},
    },
    deliverable: {
      label: 'Week 3 Deliverables — Due Before Week 4',
      items: ['Complete the Buyer Persona One-Pager worksheet','Rewrite your top listing using the Problem→Solution→Proof→CTA formula','Write 20 content prompts in your customer\'s voice (not yours)'],
      submitLabel: 'Paste your rewritten listing or buyer persona notes',
      placeholder: 'Share your rewritten listing, your buyer persona, or questions about the framework...',
      btnText: 'Submit to Sheek',
    },
  },
  {
    num: 4, label: 'Week 4 · Group Session', name: 'Build the Offer Suite',
    phase: 'Phase 2 · Rebuild · Wks 4–6', sessionType: 'Group Session',
    eyebrow: 'Week 4 · Group Session · Phase 2: Rebuild',
    title: 'Build the', titleEm: 'Offer Suite.',
    intro: 'One product won\'t build a business. We\'re going to build a suite of offers at different price points so you have something for every buyer — from the browser to the splurger. By the end, you\'ll never lose a sale because "I don\'t have anything at that price."',
    hasContent: true,
    content: {
      learn: ['The 3-tier offer architecture: entry, core, premium','How to build upsells without feeling salesy','Bundling strategies that increase average order value','When to retire or refresh underperforming products'],
      do: ['Map your current offers to the 3-tier framework','Design 2 new offers to fill gaps in your suite','Create bundle pricing for your top 3 products','Write product descriptions for each new offer'],
      get: ['Your complete Offer Suite document','Bundle pricing sheet','Upsell sequence scripts','Product refresh hit list'],
      framework: { title: 'The 3-Tier Offer Architecture', steps: [
        { n: 1, strong: 'Entry Offer ($15–40)', body: 'Low-risk way to get a new customer through the door. Should be easy to make, easy to ship, and genuinely good — not junk. This is your handshake.' },
        { n: 2, strong: 'Core Offer ($50–150)', body: 'Your bread and butter. The product you\'re known for. This should be your highest-margin item and the one you\'d be happy making 100 of.' },
        { n: 3, strong: 'Premium Offer ($200+)', body: 'Your signature piece. Custom work, limited editions, or commissioned pieces. This is where your expertise premium lives. Most customers won\'t buy this — but it makes your core offer look reasonable.' },
      ]},
    },
    deliverable: {
      label: 'Week 4 Deliverables — Due Before Week 5',
      items: ['Map all current products to the 3-tier framework','Design 2 new offers to fill gaps','Create bundle pricing for your top 3 products','Write product descriptions for each new offer'],
      submitLabel: 'Submit Your Offer Suite',
      placeholder: 'Paste your offer suite map, bundle pricing, or questions...',
      btnText: 'Submit to Sheek',
    },
  },
  {
    num: 5, label: 'Week 5 · Group + 1:1', name: 'Content That Sells',
    phase: 'Phase 2 · Rebuild · Wks 4–6', sessionType: 'Group + 1:1',
    eyebrow: 'Week 5 · Group + 1:1 · Phase 2: Rebuild',
    title: 'Content That', titleEm: 'Sells.',
    intro: 'Pretty pictures don\'t pay the bills. This week, we\'re building a content system that turns followers into buyers. You\'ll leave with a month of content planned, written, and ready to post — content that actually converts.',
    hasContent: true,
    content: {
      learn: ['The 4 content types that drive sales (not just likes)','How to write captions that sell without being pushy','The posting cadence that maximizes reach and conversion','How to repurpose one piece of content across 5 platforms'],
      do: ['Build your 30-day content calendar','Write 12 selling captions using the framework','Plan 3 content shoots (batched, not daily)','Create your brand content style guide'],
      get: ['30-day content calendar (filled in)','12 written captions ready to post','Content shoot checklist','Brand content style guide'],
      framework: { title: 'The 4 Content Types That Sell', steps: [
        { n: 1, strong: 'Educate', body: 'Teach something useful. Show your process, your materials, your expertise. This builds trust and positions you as the expert.' },
        { n: 2, strong: 'Showcase', body: 'Show the product in action. Customer photos, styling ideas, behind-the-scenes making. This helps people picture owning it.' },
        { n: 3, strong: 'Sell', body: 'Direct offer. "This is available now. Here\'s the price. Here\'s the link." Clear, confident, no apology.' },
        { n: 4, strong: 'Connect', body: 'Share your story, your why, your personality. This is why they buy from you instead of a stranger.' },
      ]},
    },
    deliverable: {
      label: 'Week 5 Deliverables — Due Before Week 6',
      items: ['Build your 30-day content calendar','Write 12 selling captions using the 4-type framework','Plan 3 batched content shoots','Create your brand content style guide'],
      submitLabel: 'Submit Your Content Calendar',
      placeholder: 'Paste your content calendar, captions, or questions...',
      btnText: 'Submit to Sheek',
    },
  },
  {
    num: 6, label: 'Week 6 · Group Session', name: 'Platform Mastery',
    phase: 'Phase 2 · Rebuild · Wks 4–6', sessionType: 'Group Session',
    eyebrow: 'Week 6 · Group Session · Phase 2: Rebuild',
    title: 'Platform', titleEm: 'Mastery.',
    intro: 'Every platform has rules — and the makers who win aren\'t breaking them, they\'re using them. This week, we go deep on Etsy, TikTok Shop, Instagram, and your own site. You\'ll know exactly what to post, where, and when.',
    hasContent: true,
    content: {
      learn: ['Platform-specific SEO (Etsy tags, TikTok hooks, IG keywords)','Algorithm-friendly posting times and frequencies','How to optimize listings for search and conversion','Cross-platform strategy without duplicating work'],
      do: ['Audit your top 3 listings per platform','Rewrite your Etsy titles and tags for search','Create a TikTok hook bank (15 hooks)','Optimize your Instagram bio and highlights'],
      get: ['Platform optimization checklist','Rewritten Etsy listings (titles, tags, descriptions)','TikTok hook bank','Instagram bio and highlights overhaul'],
      framework: { title: 'The Platform Priority Matrix', steps: [
        { n: 1, strong: 'Identify your #1 platform', body: 'Where do your sales actually come from? Not where you spend the most time — where the money is. That\'s your primary platform.' },
        { n: 2, strong: 'Optimize it fully', body: 'Spend 80% of your platform effort here. Perfect the listings, the posting cadence, the SEO. Become a master of this one channel first.' },
        { n: 3, strong: 'Repurpose to secondary platforms', body: 'Take what works on your primary and adapt it — don\'t start from scratch on every platform. 20% effort, 80% of the reach.' },
      ]},
    },
    deliverable: {
      label: 'Week 6 Deliverables — Due Before Week 7',
      items: ['Audit your top 3 listings per platform','Rewrite Etsy titles and tags for search','Create a TikTok hook bank (15 hooks)','Optimize your Instagram bio and highlights'],
      submitLabel: 'Submit Your Platform Optimizations',
      placeholder: 'Paste your optimized listings, hook bank, or questions...',
      btnText: 'Submit to Sheek',
    },
  },
  {
    num: 7, label: 'Week 7 · Group Session', name: 'The Repeat Customer Machine',
    phase: 'Phase 3 · Position · Wks 7–9', sessionType: 'Group Session',
    eyebrow: 'Week 7 · Group Session · Phase 3: Position',
    title: 'The Repeat Customer', titleEm: 'Machine.',
    intro: 'A new customer is expensive. A repeat customer is profit. This week, we build the system that turns one-time buyers into loyal fans who come back again and again — and bring their friends.',
    hasContent: true,
    content: {
      learn: ['The post-purchase follow-up sequence that doubles repeat rate','How to build an email list from your existing customers','Loyalty incentives that don\'t eat your margin','The "surprise and delight" tactics that create superfans'],
      do: ['Write your post-purchase email sequence (5 emails)','Design a loyalty or repeat-buyer incentive','Create your review request template','Build your customer email list from past orders'],
      get: ['5-email post-purchase sequence','Loyalty incentive design','Review request template','Customer email list (exported and organized)'],
      framework: { title: 'The Repeat Customer Timeline', steps: [
        { n: 1, strong: 'Day 1: Thank You', body: 'Immediate confirmation that feels personal, not automated. Include care instructions or a small bonus.' },
        { n: 2, strong: 'Day 7: Check-In', body: ' "How\'s it holding up?" Shows you care about the product after the sale, not just before.' },
        { n: 3, strong: 'Day 14: Review Request', body: 'Ask for a review or photo. Make it easy. Offer a small incentive for their next purchase.' },
        { n: 4, strong: 'Day 30: Re-Engage', body: 'New offer, seasonal update, or "thought of you" message. This is where most makers drop the ball.' },
        { n: 5, strong: 'Day 60+: Loyalty Loop', body: 'Exclusive access, early drops, or VIP pricing for returning customers. Make them feel special for coming back.' },
      ]},
    },
    deliverable: {
      label: 'Week 7 Deliverables — Due Before Week 8',
      items: ['Write your 5-email post-purchase sequence','Design a loyalty or repeat-buyer incentive','Create your review request template','Export and organize your customer email list'],
      submitLabel: 'Submit Your Repeat Customer System',
      placeholder: 'Paste your email sequence, loyalty design, or questions...',
      btnText: 'Submit to Sheek',
    },
  },
  {
    num: 8, label: 'Week 8 · Group Session', name: 'Sound Like Nobody Else',
    phase: 'Phase 3 · Position · Wks 7–9', sessionType: 'Group Session',
    eyebrow: 'Week 8 · Group Session · Phase 3: Position',
    title: 'Sound Like', titleEm: 'Nobody Else.',
    intro: 'If your captions could be written by any maker, they\'re not yours yet. This week, we find your voice — the specific, unmistakable way you talk about your work that makes people feel like they know you before they ever buy.',
    hasContent: true,
    content: {
      learn: ['How to identify your brand voice (and stop sounding like everyone else)','The 5 voice dimensions: formal/casual, serious/funny, respectful/irreverent, matter-of-fact/emotional, literal/figurative','Writing in a voice that scales — from DMs to product descriptions','How to maintain voice consistency across platforms'],
      do: ['Complete the Brand Voice Finder worksheet','Rewrite 5 old captions in your new voice','Create a voice style guide for future reference','Write your brand "elevator pitch" in your voice'],
      get: ['Your Brand Voice Style Guide','5 rewritten captions in your voice','Brand elevator pitch','Voice do\'s and don\'ts cheat sheet'],
      framework: { title: 'The Voice Discovery Process', steps: [
        { n: 1, strong: 'List 5 brands you love', body: 'Not competitors — brands whose voice you admire. What do they have in common? That\'s a clue to your natural voice.' },
        { n: 2, strong: 'Record yourself talking about your work', body: 'Speak, don\'t write. Your natural speaking voice is your brand voice. Transcribe it and find the patterns.' },
        { n: 3, strong: 'Identify your 3 voice words', body: 'Are you warm? Witty? Direct? Luxurious? Pick 3 words that describe how you want to sound. Everything you write should pass this test.' },
        { n: 4, strong: 'Write the "swipe file" of your voice', body: '10 sentences that sound definitively like you. Use these as templates for every caption, email, and listing going forward.' },
      ]},
    },
    deliverable: {
      label: 'Week 8 Deliverables — Due Before Week 9',
      items: ['Complete the Brand Voice Finder worksheet','Rewrite 5 old captions in your new voice','Create your Voice Style Guide','Write your brand elevator pitch in your voice'],
      submitLabel: 'Submit Your Brand Voice Guide',
      placeholder: 'Paste your voice guide, rewritten captions, or questions...',
      btnText: 'Submit to Sheek',
    },
  },
  {
    num: 9, label: 'Week 9 · Group + 1:1', name: 'Become the Name They Know',
    phase: 'Phase 3 · Position · Wks 7–9', sessionType: 'Group + 1:1',
    eyebrow: 'Week 9 · Group + 1:1 · Phase 3: Position',
    title: 'Become the Name', titleEm: 'They Know.',
    intro: 'There\'s a difference between "someone who sells candles" and "the candle person." This week is about positioning — making sure that when people think of your craft, they think of you. We\'ll build your authority platform.',
    hasContent: true,
    content: {
      learn: ['The 3 pillars of authority positioning','How to become the go-to person in your niche','Collaboration and PR strategy for makers','Building a body of work that establishes expertise'],
      do: ['Define your 3 authority pillars','Write your positioning statement','Identify 5 collaboration or PR opportunities','Plan your first "signature piece" of content'],
      get: ['Your Authority Positioning document','Positioning statement for bio/about pages','Collaboration outreach list','Signature content plan'],
      framework: { title: 'The 3 Pillars of Authority', steps: [
        { n: 1, strong: 'Teach What You Know', body: 'Share your expertise freely. Tutorials, tips, process videos. The more you teach, the more people see you as the expert.' },
        { n: 2, strong: 'Show Your Work', body: 'Document your making process. People buy from makers they see as craftspeople, not factories. Transparency builds authority.' },
        { n: 3, strong: 'Get Mentioned', body: 'Features, collaborations, customer spotlights. When others talk about you, it\'s more powerful than when you talk about you.' },
      ]},
    },
    deliverable: {
      label: 'Week 9 Deliverables — Due Before Week 10',
      items: ['Define your 3 authority pillars','Write your positioning statement','Identify 5 collaboration or PR opportunities','Plan your first signature piece of content'],
      submitLabel: 'Submit Your Authority Positioning',
      placeholder: 'Paste your positioning doc, collaboration list, or questions...',
      btnText: 'Submit to Sheek',
    },
  },
  {
    num: 10, label: 'Week 10 · Group Session', name: 'Build the Launch Machine',
    phase: 'Phase 4 · Launch · Wks 10–12', sessionType: 'Group Session',
    eyebrow: 'Week 10 · Group Session · Phase 4: Launch',
    title: 'Build the', titleEm: 'Launch Machine.',
    intro: 'A launch isn\'t "putting something up for sale." It\'s a campaign. This week, we build the machine — the timeline, the content, the emails, the urgency — that turns a product drop into an event your audience can\'t ignore.',
    hasContent: true,
    content: {
      learn: ['The 14-day launch timeline (tease, build, drop)','How to create genuine urgency without being manipulative','Email and content sequence for launch week','Pricing and scarcity strategy for drops and limited editions'],
      do: ['Build your 14-day launch calendar','Write your launch email sequence (7 emails)','Create your launch content plan (tease, reveal, push)','Set your launch pricing and quantity limits'],
      get: ['14-day launch calendar','7-email launch sequence','Launch content plan','Pricing and scarcity strategy'],
      framework: { title: 'The 14-Day Launch Timeline', steps: [
        { n: 1, strong: 'Days 1–5: Tease', body: 'Hints, behind-the-scenes, "something\'s coming." Build curiosity without revealing the product. Get people asking.' },
        { n: 2, strong: 'Days 6–9: Reveal', body: 'Show the product. Tell the story. Explain why it matters. Build desire before you ask for the sale.' },
        { n: 3, strong: 'Days 10–13: Build', body: 'Social proof, countdowns, "only X left." Make the urgency real — limited quantity, limited time, or both.' },
        { n: 4, strong: 'Day 14: Drop', body: 'Launch day. Clear CTA, easy checkout, celebration energy. Follow up with anyone who engaged but didn\'t buy.' },
      ]},
    },
    deliverable: {
      label: 'Week 10 Deliverables — Due Before Launch Week',
      items: ['Build your 14-day launch calendar','Write your 7-email launch sequence','Create your launch content plan','Set your launch pricing and quantity limits'],
      submitLabel: 'Submit Your Launch Plan',
      placeholder: 'Paste your launch calendar, email sequence, or questions...',
      btnText: 'Submit to Sheek',
    },
  },
  {
    num: 11, label: 'Week 11 · Launch Week', name: 'Launch Week — For Real',
    phase: 'Phase 4 · Launch · Wks 10–12', sessionType: 'Launch Week',
    eyebrow: 'Week 11 · Launch Week · Phase 4: Launch',
    title: 'Launch Week —', titleEm: 'For Real.',
    intro: 'This is it. You\'ve done the work for 10 weeks. Now you launch. This week is execution — posting, emailing, responding, selling. Sheek is on call for real-time support. No theory. Just the launch.',
    hasContent: true,
    content: {
      learn: ['Day-by-day launch execution checklist','How to handle launch-day chaos (sold-outs, restocks, DMs)','Real-time adjustment strategy when things don\'t go as planned','Post-launch follow-up to capture last-minute buyers'],
      do: ['Execute your launch plan day by day','Track sales and engagement in real time','Respond to every DM and comment within 2 hours','Document what worked and what didn\'t'],
      get: ['Daily launch execution checklist','Real-time sales tracker','DM and comment response templates','Launch debrief template'],
      framework: { title: 'Launch Week Daily Checklist', steps: [
        { n: 1, strong: 'Day 1: The Drop', body: 'Post launch content. Send launch email. Be present and responsive. Celebrate every sale publicly.' },
        { n: 2, strong: 'Day 2: Momentum', body: 'Share early results. "Half gone already!" Post customer excitement. Keep energy high.' },
        { n: 3, strong: 'Day 3: Restock/Scarcity', body: 'If selling out, announce restock timeline. If not, create a "last chance" push with genuine urgency.' },
        { n: 4, strong: 'Day 4: Social Proof', body: 'Share customer photos, reviews, unboxing videos. Let your buyers sell for you.' },
        { n: 5, strong: 'Day 5: Final Call', body: 'Last 24 hours. Clear, direct, no-apology "this closes tonight" messaging.' },
        { n: 6, strong: 'Day 6: Close + Thank', body: 'Close the launch. Thank everyone — buyers and browsers. Set expectations for what\'s next.' },
        { n: 7, strong: 'Day 7: Debrief', body: 'Count the numbers. What worked? What didn\'t? What will you change next time? Write it all down.' },
      ]},
    },
    deliverable: {
      label: 'Week 11 Deliverables — Launch Week Execution',
      items: ['Execute your launch plan daily using the checklist','Track sales and engagement in real time','Respond to every DM and comment within 2 hours','Complete the launch debrief template by end of week'],
      submitLabel: 'Submit Your Launch Results & Debrief',
      placeholder: 'Share your launch numbers, what worked, what didn\'t, and any questions...',
      btnText: 'Submit to Sheek',
    },
  },
  {
    num: 12, label: 'Week 12 · Group + 1:1', name: 'The Debrief',
    phase: 'Phase 4 · Launch · Wks 10–12', sessionType: 'Group + 1:1',
    eyebrow: 'Week 12 · Group + 1:1 · Phase 4: Launch',
    title: 'The', titleEm: 'Debrief.',
    intro: 'You did it. Twelve weeks. A new business. Now we look at everything — the numbers, the wins, the misses — and build the plan for what comes next. This isn\'t the end. It\'s the beginning of you running this like a CEO.',
    hasContent: true,
    content: {
      learn: ['How to read your 12-week business results','Identifying your highest-leverage activities going forward','Building your 90-day post-program plan','How to maintain momentum without the cohort structure'],
      do: ['Complete the 12-Week Business Debrief worksheet','Calculate your total revenue growth and key metric changes','Write your 90-day post-program action plan','Identify your 3 biggest lessons from the program'],
      get: ['Your 12-Week Business Debrief document','90-day post-program action plan','Key metrics dashboard (before vs. after)','Your CEO operating rhythm template'],
      framework: { title: 'The Debrief Framework', steps: [
        { n: 1, strong: 'Revenue Check', body: 'What was your monthly revenue before the program? What is it now? What drove the change? Be specific.' },
        { n: 2, strong: 'What Worked', body: 'List the 3 things that had the biggest impact. Double down on these. Don\'t chase new tactics — repeat what worked.' },
        { n: 3, strong: 'What Didn\'t', body: 'List the 2 things that flopped. Why? Was it the tactic or the execution? Decide: fix it or drop it.' },
        { n: 4, strong: 'The 90-Day Plan', body: 'What are your top 3 priorities for the next 90 days? What weekly rhythm will keep you on track without the cohort?' },
        { n: 5, strong: 'Your CEO Rhythm', body: 'Weekly: review numbers, plan content. Monthly: review pricing, audit offers. Quarterly: big-picture strategy check. This is how you run it like a business, not a hobby.' },
      ]},
    },
    deliverable: {
      label: 'Week 12 Deliverables — Your Final Debrief',
      items: ['Complete the 12-Week Business Debrief worksheet','Calculate your total revenue growth and key metric changes','Write your 90-day post-program action plan','Identify your 3 biggest lessons from the program'],
      submitLabel: 'Submit Your Final Debrief',
      placeholder: 'Share your debrief, your numbers, your 90-day plan, and anything else you want Sheek to know...',
      btnText: 'Submit Final Debrief',
    },
  },
];

export const SESSION_NAMES = ['','The Full Business Autopsy','The Pricing Truth Session','Know Your Buyer Cold','Build the Offer Suite','Content That Sells','Platform Mastery','The Repeat Customer Machine','Sound Like Nobody Else','Become the Name They Know','Build the Launch Machine','Launch Week','The Debrief'];

interface WeekDetailLegacyProps {
  weekNum: number;
  isAdmin: boolean;
  intake: MentorshipIntake | null;
  checklists: Record<number, Record<string, boolean>>;
  notes: Record<number, string>;
  saving: boolean;
  submitFlash: number | null;
  completedSet: Set<number>;
  onToggleCheck: (weekNum: number, idx: number) => void;
  onSetNotes: (weekNum: number, text: string) => void;
  onSubmitDeliverable: (weekNum: number) => void;
  onCompleteWeek: (weekNum: number) => void;
  onSelectStage: (stage: BusinessStage) => void;
  stageSaving: boolean;
}

export function WeekDetailLegacy({
  weekNum, isAdmin, intake, checklists, notes, saving, submitFlash, completedSet,
  onToggleCheck, onSetNotes, onSubmitDeliverable, onCompleteWeek, onSelectStage, stageSaving,
}: WeekDetailLegacyProps) {
  const week = WEEKS.find((w) => w.num === weekNum)!;
  const stage: BusinessStage = intake?.business_stage ?? 'established';
  const isJustStarting = stage === 'just_starting';

  return (
    <div className="animate-fade-in">
      <div className="mb-8 border-b border-gold/10 pb-6">
        <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.28em] text-gold">{week.eyebrow}</div>
        <h2 className="font-lux text-4xl font-bold leading-[0.95] sm:text-5xl" style={{ color: '#FBF4EC' }}>
          {week.title}<br /><em className="italic text-gold">{week.titleEm}</em>
        </h2>
        <p className="mt-3.5 max-w-2xl text-[15px] leading-[1.85] text-cream-dim">{week.intro}</p>
      </div>

      {weekNum !== 1 && (
        <div className="mb-6 flex items-center gap-3 border border-gold/15 bg-gold/6 px-4 py-3">
          {isJustStarting ? <Rocket size={16} className="text-gold" /> : <Store size={16} className="text-gold" />}
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
            Your Path: {isJustStarting ? 'Just Starting Out' : 'Established Business'}
          </div>
        </div>
      )}

      {intake?.game_plan && weekNum === 1 && !isJustStarting && (
        <div className="mb-7 border border-gold/15 bg-luxcard p-6">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">Your Personalized Game Plan from Sheek</div>
          <div className="whitespace-pre-line border-l-2 border-gold bg-gold/6 p-4 text-[13px] leading-[1.85] text-cream">
            {intake.game_plan}
          </div>
        </div>
      )}

      {weekNum === 1 && (
        <div className="mb-7 border border-gold/20 bg-luxcard p-7 sm:p-8" style={{ boxShadow: '0 0 30px rgba(201,149,58,0.08)' }}>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
            <Sparkles size={14} /> Before We Begin — Where Are You Right Now?
          </div>
          <p className="mb-5 max-w-2xl text-[13px] leading-[1.7] text-cream-dim">
            This first session is different depending on where you are in your journey. Pick the option that fits you — your mentor will tailor everything to your situation.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => onSelectStage('just_starting')}
              disabled={stageSaving}
              className={`flex flex-col items-start gap-2 border-2 p-5 text-left transition-all disabled:opacity-50 ${
                isJustStarting ? 'border-gold bg-gold/10' : 'border-gold/15 bg-white/3 hover:border-gold/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Rocket size={18} className={isJustStarting ? 'text-gold' : 'text-muted'} />
                <span className={`text-sm font-bold ${isJustStarting ? 'text-gold' : 'text-cream'}`}>Just Starting Out</span>
              </div>
              <p className="text-[12px] leading-[1.6] text-cream-dim">
                I don't have a store yet. I'm brand new to this. I don't have sales numbers or an Etsy shop — I'm building from scratch.
              </p>
            </button>
            <button
              onClick={() => onSelectStage('established')}
              disabled={stageSaving}
              className={`flex flex-col items-start gap-2 border-2 p-5 text-left transition-all disabled:opacity-50 ${
                !isJustStarting ? 'border-gold bg-gold/10' : 'border-gold/15 bg-white/3 hover:border-gold/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Store size={18} className={!isJustStarting ? 'text-gold' : 'text-muted'} />
                <span className={`text-sm font-bold ${!isJustStarting ? 'text-gold' : 'text-cream'}`}>Established Business</span>
              </div>
              <p className="text-[12px] leading-[1.6] text-cream-dim">
                I already have a store (Etsy, TikTok Shop, website). I have sales data, products, and pricing — I'm here to optimize and grow.
              </p>
            </button>
          </div>
          {stageSaving && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
              <Loader2 size={12} className="animate-spin" /> Saving your selection...
            </div>
          )}
          {intake?.game_plan && (
            <div className="mt-5 border-t border-gold/12 pt-5">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">Your Personalized Game Plan from Sheek</div>
              <div className="whitespace-pre-line border-l-2 border-gold bg-gold/6 p-4 text-[13px] leading-[1.85] text-cream">
                {intake.game_plan}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-7 flex flex-col gap-4">
        {week.content && !(weekNum === 1 && isJustStarting) && (
          <div className="border border-gold/9 bg-luxcard p-7 sm:p-8">
            <div className="mb-3.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
              What Happens in This Session
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="mb-2.5 border-b border-gold/12 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">What Sheek Reviews</div>
                <ul className="flex flex-col gap-2.5">
                  {week.content.learn.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] leading-[1.5] text-cream-dim">
                      <span className="font-bold text-gold">→</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2.5 border-b border-gold/12 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">You Will Leave With</div>
                <ul className="flex flex-col gap-2.5">
                  {week.content.do.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] leading-[1.5] text-cream-dim">
                      <span className="font-bold text-gold">✦</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2.5 border-b border-gold/12 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Come Prepared With</div>
                <ul className="flex flex-col gap-2.5">
                  {week.content.get.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] leading-[1.5] text-cream-dim">
                      <span className="font-bold text-gold">↗</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {week.content?.framework && !(weekNum === 1 && isJustStarting) && (
          <div className="border border-gold/9 bg-luxcard p-7 sm:p-8">
            <div className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">How to Prepare</div>
            <div className="border-l-[3px] border-gold bg-gold/6 p-5">
              <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">{week.content.framework.title}</div>
              <div className="text-[13px] leading-[1.85] text-cream-dim">
                {week.content.framework.steps.map((s) => (
                  <div key={s.n} className="flex gap-3 border-b border-gold/8 py-2.5 last:border-b-0 last:pb-0">
                    <span className="font-lux w-7 shrink-0 text-2xl font-bold leading-none text-gold/30">{s.n}</span>
                    <span className="text-[13px] leading-[1.6] text-cream-dim">
                      <strong className="mb-0.5 block text-ivory">{s.strong}</strong>{s.body}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {week.content?.formula && !(weekNum === 1 && isJustStarting) && (
          <div className="border border-gold/9 bg-luxcard p-7 sm:p-8">
            <div className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">The True Cost Formula</div>
            <div className="border-l-[3px] border-gold bg-gold/6 p-5">
              <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">How to Price Every Product You Make</div>
              <div className="flex flex-wrap items-center gap-2">
                {week.content.formula.cells.map((cell, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="border border-gold/18 bg-gold/8 px-3 py-3 text-center">
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold">{cell.label}</div>
                      <div className="text-[11px] leading-[1.4] text-cream-dim">{cell.sub}</div>
                    </div>
                    {i < week.content!.formula!.cells.length - 1 && <span className="font-lux text-2xl font-bold text-gold">+</span>}
                  </div>
                ))}
                <div className="mt-2 w-full border border-burg/40 bg-burg/15 px-4 py-3.5 text-center">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#C97A8A' }}>{week.content.formula.resultLabel}</div>
                  <div className="font-lux text-xl font-bold text-ivory">{week.content.formula.resultVal}</div>
                </div>
              </div>
              <p className="mt-4 text-[13px] leading-[1.85] text-cream-dim"><em className="not-italic font-semibold text-ivory">{week.content.formula.note}</em></p>
            </div>
          </div>
        )}

        {week.content?.extraCards?.map((card, i) => !(weekNum === 1 && isJustStarting) && (
          <div key={i} className="border border-gold/9 bg-luxcard p-7 sm:p-8">
            <div className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">{card.label}</div>
            <div className="border-l-[3px] border-gold bg-gold/6 p-5">
              <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">{card.title}</div>
              <div className="whitespace-pre-line text-[13px] leading-[1.85] text-cream-dim">{card.body}</div>
            </div>
          </div>
        ))}
      </div>

      {weekNum === 1 && isJustStarting && (
        <>
          <div className="border border-gold/9 bg-luxcard p-7 sm:p-8">
            <div className="mb-3.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
              <Rocket size={14} /> Your First Session — Building From Zero
            </div>
            <p className="mb-5 text-[14px] leading-[1.85] text-cream-dim">
              You're brand new — and that's actually an advantage. No bad habits to unlearn. No underpriced listings to fix. We're building this right from day one. No Etsy talk, no sales audits, no number-crunching. Just you, your craft, and a clear plan to get your first product in front of your first customer.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="mb-2.5 border-b border-gold/12 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">What We'll Figure Out</div>
                <ul className="flex flex-col gap-2.5">
                  {['What you want to make and why','Who you\'re going to sell to','What materials and tools you need','Where you\'ll sell your first products','A simple pricing method for beginners','Your first 3 products to create'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] leading-[1.5] text-cream-dim">
                      <span className="font-bold text-gold">→</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2.5 border-b border-gold/12 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">You Will Leave With</div>
                <ul className="flex flex-col gap-2.5">
                  {['Your product idea validated','Your first customer profile sketched out','A materials and startup budget list','Your selling platform chosen and set up','Your first 3 products planned','A 30-day action plan to your first sale'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] leading-[1.5] text-cream-dim">
                      <span className="font-bold text-gold">✦</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2.5 border-b border-gold/12 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Come Ready To Share</div>
                <ul className="flex flex-col gap-2.5">
                  {['What you love making (even if it\'s a hobby right now)','Photos of things you\'ve already made','Rough idea of who you\'d want to buy from you','Your budget for getting started','How much time you have each week','Any skills or experience you already have'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] leading-[1.5] text-cream-dim">
                      <span className="font-bold text-gold">↗</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="border border-gold/9 bg-luxcard p-7 sm:p-8">
            <div className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">Your Step-by-Step First Session</div>
            <div className="border-l-[3px] border-gold bg-gold/6 p-5">
              <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">From Zero to Your First Product Plan</div>
              <div className="text-[13px] leading-[1.85] text-cream-dim">
                <div className="flex gap-3 border-b border-gold/8 py-2.5">
                  <span className="font-lux w-7 shrink-0 text-2xl font-bold leading-none text-gold/30">1</span>
                  <span className="text-[13px] leading-[1.6] text-cream-dim">
                    <strong className="mb-0.5 block text-ivory">What do you want to make?</strong>
                    We'll nail down your craft. Not 20 things — one thing you're genuinely good at and excited to make. This becomes your starting product.
                  </span>
                </div>
                <div className="flex gap-3 border-b border-gold/8 py-2.5">
                  <span className="font-lux w-7 shrink-0 text-2xl font-bold leading-none text-gold/30">2</span>
                  <span className="text-[13px] leading-[1.6] text-cream-dim">
                    <strong className="mb-0.5 block text-ivory">Who's going to buy it?</strong>
                    We'll sketch your first customer. Not a full persona — just: who would want this, where do they hang out, and why would they choose you?
                  </span>
                </div>
                <div className="flex gap-3 border-b border-gold/8 py-2.5">
                  <span className="font-lux w-7 shrink-0 text-2xl font-bold leading-none text-gold/30">3</span>
                  <span className="text-[13px] leading-[1.6] text-cream-dim">
                    <strong className="mb-0.5 block text-ivory">What do you need to make it?</strong>
                    Materials, tools, workspace. We'll list everything and put real numbers to it so you know your startup cost.
                  </span>
                </div>
                <div className="flex gap-3 border-b border-gold/8 py-2.5">
                  <span className="font-lux w-7 shrink-0 text-2xl font-bold leading-none text-gold/30">4</span>
                  <span className="text-[13px] leading-[1.6] text-cream-dim">
                    <strong className="mb-0.5 block text-ivory">Where will you sell?</strong>
                    We'll pick your first platform — Instagram, Etsy, or a simple site. Just one. You can expand later. We'll set it up together.
                  </span>
                </div>
                <div className="flex gap-3 border-b border-gold/8 py-2.5">
                  <span className="font-lux w-7 shrink-0 text-2xl font-bold leading-none text-gold/30">5</span>
                  <span className="text-[13px] leading-[1.6] text-cream-dim">
                    <strong className="mb-0.5 block text-ivory">How much should you charge?</strong>
                    Simple version: materials + your time + a profit margin. No complicated formulas. Just enough to make sure you're not losing money on every sale.
                  </span>
                </div>
                <div className="flex gap-3 py-2.5 last:pb-0">
                  <span className="font-lux w-7 shrink-0 text-2xl font-bold leading-none text-gold/30">6</span>
                  <span className="text-[13px] leading-[1.6] text-cream-dim">
                    <strong className="mb-0.5 block text-ivory">Your 30-day plan</strong>
                    We'll map out the next 30 days — what to make, what to post, and how to get your first sale. One step at a time. No overwhelm.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gold/9 bg-luxcard p-7 sm:p-8">
            <div className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">Simple Pricing for Your First Products</div>
            <div className="border-l-[3px] border-gold bg-gold/6 p-5">
              <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">The Beginner's Price Formula</div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="border border-gold/18 bg-gold/8 px-3 py-3 text-center">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold">Materials</div>
                  <div className="text-[11px] leading-[1.4] text-cream-dim">What it costs you to make</div>
                </div>
                <span className="font-lux text-2xl font-bold text-gold">+</span>
                <div className="border border-gold/18 bg-gold/8 px-3 py-3 text-center">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold">Your Time</div>
                  <div className="text-[11px] leading-[1.4] text-cream-dim">Hours × at least $15/hr</div>
                </div>
                <span className="font-lux text-2xl font-bold text-gold">+</span>
                <div className="border border-gold/18 bg-gold/8 px-3 py-3 text-center">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold">Profit</div>
                  <div className="text-[11px] leading-[1.4] text-cream-dim">Add 30% on top</div>
                </div>
                <div className="mt-2 w-full border border-burg/40 bg-burg/15 px-4 py-3.5 text-center">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#C97A8A' }}>= Your First Price</div>
                  <div className="font-lux text-xl font-bold text-ivory">Don't undercharge from day one. You deserve to get paid.</div>
                </div>
              </div>
              <p className="mt-4 text-[13px] leading-[1.85] text-cream-dim"><em className="not-italic font-semibold text-ivory">This is the simple version. Once you're up and running, we'll get into the full True Cost Formula in later weeks. For now, just make sure you're covering materials, paying yourself something, and building in profit.</em></p>
            </div>
          </div>
        </>
      )}

      <div className="border border-burg/40 bg-burg/12 p-6 sm:p-7">
        <div className="mb-3.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: '#C97A8A' }}>
          {week.deliverable.label}
        </div>
        <ul className="mb-5 flex flex-col gap-2.5">
          {week.deliverable.items.map((item, i) => {
            const checked = checklists[weekNum]?.[`item_${i}`] ?? false;
            return (
              <li key={i} className="flex items-start gap-3 text-[13px] leading-[1.5] text-cream">
                <button
                  onClick={() => onToggleCheck(weekNum, i)}
                  className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center border text-[11px] transition-all ${
                    checked ? 'border-green bg-green text-ivory' : 'border-gold/30 bg-transparent'
                  }`}
                >
                  {checked && <Check size={11} />}
                </button>
                {item}
              </li>
            );
          })}
        </ul>
        <div className="mt-4">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-cream-dim">{week.deliverable.submitLabel}</span>
          <textarea
            value={notes[weekNum] ?? ''}
            onChange={(e) => onSetNotes(weekNum, e.target.value)}
            placeholder={submitFlash === weekNum ? '✓ Submitted! Sheek will review before your next session.' : week.deliverable.placeholder}
            className="w-full resize-vertical border border-gold/20 bg-white/3 p-3 text-[13px] text-cream outline-none transition-colors placeholder:text-muted focus:border-gold"
            style={{ minHeight: '80px', fontFamily: "'DM Sans', sans-serif" }}
          />
          <button
            onClick={() => onSubmitDeliverable(weekNum)}
            disabled={saving}
            className="mt-2.5 bg-gold px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-luxbg transition-colors hover:bg-gold-lt disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={14} /> : week.deliverable.btnText}
          </button>
        </div>
      </div>

      <button
        onClick={() => onCompleteWeek(weekNum)}
        disabled={saving || completedSet.has(weekNum)}
        className={`mt-6 flex w-full items-center justify-center gap-2.5 py-3.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
          completedSet.has(weekNum)
            ? 'border border-green bg-green/20 text-green'
            : 'bg-green text-ivory hover:bg-green-lt'
        }`}
      >
        {completedSet.has(weekNum) ? (
          <>✓ Week {weekNum} Complete</>
        ) : (
          <>✓ Mark Week {weekNum} Complete — Unlock Week {weekNum + 1}</>
        )}
      </button>
    </div>
  );
}
