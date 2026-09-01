import React, { useState, useEffect } from 'react';
import { Lock, Calculator, FileText, ShoppingBag, Calendar, Rocket, Check, Sparkles, Printer } from 'lucide-react';
import { logActivity } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

interface BusinessToolsViewProps {
  profile: Profile | null;
  onBack?: () => void;
}

type ToolTab = 'calc' | 'contract' | 'vendors' | 'calendar' | 'launch';

// ─── Pricing Calculator ───────────────────────────────────────────────────────
function PricingCalc() {
  const [fabric, setFabric] = useState(0);
  const [notions, setNotions] = useState(0);
  const [print, setPrint] = useState(0);
  const [packaging, setPackaging] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [other, setOther] = useState(0);
  const [hours, setHours] = useState(1);
  const [rate, setRate] = useState(25);
  const [margin, setMargin] = useState(35);
  const [qty, setQty] = useState(1);
  const [copied, setCopied] = useState(false);

  const totalMaterials = (fabric + notions + print + packaging + shipping + other) * qty;
  const laborCost = hours * rate * qty;
  const subtotal = totalMaterials + laborCost;
  const marginAmt = subtotal * (margin / 100);
  const totalPrice = subtotal + marginAmt;
  const deposit = totalPrice * 0.5;

  function copyPrice() {
    navigator.clipboard.writeText(`$${totalPrice.toFixed(2)}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const inputClass = "w-full bg-forest-50 border border-goldline/50 rounded-xl px-3.5 py-2.5 text-xs text-ivory outline-none focus:border-gold transition-colors";
  const labelClass = "block text-[10px] font-bold tracking-wider uppercase text-gold mb-1.5";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="text-[10px] font-bold tracking-widest uppercase text-gold mb-1">✦ Pricing & Profit Intelligence</div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ivory">
          Custom Order <em className="italic text-gold font-normal">Pricing Calculator</em>
        </h2>
        <p className="text-xs text-ivory-muted mt-1">Know your true production cost, wage, and profit before quoting any client.</p>
      </div>

      {/* Materials */}
      <div className="bg-forest-100/90 border border-goldline/40 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-ivory mb-4 flex items-center gap-2">
          <span className="text-gold">🧵</span> 1. Materials & Supply Costs
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Fabric / Base Material ($)', val: fabric, set: setFabric },
            { label: 'Thread / Elastic / Notions ($)', val: notions, set: setNotions },
            { label: 'Print / Sublimation / Vinyl ($)', val: print, set: setPrint },
            { label: 'Packaging & Labels ($)', val: packaging, set: setPackaging },
            { label: 'Shipping / Postage ($)', val: shipping, set: setShipping },
            { label: 'Other Direct Costs ($)', val: other, set: setOther },
          ].map((f) => (
            <div key={f.label}>
              <label className={labelClass}>{f.label}</label>
              <input
                type="number"
                min={0}
                step={0.25}
                value={f.val || ''}
                placeholder="0.00"
                onChange={(e) => f.set(parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div>
            <label className={labelClass}>Quantity (Units)</label>
            <input
              type="number"
              min={1}
              value={qty || ''}
              onChange={(e) => setQty(parseInt(e.target.value) || 1)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Labor */}
      <div className="bg-forest-100/90 border border-goldline/40 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-ivory mb-4 flex items-center gap-2">
          <span className="text-gold">⏱️</span> 2. Your Labor & Drafting Time
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Total Hours Per Item</label>
            <input
              type="number"
              min={0.25}
              step={0.25}
              value={hours || ''}
              onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Hourly Labor Wage ($/hr)</label>
            <input
              type="number"
              min={1}
              value={rate || ''}
              onChange={(e) => setRate(parseFloat(e.target.value) || 25)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="bg-forest-200/80 border-l-2 border-gold rounded-r-xl p-3 mt-4 text-xs text-earth-tan leading-relaxed">
          <strong className="text-gold uppercase tracking-wider block text-[10px] mb-0.5">✦ Sheek's Rule</strong>
          Your minimum wage must start at least at $25/hour. Never work for free inside your own business.
        </div>
      </div>

      {/* Margin */}
      <div className="bg-forest-100/90 border border-goldline/40 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-ivory mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2"><span className="text-gold">📈</span> 3. Business Profit Margin</span>
          <span className="text-gold font-bold text-sm">{margin}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={80}
          step={5}
          value={margin}
          onChange={(e) => setMargin(parseInt(e.target.value))}
          className="w-full accent-gold cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-ivory-muted mt-1.5">
          <span>10% (Break Even)</span>
          <span>35-45% (Recommended Standard)</span>
          <span>80% (High-End Luxury)</span>
        </div>
      </div>

      {/* Quote Summary Box */}
      <div className="bg-gradient-to-br from-forest-200 via-earth-100 to-forest-100 border border-gold/40 shadow-gold-glow rounded-3xl p-6 sm:p-8">
        <div className="text-[10px] font-bold tracking-widest uppercase text-gold mb-1">✦ Final Calculated Retail Price</div>
        <div className="font-display text-4xl sm:text-5xl font-bold text-ivory my-2">
          ${totalPrice.toFixed(2)}
        </div>
        <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 text-xs">
          {[
            [`Materials Cost (×${qty})`, `$${totalMaterials.toFixed(2)}`],
            [`Labor (${hours}hr × $${rate}/hr × ${qty})`, `$${laborCost.toFixed(2)}`],
            ['Direct Production Subtotal', `$${subtotal.toFixed(2)}`],
            [`Business Profit (${margin}%)`, `$${marginAmt.toFixed(2)}`],
            ['CLIENT QUOTE AMOUNT', `$${totalPrice.toFixed(2)}`],
          ].map(([k, v], i) => (
            <div
              key={k}
              className={`flex justify-between py-1 border-b border-white/5 last:border-none ${
                i === 4 ? 'font-bold text-gold text-sm pt-2' : 'text-ivory-dim'
              }`}
            >
              <span>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-gold-soft mt-3 font-semibold bg-forest-50/60 p-2.5 rounded-xl border border-goldline/30">
          50% Mandatory Deposit: ${deposit.toFixed(2)} · Remaining Balance Due on Delivery: ${deposit.toFixed(2)}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={copyPrice}
          className="flex items-center gap-2 bg-gradient-to-r from-gold to-gold-deep text-earth-50 font-bold px-6 py-2.5 rounded-full text-xs shadow-gold-glow hover:brightness-110 transition-all"
        >
          {copied ? <><Check size={14} /> Copied Amount!</> : 'Copy Quote Amount'}
        </button>
        <button
          onClick={() => {
            setFabric(0); setNotions(0); setPrint(0); setPackaging(0); setShipping(0); setOther(0);
            setHours(1); setRate(25); setMargin(35); setQty(1);
          }}
          className="bg-forest-100 border border-goldline/40 text-ivory-dim hover:text-ivory px-5 py-2.5 rounded-full text-xs font-semibold"
        >
          Reset Calculator
        </button>
      </div>
    </div>
  );
}

// ─── Client Contract ──────────────────────────────────────────────────────────
function ClientContract() {
  const [bizName, setBizName] = useState('Oh Sew Sheek');
  const [yourName, setYourName] = useState('Coach Sheek');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [orderDate, setOrderDate] = useState(today);
  const [dueDate, setDueDate] = useState('');
  const [project, setProject] = useState('');
  const [price, setPrice] = useState('');
  const [dep, setDep] = useState('');
  const [bal, setBal] = useState('');
  const [notes, setNotes] = useState('');

  function fmtDate(d: string) {
    if (!d) return '[Date]';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const inputClass = "w-full bg-forest-50 border border-goldline/50 rounded-xl px-3.5 py-2 text-xs text-ivory outline-none focus:border-gold transition-colors";
  const labelClass = "block text-[10px] font-bold tracking-wider uppercase text-gold mb-1";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="text-[10px] font-bold tracking-widest uppercase text-gold mb-1">✦ Legal & Client Protection</div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ivory">
          Custom Order <em className="italic text-gold font-normal">Agreement Generator</em>
        </h2>
        <p className="text-xs text-ivory-muted mt-1">Fill out the fields to generate a legally protective agreement ready for client signature.</p>
      </div>

      <div className="bg-forest-100/90 border border-goldline/40 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-ivory mb-4 flex items-center gap-2">
          <span className="text-gold">✏️</span> Project Information
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div><label className={labelClass}>Your Brand / Business Name</label><input value={bizName} onChange={(e) => setBizName(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Your Full Name</label><input value={yourName} onChange={(e) => setYourName(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Client Name</label><input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client Full Name" className={inputClass} /></div>
          <div><label className={labelClass}>Client Email</label><input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@email.com" className={inputClass} /></div>
          <div><label className={labelClass}>Order Date</label><input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Estimated Due Date</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} /></div>
        </div>
        <div className="mb-3">
          <label className={labelClass}>Project Scope & Specifications</label>
          <textarea
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="Item name, sizing, colors, fabric choices, custom embroideries..."
            className={`${inputClass} min-h-[60px]`}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div><label className={labelClass}>Total Agreed Price ($)</label><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className={inputClass} /></div>
          <div><label className={labelClass}>Deposit Required ($)</label><input type="number" value={dep} onChange={(e) => setDep(e.target.value)} placeholder="0.00" className={inputClass} /></div>
          <div><label className={labelClass}>Balance on Delivery ($)</label><input type="number" value={bal} onChange={(e) => setBal(e.target.value)} placeholder="0.00" className={inputClass} /></div>
        </div>
        <div>
          <label className={labelClass}>Special Terms & Policies</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Client provides zipper by Friday..." className={inputClass} />
        </div>
      </div>

      {/* Generated Contract Document */}
      <div className="bg-white text-earth-400 rounded-3xl p-6 sm:p-10 shadow-2xl font-sans text-xs sm:text-sm leading-relaxed border border-earth-warm/30">
        <h3 className="font-serif text-2xl font-bold text-center text-earth-300 mb-1">Custom Made-to-Order Agreement</h3>
        <div className="text-center text-xs text-earth-warm mb-6 font-semibold">{bizName} · Artisan Studio</div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="font-bold text-earth-400 uppercase tracking-wider text-[11px] mb-1">1. Parties</div>
            <p>This agreement is entered into on <strong>{fmtDate(orderDate)}</strong> between <strong>{bizName} ({yourName})</strong> ("Maker") and <strong>{clientName || '[Client Name]'}</strong> {clientEmail && `(${clientEmail})`} ("Client").</p>
          </div>

          <div>
            <div className="font-bold text-earth-400 uppercase tracking-wider text-[11px] mb-1">2. Project Scope</div>
            <p className="bg-earth-50 p-2.5 rounded-lg border border-earth-light/60">{project || '[Project specifications will appear here]'}</p>
            <p className="mt-1">Estimated completion date: <strong>{fmtDate(dueDate)}</strong></p>
          </div>

          <div>
            <div className="font-bold text-earth-400 uppercase tracking-wider text-[11px] mb-1">3. Payment Terms</div>
            <p>Total: <strong>${price || '0.00'}</strong> | Non-refundable Deposit: <strong>${dep || '0.00'}</strong> | Balance Due: <strong>${bal || '0.00'}</strong></p>
            <p className="text-earth-warm mt-1">Work will strictly commence upon receipt of the deposit. Balance is due prior to shipment/pickup.</p>
          </div>

          <div>
            <div className="font-bold text-earth-400 uppercase tracking-wider text-[11px] mb-1">4. Deposit & Revisions Policy</div>
            <p>The 50% deposit is non-refundable to cover materials and custom drafting time. One complimentary fitting revision is included within 48 hours of receipt.</p>
          </div>

          {notes && (
            <div>
              <div className="font-bold text-earth-400 uppercase tracking-wider text-[11px] mb-1">5. Custom Notes</div>
              <p className="italic text-earth-300">{notes}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t border-earth-light">
          <div>
            <div className="text-[10px] font-bold text-earth-warm uppercase">Maker Signature</div>
            <div className="border-b border-earth-400 h-8 mt-2" />
            <div className="text-xs text-earth-400 mt-1">{yourName}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-earth-warm uppercase">Client Signature</div>
            <div className="border-b border-earth-400 h-8 mt-2" />
            <div className="text-xs text-earth-400 mt-1">{clientName || 'Client'}</div>
          </div>
        </div>
      </div>

      <div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-gradient-to-r from-gold to-gold-deep text-earth-50 font-bold px-6 py-2.5 rounded-full text-xs shadow-gold-glow hover:brightness-110 transition-all"
        >
          <Printer size={14} /> Print / Save Agreement as PDF
        </button>
      </div>
    </div>
  );
}

// ─── Vendor Directory ─────────────────────────────────────────────────────────
const VENDORS_DEFAULT = [
  { name: 'Fararti', url: 'https://fararti.com', badge: "Sheek's #1 Pick", desc: "Fabric, sublimation supplies, sewing notions and more. Sheek's go-to for stocking up — quality materials at real prices.", code: 'SHEEK15', savings: '15% off your entire order', featured: true },
  { name: 'Amazon Storefront', url: 'https://amazon.com', badge: 'Elastic & Notions', desc: 'Elastic by the yard, thread, needles, stabilizer, transfer paper, heat tape, packaging supplies.', code: null, savings: null, featured: false },
  { name: 'ARTSADD', url: 'https://artsadd.com', badge: 'Sublimation Blanks', desc: 'Full-wrap sublimation blanks for apparel, bonnets, and accessories. Used for the Succeed in Silence apparel line.', code: null, savings: null, featured: false },
  { name: 'Uline', url: 'https://uline.com', badge: 'Branded Packaging', desc: 'Poly mailers, tissue paper, thank you cards, ribbon, boxes, and branded packaging.', code: null, savings: null, featured: false },
  { name: 'Fabric Wholesale Direct', url: 'https://fabricwholesaledirect.com', badge: 'Bulk Fabrics', desc: 'Spandex, jersey, athletic fabrics in bulk yardage. Great for sock bonnets and athletic sets.', code: null, savings: null, featured: false },
  { name: 'Rhinestone Guy', url: 'https://therhinestoneguy.com', badge: 'Bling & Crystals', desc: 'Hotfix rhinestones, bling tools, iron-on transfers for embellishments and custom apparel.', code: null, savings: null, featured: false },
];

function VendorList() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="text-[10px] font-bold tracking-widest uppercase text-gold mb-1">✦ Sourcing & Materials</div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ivory">
          Verified <em className="italic text-gold font-normal">Vendor Directory</em>
        </h2>
        <p className="text-xs text-ivory-muted mt-1">Direct suppliers and wholesale stores used by Sheek with student discounts.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {VENDORS_DEFAULT.map((v, i) => (
          <div
            key={i}
            className={`bg-forest-100/90 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
              v.featured ? 'border-gold shadow-gold-glow' : 'border-goldline/40'
            }`}
          >
            <div>
              <span className="inline-block bg-gold/15 text-gold text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-gold/30 mb-2">
                {v.badge}
              </span>
              <div className="font-display text-lg font-bold text-ivory mb-1">{v.name}</div>
              <p className="text-xs text-ivory-muted leading-relaxed mb-3">{v.desc}</p>
            </div>
            <div>
              {v.code ? (
                <div className="bg-forest-50 border border-goldline/50 rounded-xl p-2.5 mb-2 flex items-center justify-between">
                  <span className="text-[11px] text-ivory-muted font-mono uppercase">Code: <strong className="text-gold">{v.code}</strong></span>
                  <span className="text-[10px] text-gold font-bold">{v.savings}</span>
                </div>
              ) : (
                <div className="text-[11px] text-ivory-muted/60 mb-2">Direct supplier catalog</div>
              )}
              <a
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gold hover:underline font-semibold"
              >
                Visit Supplier Website →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Content Calendar ─────────────────────────────────────────────────────────
const WEEKS = [
  {
    num: 1,
    theme: 'Educate & Build Authority',
    posts: [
      { day: 'Monday', text: '"3 mistakes beginners make when sewing elastic" — Reel or short video' },
      { day: 'Wednesday', text: 'Behind the scenes: show your workspace or current project in progress' },
      { day: 'Friday', text: '"What fabric should you use for bonnets?" — Educational post or video' },
      { day: 'Sunday', text: 'Engagement question: "What\'s the hardest part of sewing for you?"' },
    ],
  },
  {
    num: 2,
    theme: 'Show Your Craft & Sell',
    posts: [
      { day: 'Monday', text: 'Finished product reveal — before/after or process video with price' },
      { day: 'Tuesday', text: 'Student win or testimonial — screenshot or tag their post' },
      { day: 'Thursday', text: '"Custom orders open — here\'s how to order" — with link or DM CTA' },
      { day: 'Saturday', text: 'Class promo — feature one of your courses with enrollment link' },
    ],
  },
  {
    num: 3,
    theme: 'Mindset & Community',
    posts: [
      { day: 'Monday', text: 'Motivational post — one of the 7 Commandments with your take on it' },
      { day: 'Wednesday', text: '"This is why I started sewing" — personal story post (builds connection)' },
      { day: 'Friday', text: 'Community shoutout — tag a student and celebrate their win publicly' },
      { day: 'Sunday', text: '"What would you make if you knew how?" — engagement + warm funnel' },
    ],
  },
  {
    num: 4,
    theme: 'Convert & Close Orders',
    posts: [
      { day: 'Monday', text: 'FAQ post — answer the most common questions about your class or orders' },
      { day: 'Wednesday', text: 'Urgency post — "only X spots left" or limited-time offer on a class' },
      { day: 'Thursday', text: 'Live video — Q&A, sewing demo, or "day in the life" — 10–20 mins' },
      { day: 'Saturday', text: 'Month recap — celebrate wins, preview what\'s coming next month' },
    ],
  },
];

function ContentCalendar() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="text-[10px] font-bold tracking-widest uppercase text-gold mb-1">✦ Social Media & Marketing</div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ivory">
          Monthly Content <em className="italic text-gold font-normal">Calendar</em>
        </h2>
        <p className="text-xs text-ivory-muted mt-1">A structured 4-week posting blueprint to consistently attract buyers.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {WEEKS.map((w) => (
          <div key={w.num} className="bg-forest-100/90 border border-goldline/40 rounded-2xl p-5 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gold mb-1">Week {w.num}</div>
            <div className="font-display text-base font-bold text-ivory mb-3">{w.theme}</div>
            <div className="space-y-2 text-xs">
              {w.posts.map((p, i) => (
                <div key={i} className="bg-forest-50/80 p-2.5 rounded-xl border border-white/5">
                  <div className="font-bold text-gold text-[10px] uppercase mb-0.5">{p.day}</div>
                  <div className="text-ivory-dim">{p.text}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── First $100 Launch Plan ───────────────────────────────────────────────────
const LAUNCH_DAYS = [
  { num: 1, day: 'Day 1', title: 'Pick Your Starter Product & Order Supplies', tasks: ['Decide on starter product (sock bonnet or tote bag)', 'Order supplies using student discount code SHEEK15', 'Watch Lessons 1–2 of your class while supplies arrive'] },
  { num: 2, day: 'Days 2–3', title: 'Make Your First Practice Piece', tasks: ['Complete Lessons 3–5 of your class step-by-step', 'Make practice piece — done beats perfect', 'Take behind-the-scenes work-in-progress photos'] },
  { num: 3, day: 'Day 4', title: 'Make Your Sellable Piece & Set Price', tasks: ['Make clean, sellable finished piece', 'Open Pricing Calculator and compute retail price with 35% margin', 'Take 5 clean photos in natural lighting'] },
  { num: 4, day: 'Day 5', title: 'Post & Personal Outreach', tasks: ['Post on Facebook using Custom Order template', 'Post short Reel or TikTok showing product reveal', 'Direct message 5 warm contacts with your new offering'] },
  { num: 5, day: 'Days 6–7', title: 'Collect 50% Deposit & Celebrate', tasks: ['Send Client Agreement immediately upon inquiry', 'Collect 50% non-refundable deposit before cutting fabric', 'Celebrate your first sale in the community!'] },
];

function LaunchPlan() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const totalTasks = LAUNCH_DAYS.reduce((sum, d) => sum + d.tasks.length, 0);
  const pct = Math.round((checked.size / totalTasks) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="text-[10px] font-bold tracking-widest uppercase text-gold mb-1">✦ Action Roadmap</div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ivory">
          Your First <em className="italic text-gold font-normal">$100 Launch Plan</em>
        </h2>
        <p className="text-xs text-ivory-muted mt-1">7 days. Step by step. Your first $100 from your custom sewing craft.</p>
      </div>

      <div className="bg-forest-100/90 border border-goldline/40 rounded-2xl p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-ivory">Launch Progress</span>
            <span className="text-gold">{pct}% Completed</span>
          </div>
          <div className="h-2 bg-forest-50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gold to-forest-light transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {LAUNCH_DAYS.map((d, di) => (
          <div key={d.num} className="bg-forest-100/90 border border-goldline/40 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-gold text-xs font-bold border border-gold/30">
                {d.num}
              </span>
              <span className="text-[10px] font-bold text-gold uppercase tracking-wider">{d.day}</span>
              <span className="text-xs font-bold text-ivory">{d.title}</span>
            </div>
            <div className="space-y-2 mt-3 pl-8">
              {d.tasks.map((task, ti) => {
                const key = `${di}-${ti}`;
                const done = checked.has(key);
                return (
                  <div
                    key={ti}
                    onClick={() => toggle(key)}
                    className="flex items-start gap-2.5 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        done ? 'bg-gold border-gold' : 'border-goldline group-hover:border-gold'
                      }`}
                    >
                      {done && <Check size={10} className="text-forest-50" strokeWidth={3} />}
                    </div>
                    <span className={`text-xs leading-relaxed transition-colors ${done ? 'line-through text-ivory-muted' : 'text-ivory/90'}`}>
                      {task}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────
const TABS: { id: ToolTab; label: string; icon: React.ReactNode }[] = [
  { id: 'calc', label: 'Pricing Calculator', icon: <Calculator size={13} /> },
  { id: 'contract', label: 'Client Contract', icon: <FileText size={13} /> },
  { id: 'vendors', label: 'Vendor Directory', icon: <ShoppingBag size={13} /> },
  { id: 'calendar', label: 'Content Calendar', icon: <Calendar size={13} /> },
  { id: 'launch', label: 'First $100 Plan', icon: <Rocket size={13} /> },
];

export function BusinessToolsView({ profile }: BusinessToolsViewProps) {
  const [tab, setTab] = useState<ToolTab>('calc');

  useEffect(() => {
    if (profile?.id) {
      logActivity(profile.id, 'page_view', 'Viewed: Business Tools');
    }
  }, [profile?.id]);

  return (
    <div className="min-h-screen bg-ink flex flex-col font-sans pb-16">
      {/* Subnav for Business Tools */}
      <div className="border-b border-goldline/30 bg-forest-100/90 backdrop-blur-md px-4 sm:px-6 sticky top-14 z-40">
        <div className="mx-auto max-w-7xl flex items-center justify-between py-2.5 overflow-x-auto gap-2 no-scrollbar">
          <div className="flex items-center gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-gold/20 text-gold border border-gold/50 shadow-gold-glow'
                    : 'text-ivory-muted hover:text-ivory hover:bg-white/5'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 flex-1 w-full">
        {tab === 'calc' && <PricingCalc />}
        {tab === 'contract' && <ClientContract />}
        {tab === 'vendors' && <VendorList />}
        {tab === 'calendar' && <ContentCalendar />}
        {tab === 'launch' && <LaunchPlan />}
      </div>
    </div>
  );
}

export default BusinessToolsView;
