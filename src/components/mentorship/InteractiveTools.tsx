import { useState, useMemo } from 'react';
import { Calculator, Users, FileText, Calendar, Zap, Download, Copy, Check } from 'lucide-react';

/* ── shared helpers ────────────────────────────────────────────── */

function ToolShell({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Calculator;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gold/15 bg-luxcard p-6 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10">
          <Icon className="text-gold" size={24} />
        </div>
        <div>
          <h3 className="font-lux text-2xl font-bold text-cream">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-cream-dim">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

const inputClass =
  'w-full border border-gold/20 bg-white/3 px-4 py-2.5 text-sm text-cream outline-none focus:border-gold placeholder:text-cream-dim/50';
const labelClass =
  'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-gold';
const btnClass =
  'bg-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-luxbg transition-colors hover:bg-gold-lt disabled:opacity-50';
const resultBoxClass =
  'border border-gold/20 bg-gold/5 px-5 py-4 text-center';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 border border-gold/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold hover:bg-gold/10"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function money(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/* ── Week 1: 90-Day Goal & Unit Sales Calculator ──────────────── */

export function GoalCalculator() {
  const [goal, setGoal] = useState(5000);
  const [weeks, setWeeks] = useState(13);
  const [avgPrice, setAvgPrice] = useState(85);

  const weeklyTarget = goal / weeks;
  const unitsPerWeek = Math.ceil(weeklyTarget / avgPrice);
  const unitsPerDay = Math.ceil(unitsPerWeek / 7);

  return (
    <ToolShell
      icon={Calculator}
      title="90-Day Goal & Unit Sales Calculator"
      description="Enter your revenue target and average product price. The calculator breaks down exactly how many units you need to sell per week and per day."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Revenue Goal (90 days)</label>
          <input type="number" value={goal} onChange={(e) => setGoal(+e.target.value || 0)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Weeks</label>
          <input type="number" value={weeks} onChange={(e) => setWeeks(+e.target.value || 1)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Avg Price Per Item</label>
          <input type="number" value={avgPrice} onChange={(e) => setAvgPrice(+e.target.value || 1)} className={inputClass} />
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className={resultBoxClass}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Weekly Revenue Target</div>
          <div className="mt-1 font-lux text-2xl font-bold text-cream">{money(weeklyTarget)}</div>
        </div>
        <div className={resultBoxClass}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Units Per Week</div>
          <div className="mt-1 font-lux text-2xl font-bold text-cream">{unitsPerWeek}</div>
        </div>
        <div className={resultBoxClass}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Units Per Day</div>
          <div className="mt-1 font-lux text-2xl font-bold text-cream">{unitsPerDay}</div>
        </div>
      </div>
    </ToolShell>
  );
}

/* ── Week 2: Sewing Profit Margin Calculator ──────────────────── */

export function ProfitCalculator() {
  const [fabricCost, setFabricCost] = useState(0);
  const [notions, setNotions] = useState(0);
  const [hours, setHours] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [packaging, setPackaging] = useState(0);
  const [merchantFee, setMerchantFee] = useState(0);

  const materials = fabricCost + notions;
  const labor = hours * hourlyRate;
  const overhead = materials * 0.1;
  const totalCost = materials + labor + overhead + packaging;
  const wholesale = totalCost * 1.5;
  const retail = totalCost * 2.5;
  const minCustom = totalCost * 2;
  const profitAtRetail = retail - totalCost;
  const margin = retail > 0 ? (profitAtRetail / retail) * 100 : 0;

  return (
    <ToolShell
      icon={Calculator}
      title="Sewing Profit Margin Calculator"
      description="Enter your materials, labor, and overhead. Get wholesale, retail, and minimum custom prices with a built-in 50%+ profit margin buffer."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Fabric Cost</label>
          <input type="number" value={fabricCost} onChange={(e) => setFabricCost(+e.target.value || 0)} className={inputClass} placeholder="0.00" />
        </div>
        <div>
          <label className={labelClass}>Notions (zippers, thread, etc.)</label>
          <input type="number" value={notions} onChange={(e) => setNotions(+e.target.value || 0)} className={inputClass} placeholder="0.00" />
        </div>
        <div>
          <label className={labelClass}>Cutting & Sewing Hours</label>
          <input type="number" value={hours} onChange={(e) => setHours(+e.target.value || 0)} className={inputClass} placeholder="0" step="0.5" />
        </div>
        <div>
          <label className={labelClass}>Your Hourly Rate</label>
          <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(+e.target.value || 0)} className={inputClass} placeholder="25" />
        </div>
        <div>
          <label className={labelClass}>Packaging Cost</label>
          <input type="number" value={packaging} onChange={(e) => setPackaging(+e.target.value || 0)} className={inputClass} placeholder="0.00" />
        </div>
        <div>
          <label className={labelClass}>Merchant Fees (%)</label>
          <input type="number" value={merchantFee} onChange={(e) => setMerchantFee(+e.target.value || 0)} className={inputClass} placeholder="0" />
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className={resultBoxClass}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Total Cost</div>
          <div className="mt-1 font-lux text-2xl font-bold text-cream">{money(totalCost)}</div>
        </div>
        <div className={resultBoxClass}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Profit Margin at Retail</div>
          <div className="mt-1 font-lux text-2xl font-bold text-cream">{margin.toFixed(0)}%</div>
        </div>
        <div className={resultBoxClass}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Wholesale Price (1.5x)</div>
          <div className="mt-1 font-lux text-2xl font-bold text-cream">{money(wholesale)}</div>
        </div>
        <div className={resultBoxClass}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Min Custom Price (2x)</div>
          <div className="mt-1 font-lux text-2xl font-bold text-cream">{money(minCustom)}</div>
        </div>
      </div>
      <div className="mt-3">
        <div className={`${resultBoxClass} border-gold/40 bg-gold/10`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Recommended Retail Price (2.5x)</div>
          <div className="mt-1 font-lux text-3xl font-bold text-gold">{money(retail)}</div>
          <div className="mt-1 text-xs text-cream-dim">Profit per item: {money(profitAtRetail)}</div>
        </div>
      </div>
    </ToolShell>
  );
}

/* ── Week 3: Customer Avatar Generator ────────────────────────── */

export function AvatarGenerator() {
  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState('25-34');
  const [painPoints, setPainPoints] = useState('');
  const [spendingHabits, setSpendingHabits] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [values, setValues] = useState('');
  const [generated, setGenerated] = useState(false);

  const dossier = useMemo(() => {
    return `IDEAL BUYER DOSSIER
========================

Name: ${name || 'Unnamed Avatar'}
Age Range: ${ageRange}
Primary Platform: ${platform}

PAIN POINTS
${painPoints || 'Not specified'}

SPENDING HABITS
${spendingHabits || 'Not specified'}

VALUES & PRIORITIES
${values || 'Not specified'}

POSITIONING ANGLE
Target this buyer by speaking directly to their pain points in your captions.
Use ${platform} as your primary channel. Highlight quality, craftsmanship, and
how your products solve ${painPoints ? 'the problem of ' + painPoints.toLowerCase() : 'their specific needs'}.
`;
  }, [name, ageRange, painPoints, spendingHabits, platform, values]);

  return (
    <ToolShell
      icon={Users}
      title="Customer Avatar Generator"
      description="Answer key questions about your ideal customer. The tool auto-generates a downloadable Ideal Buyer Dossier you can save and reference."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Avatar Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Luxury Lisa" />
        </div>
        <div>
          <label className={labelClass}>Age Range</label>
          <select value={ageRange} onChange={(e) => setAgeRange(e.target.value)} className={`${inputClass} cursor-pointer`}>
            <option value="18-24">18–24</option>
            <option value="25-34">25–34</option>
            <option value="35-44">35–44</option>
            <option value="45-54">45–54</option>
            <option value="55+">55+</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Pain Points</label>
          <textarea value={painPoints} onChange={(e) => setPainPoints(e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="What problems do they have that your products solve?" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Spending Habits</label>
          <textarea value={spendingHabits} onChange={(e) => setSpendingHabits(e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="How do they shop? What triggers a purchase?" />
        </div>
        <div>
          <label className={labelClass}>Primary Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={`${inputClass} cursor-pointer`}>
            <option>Instagram</option>
            <option>TikTok</option>
            <option>Facebook</option>
            <option>Pinterest</option>
            <option>Etsy</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Values & Priorities</label>
          <input value={values} onChange={(e) => setValues(e.target.value)} className={inputClass} placeholder="Quality, sustainability, uniqueness..." />
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button onClick={() => setGenerated(true)} className={btnClass}>Generate Dossier</button>
        {generated && (
          <>
            <CopyButton text={dossier} />
            <a
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(dossier)}`}
              download="ideal-buyer-dossier.txt"
              className="flex items-center gap-1.5 border border-gold/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold hover:bg-gold/10"
            >
              <Download size={13} /> Download
            </a>
          </>
        )}
      </div>
      {generated && (
        <pre className="mt-5 whitespace-pre-wrap border border-gold/10 bg-black/30 p-5 text-xs leading-relaxed text-cream-dim">{dossier}</pre>
      )}
    </ToolShell>
  );
}

/* ── Week 4: Product Description Copywriter ───────────────────── */

export function DescriptionWriter() {
  const [productType, setProductType] = useState('Custom Satin Hooded Sweatshirt');
  const [features, setFeatures] = useState('');
  const [tone, setTone] = useState('Luxury & Refined');
  const [output, setOutput] = useState('');

  const generate = () => {
    const featList = features.split('\n').filter(Boolean);
    const toneMap: Record<string, string> = {
      'Luxury & Refined': 'Indulge in',
      'Bold & Urban': 'Step up your game with',
      'Warm & Instructional': 'Meet your new favorite',
    };
    const opener = toneMap[tone] || 'Discover';
    const body = featList.length
      ? featList.map((f) => `• ${f}`).join('\n')
      : '• Premium quality materials\n• Expert craftsmanship\n• Made to last';
    setOutput(`${opener} the ${productType} — handcrafted for those who refuse to settle.

${body}

Every stitch tells a story of quality and care. This isn't fast fashion.
This is wearable art, made just for you.

Limited quantities. Made to order. Ships in 2–3 weeks.`);
  };

  return (
    <ToolShell
      icon={FileText}
      title="Product Description Copywriter"
      description="Select your product type, list key features, choose your brand tone, and get an SEO-friendly product description ready to paste into Shopify or Etsy."
    >
      <div className="grid gap-4">
        <div>
          <label className={labelClass}>Product Type</label>
          <input value={productType} onChange={(e) => setProductType(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Key Features (one per line)</label>
          <textarea value={features} onChange={(e) => setFeatures(e.target.value)} className={`${inputClass} min-h-[100px] resize-y`} placeholder={'100% satin lining\nReinforced seams\nCustom sizing available'} />
        </div>
        <div>
          <label className={labelClass}>Brand Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)} className={`${inputClass} cursor-pointer`}>
            <option>Luxury & Refined</option>
            <option>Bold & Urban</option>
            <option>Warm & Instructional</option>
          </select>
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button onClick={generate} className={btnClass}>Generate Description</button>
        {output && <CopyButton text={output} />}
      </div>
      {output && (
        <pre className="mt-5 whitespace-pre-wrap border border-gold/10 bg-black/30 p-5 text-sm leading-relaxed text-cream">{output}</pre>
      )}
    </ToolShell>
  );
}

/* ── Week 5: 30-Day Content Matrix ─────────────────────────────── */

const CONTENT_PILLARS = ['Process / Behind-the-Seams', 'Styling / Transformation', 'Educational / Quality Comparison', 'Direct Pitch / Sales'];

const HOOK_TEMPLATES = [
  'POV: you found the maker who actually gets your style',
  'Watch me turn $12 of fabric into a $150 statement piece',
  '3 reasons your bonnet falls off at night (and how to fix it)',
  'This took 4 hours. Here\'s why I\'d do it again.',
  'The difference between handmade and fast fashion, side by side',
  'Stitching close-up — can you tell which is mine?',
  'Before & after: custom set transformation',
  'Why I charge what I charge (breakdown)',
  'Behind the seams: a day in my studio',
  'How to style a custom hoodie 3 ways',
  'Fabric testing: does yours pass the stretch test?',
  'Unboxing my own order — quality check',
  'The seam that makes handmade worth it',
  'From sketch to finished piece in 60 seconds',
  'What $200 handmade looks like vs $20 fast fashion',
  'Custom order reveal — she cried',
  '5 things I check before shipping every order',
  'How to care for your handmade pieces',
  'The packaging ritual — every order gets this',
  'Why I started sewing — my story',
  'Thread count matters. Here\'s proof.',
  'Watch me price this custom order in real time',
  'The most underrated stitch in garment making',
  'Transforming a thrift find with custom details',
  'What a $300 custom set actually looks like',
  'Quick tip: how to measure yourself for custom orders',
  'The fabric haul that\'s changing my whole collection',
  'Behind the scenes of a 10-order batch day',
  'Why my waitlist is 6 weeks (and why that\'s good)',
  'Final reveal: the collection drop is live',
];

export function ContentMatrix() {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    const next = new Set(checked);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setChecked(next);
  };

  return (
    <ToolShell
      icon={Calendar}
      title="30-Day Content Matrix"
      description="A pre-loaded calendar of 30 video hooks and reel concepts for custom apparel. Check off each day as you post. Mix across all four content pillars."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {CONTENT_PILLARS.map((p, i) => (
          <span key={i} className="border border-gold/15 bg-gold/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">{p}</span>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {HOOK_TEMPLATES.map((hook, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`flex items-start gap-3 border p-3 text-left transition-colors ${
              checked.has(i)
                ? 'border-green/30 bg-green/10'
                : 'border-gold/10 bg-white/3 hover:border-gold/20'
            }`}
          >
            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${checked.has(i) ? 'border-green bg-green/20 text-green' : 'border-gold/20 text-transparent'}`}>
              <Check size={12} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Day {i + 1}</div>
              <div className="mt-0.5 text-sm text-cream">{hook}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-cream-dim">
        {checked.size} of 30 days completed
      </div>
    </ToolShell>
  );
}

/* ── Week 6: Social Bio & Link-in-Bio Optimizer ────────────────── */

export function BioOptimizer() {
  const [bio, setBio] = useState('');
  const [link, setLink] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const analyze = () => {
    const tips: string[] = [];
    let s = 0;
    if (bio.length > 0) s += 20;
    else tips.push('Your bio is empty. Write one!');
    if (bio.length <= 150) s += 15;
    else tips.push('Bio is too long for Instagram. Trim to 150 characters.');
    if (/shop|buy|order|custom|handmade|maker|sewist/i.test(bio)) s += 20;
    else tips.push('Add keywords like "handmade," "custom," or "maker" for searchability.');
    if (/(shop|store|link|order|buy|book|waitlist)/i.test(bio)) s += 20;
    else tips.push('Add a clear call-to-action (e.g., "Shop custom pieces below").');
    if (link.trim()) s += 15;
    else tips.push('Add a link-in-bio URL (Linktree, Stan Store, or your website).');
    if (/\u2193|\u2799|below|link/i.test(bio)) s += 10;
    else tips.push('Use an arrow (\u2193) to point followers to your link.');
    setScore(s);
    setSuggestions(tips);
  };

  return (
    <ToolShell
      icon={Zap}
      title="Social Bio & Link-in-Bio Optimizer"
      description="Paste your current social bio and link. Get a real-time score and specific suggestions to improve your CTA, keywords, and click-through rate."
    >
      <div className="grid gap-4">
        <div>
          <label className={labelClass}>Your Current Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} className={`${inputClass} min-h-[100px] resize-y`} placeholder="Handmade custom apparel maker. Based in Atlanta. Shop custom pieces below." />
        </div>
        <div>
          <label className={labelClass}>Link-in-Bio URL</label>
          <input value={link} onChange={(e) => setLink(e.target.value)} className={inputClass} placeholder="https://linktr.ee/yourbrand" />
        </div>
      </div>
      <button onClick={analyze} className={`mt-5 ${btnClass}`}>Analyze My Bio</button>
      {score !== null && (
        <div className="mt-5">
          <div className={`${resultBoxClass} ${score >= 70 ? 'border-green/30 bg-green/10' : 'border-gold/30 bg-gold/5'}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Bio Score</div>
            <div className={`mt-1 font-lux text-4xl font-bold ${score >= 70 ? 'text-green' : 'text-gold'}`}>{score}/100</div>
          </div>
          {suggestions.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-cream-dim">
                  <span className="mt-0.5 text-gold">&rarr;</span>
                  {s}
                </li>
              ))}
            </ul>
          )}
          {suggestions.length === 0 && (
            <p className="mt-3 text-center text-sm text-green">Your bio is optimized! You're ready to convert visitors into buyers.</p>
          )}
        </div>
      )}
    </ToolShell>
  );
}

/* ── Week 7: DM Script & Objection Handler ────────────────────── */

const DM_SCENARIOS = [
  {
    trigger: 'Customer says "How much?"',
    script: 'Hey! Thanks for asking. All my pricing and current availability are listed right here: [LINK]. If you see something you love, you can grab it directly. If you need a custom piece, I have a custom order form on the same page. Let me know what catches your eye!',
  },
  {
    trigger: 'Customer says "That\'s too expensive"',
    script: 'I totally understand — handmade isn\'t for everyone. Each piece is made to order with premium materials and hours of skilled labor. The price reflects the quality and the fact that it\'s made just for you. If budget is a concern, I have a few ready-to-ship options at a lower price point here: [LINK]',
  },
  {
    trigger: 'Customer complimented your work but didn\'t buy',
    script: 'Thank you so much! That means the world. If you ever want to treat yourself, my shop is always open here: [LINK]. I also drop new collections monthly — want me to add you to the VIP waitlist so you get first access?',
  },
  {
    trigger: 'Customer asked for a quote then went silent',
    script: 'Hey! Just following up on your custom quote from last week. No pressure at all — just wanted to make sure you had everything you needed. The quote is good for 7 more days, and after that pricing may adjust with the next collection. Let me know! [LINK]',
  },
  {
    trigger: 'Customer asks "Do you have this in stock?"',
    script: 'Great question! Here\'s what\'s currently available: [LINK]. I restock monthly and drop new collections on the 1st. If you want something specific, I can add you to the waitlist for the next drop. Want me to save you a spot?',
  },
  {
    trigger: 'Customer asks "Can you do a discount?"',
    script: 'I appreciate you asking! My pricing reflects the true cost of handmade work. I do offer a VIP waitlist with early access and occasional bundle deals — want me to add you? You\'ll also get first dibs on any sale items before they go public.',
  },
];

export function DMScripts() {
  const [search, setSearch] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  const filtered = DM_SCENARIOS.filter((s) =>
    s.trigger.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ToolShell
      icon={FileText}
      title="DM Script & Objection Handler"
      description="A searchable playbook of copy/paste scripts for every DM scenario — price hesitation, abandoned quotes, compliments, and more."
    >
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={inputClass}
        placeholder="Search scenarios… (e.g., 'too expensive', 'how much')"
      />
      <div className="mt-4 flex flex-col gap-2">
        {filtered.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(DM_SCENARIOS.indexOf(s))}
            className={`border p-3 text-left text-sm transition-colors ${
              DM_SCENARIOS.indexOf(s) === activeIdx
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-gold/10 text-cream-dim hover:border-gold/20'
            }`}
          >
            {s.trigger}
          </button>
        ))}
        {filtered.length === 0 && <p className="text-sm text-cream-dim">No scenarios match your search.</p>}
      </div>
      {DM_SCENARIOS[activeIdx] && (
        <div className="mt-5">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gold">Script</div>
          <div className="border border-gold/15 bg-black/30 p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-cream">{DM_SCENARIOS[activeIdx].script}</p>
          </div>
          <div className="mt-3">
            <CopyButton text={DM_SCENARIOS[activeIdx].script} />
          </div>
        </div>
      )}
    </ToolShell>
  );
}

/* ── Week 8: Brand Voice & Tone Selector ──────────────────────── */

const VOICE_QUIZ = [
  { question: 'When describing your work, you lean toward:', options: ['Elegant and refined', 'Bold and unapologetic', 'Warm and educational', 'Minimal and clean'] },
  { question: 'Your ideal customer responds best to:', options: ['Luxury and exclusivity', 'Confidence and swagger', 'Helpful tips and guidance', 'Simple, clean aesthetics'] },
  { question: 'Your captions tend to be:', options: ['Short and polished', 'Punchy and direct', 'Detailed and informative', 'Understated and subtle'] },
  { question: 'Your brand feels most like:', options: ['A luxury boutique', 'A streetwear label', 'A mentor and guide', 'A minimalist studio'] },
];

const VOICE_RESULTS: Record<number, { name: string; guide: string }> = {
  0: { name: 'Luxury & Refined', guide: 'Your brand voice is polished, elevated, and exclusive. Use words like "indulge," "bespoke," "crafted." Keep captions concise and let the quality speak. Never use slang or overly casual language.' },
  1: { name: 'Bold & Urban', guide: 'Your brand voice is confident, direct, and energetic. Use punchy hooks, bold claims, and speak to the buyer who wants to stand out. Short sentences. Strong verbs. No hedging.' },
  2: { name: 'Warm & Instructional', guide: 'Your brand voice is nurturing, educational, and trustworthy. Share tips, explain your process, teach your audience. Longer captions are fine. Position yourself as a guide, not just a seller.' },
  3: { name: 'Minimal & Clean', guide: 'Your brand voice is understated, precise, and confident. Let the product do the talking. Use simple, clean language. Avoid exclamation marks. Quality over quantity in every word.' },
};

export function BrandVoice() {
  const [answers, setAnswers] = useState<number[]>([-1, -1, -1, -1]);
  const [result, setResult] = useState<number | null>(null);

  const submit = () => {
    const tally = [0, 0, 0, 0];
    answers.forEach((a) => { if (a >= 0) tally[a]++; });
    setResult(tally.indexOf(Math.max(...tally)));
  };

  return (
    <ToolShell
      icon={Users}
      title="Brand Voice & Tone Selector"
      description="Answer four quick questions about your style and audience. Get a customized Brand Voice Style Guide you can use for every caption, email, and product description."
    >
      <div className="flex flex-col gap-5">
        {VOICE_QUIZ.map((q, qi) => (
          <div key={qi}>
            <div className="mb-2 text-sm text-cream">{qi + 1}. {q.question}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => {
                    const next = [...answers];
                    next[qi] = oi;
                    setAnswers(next);
                  }}
                  className={`border p-3 text-left text-sm transition-colors ${
                    answers[qi] === oi
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-gold/10 text-cream-dim hover:border-gold/20'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={submit} disabled={answers.some((a) => a < 0)} className={`mt-5 ${btnClass}`}>
        Generate My Style Guide
      </button>
      {result !== null && (
        <div className="mt-5 border border-gold/20 bg-gold/5 p-5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Your Brand Voice</div>
          <div className="mt-1 font-lux text-2xl font-bold text-cream">{VOICE_RESULTS[result].name}</div>
          <p className="mt-3 text-sm leading-relaxed text-cream-dim">{VOICE_RESULTS[result].guide}</p>
          <div className="mt-3">
            <CopyButton text={`${VOICE_RESULTS[result].name}\n\n${VOICE_RESULTS[result].guide}`} />
          </div>
        </div>
      )}
    </ToolShell>
  );
}

/* ── Week 9: Review & Testimonial Request Generator ───────────── */

export function ReviewGenerator() {
  const [productName, setProductName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [channel, setChannel] = useState('Email');
  const [output, setOutput] = useState('');

  const generate = () => {
    if (channel === 'Email') {
      setOutput(`Hi ${customerName || 'there'},

I hope you're loving your ${productName || 'custom piece'}! I wanted to personally check in and make sure everything arrived perfectly.

If you're happy with your order, I'd be so grateful if you could leave a quick review here: [REVIEW LINK]

It takes less than a minute and helps other buyers feel confident choosing handmade. As a thank-you, I'll send you a 10% off code for your next order.

Thank you for supporting handmade!

— [Your Name]`);
    } else {
      setOutput(`Hey ${customerName || 'there'}! Loving your ${productName || 'custom piece'}? Drop a quick review here: [REVIEW LINK] and get 10% off your next order! Thanks for supporting handmade!`);
    }
  };

  return (
    <ToolShell
      icon={FileText}
      title="Review & Testimonial Request Generator"
      description="Generate custom email or text follow-up templates to request customer reviews and user-generated content 7 days after delivery."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Product Name</label>
          <input value={productName} onChange={(e) => setProductName(e.target.value)} className={inputClass} placeholder="Custom Satin Bonnet" />
        </div>
        <div>
          <label className={labelClass}>Customer Name</label>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} placeholder="Lisa" />
        </div>
        <div>
          <label className={labelClass}>Channel</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className={`${inputClass} cursor-pointer`}>
            <option>Email</option>
            <option>Text</option>
          </select>
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button onClick={generate} className={btnClass}>Generate Template</button>
        {output && <CopyButton text={output} />}
      </div>
      {output && (
        <pre className="mt-5 whitespace-pre-wrap border border-gold/10 bg-black/30 p-5 text-sm leading-relaxed text-cream">{output}</pre>
      )}
    </ToolShell>
  );
}

/* ── Week 10: 14-Day Launch Countdown Checklist ────────────────── */

const LAUNCH_TASKS = [
  { day: -14, task: 'Teaser Story: behind-the-scenes fabric pull' },
  { day: -13, task: 'Post: "Something is coming" hint reel' },
  { day: -12, task: 'Email: tease the collection to your list' },
  { day: -11, task: 'Story: sneak peek of first piece' },
  { day: -10, task: 'Post: fabric / material close-up reel' },
  { day: -9, task: 'Story: poll — "Which colorway?"' },
  { day: -8, task: 'Post: stitching detail showcase' },
  { day: -7, task: 'VIP Waitlist opens — email + story' },
  { day: -6, task: 'Post: "Why this collection" storytelling reel' },
  { day: -5, task: 'Story: countdown sticker starts' },
  { day: -4, task: 'Post: styling / transformation reel' },
  { day: -3, task: 'Email: VIP early access details' },
  { day: -2, task: 'Story: final sneak peek + pricing reveal' },
  { day: -1, task: 'Post: "Tomorrow" hype reel + email reminder' },
  { day: 0, task: 'LAUNCH DAY: Cart open email + story + post + go live' },
];

export function LaunchChecklist() {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    const next = new Set(checked);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setChecked(next);
  };

  return (
    <ToolShell
      icon={Calendar}
      title="14-Day Launch Countdown Checklist"
      description="A day-by-day project tracker for your collection or holiday drop. Check off each task as you complete it leading up to launch day."
    >
      <div className="flex flex-col gap-2">
        {LAUNCH_TASKS.map((t, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`flex items-center gap-4 border p-3 text-left transition-colors ${
              checked.has(i)
                ? 'border-green/30 bg-green/10'
                : t.day === 0
                  ? 'border-gold/40 bg-gold/10'
                  : 'border-gold/10 bg-white/3 hover:border-gold/20'
            }`}
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
              checked.has(i) ? 'border-green bg-green/20 text-green' : 'border-gold/20 text-gold'
            }`}>
              {checked.has(i) ? <Check size={14} /> : t.day > 0 ? `+${t.day}` : t.day}
            </div>
            <span className={`text-sm ${checked.has(i) ? 'text-cream-dim line-through' : 'text-cream'}`}>
              {t.day === 0 ? <strong className="text-gold">{t.task}</strong> : t.task}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-cream-dim">
        {checked.size} of {LAUNCH_TASKS.length} tasks complete
      </div>
    </ToolShell>
  );
}

/* ── Week 11: TikTok / IG Live Sales Script Generator ──────────── */

export function LiveScript() {
  const [collectionName, setCollectionName] = useState('');
  const [pricePoint, setPricePoint] = useState('');
  const [urgency, setUrgency] = useState('Limited quantities — once they\'re gone, they\'re gone');
  const [output, setOutput] = useState('');

  const generate = () => {
    setOutput(`LIVE SELLING RUN-OF-SHOW (30 minutes)
Collection: ${collectionName || '[Your Collection]'}

━━━ SEGMENT 1: INTRO (0–5 min) ━━━
• Welcome viewers by name as they join
• "Today I'm dropping ${collectionName || 'my new collection'} — made to order, limited quantities"
• Show your face, your studio, your energy
• Tease the best piece: "Wait until you see what I have at the end"

━━━ SEGMENT 2: PRODUCT DEMOS (5–20 min) ━━━
• Hold up each piece close to camera
• Show stitching, fabric, details — zoom in
• State price clearly: "This one is ${pricePoint || '$XX'}"
• Tell the story: who it's for, how to style it
• After each piece: "Tap the link in my bio to grab yours"

━━━ SEGMENT 3: URGENCY OFFER (20–25 min) ━━━
• "${urgency}"
• "If you've been on the fence, this is your sign"
• Mention how many are left (even if approximate)
• Remind them: made to order = ships in X weeks

━━━ SEGMENT 4: Q&A (25–28 min) ━━━
• Answer sizing questions
• Answer shipping questions
• Answer custom order questions
• "Yes, I can do custom colors — DM me after the live"

━━━ SEGMENT 5: CHECKOUT CTA (28–30 min) ━━━
• "Last call! Link is in my bio right now"
• "Thank you to everyone who ordered"
• "Follow me for the next drop"
• Stay on for 2 more minutes in case anyone is still checking out`);
  };

  return (
    <ToolShell
      icon={Zap}
      title="TikTok / IG Live Sales Script Generator"
      description="Get a structured run-of-show script for a 30-minute live selling session — intro, product demos, urgency offer, Q&A, and checkout CTA."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Collection Name</label>
          <input value={collectionName} onChange={(e) => setCollectionName(e.target.value)} className={inputClass} placeholder="Holiday Drop Vol. 1" />
        </div>
        <div>
          <label className={labelClass}>Price Point</label>
          <input value={pricePoint} onChange={(e) => setPricePoint(e.target.value)} className={inputClass} placeholder="$85-$250" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Urgency Message</label>
          <input value={urgency} onChange={(e) => setUrgency(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button onClick={generate} className={btnClass}>Generate Live Script</button>
        {output && <CopyButton text={output} />}
      </div>
      {output && (
        <pre className="mt-5 whitespace-pre-wrap border border-gold/10 bg-black/30 p-5 text-xs leading-relaxed text-cream">{output}</pre>
      )}
    </ToolShell>
  );
}

/* ── Week 12: Post-Launch Performance Dashboard ──────────────── */

export function PostLaunch() {
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [topSource, setTopSource] = useState('Instagram');
  const [costs, setCosts] = useState(0);
  const [hoursSpent, setHoursSpent] = useState(0);

  const netProfit = totalSales - costs;
  const aov = totalOrders > 0 ? totalSales / totalOrders : 0;
  const returnOnEffort = hoursSpent > 0 ? netProfit / hoursSpent : 0;
  const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  const recommendations: string[] = [];
  if (profitMargin < 30) recommendations.push('Your profit margin is below 30%. Review your pricing using the Week 2 Profit Calculator — you may be undercharging.');
  if (aov < 50) recommendations.push('Your average order value is low. Consider bundling or adding a premium tier to increase AOV.');
  if (returnOnEffort < 25) recommendations.push('Your return on effort is low. Look at batching production or raising prices to make your time more profitable.');
  if (profitMargin >= 50 && aov >= 100) recommendations.push('Excellent margins and AOV! You\'re ready to scale — consider bulk production or expanding your product line.');
  if (recommendations.length === 0) recommendations.push('Solid performance. Focus on increasing order volume through your top channel and building your waitlist for the next drop.');

  return (
    <ToolShell
      icon={Calculator}
      title="Post-Launch Performance Dashboard"
      description="Input your launch results. Get a summary report showing net profit, return on effort, and recommendations for scaling to your next $10K."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Total Sales Revenue</label>
          <input type="number" value={totalSales} onChange={(e) => setTotalSales(+e.target.value || 0)} className={inputClass} placeholder="0" />
        </div>
        <div>
          <label className={labelClass}>Total Orders</label>
          <input type="number" value={totalOrders} onChange={(e) => setTotalOrders(+e.target.value || 0)} className={inputClass} placeholder="0" />
        </div>
        <div>
          <label className={labelClass}>Top Traffic Source</label>
          <select value={topSource} onChange={(e) => setTopSource(e.target.value)} className={`${inputClass} cursor-pointer`}>
            <option>Instagram</option>
            <option>TikTok</option>
            <option>Etsy</option>
            <option>Email</option>
            <option>Direct</option>
            <option>Facebook</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Total Costs (materials, fees)</label>
          <input type="number" value={costs} onChange={(e) => setCosts(+e.target.value || 0)} className={inputClass} placeholder="0" />
        </div>
        <div>
          <label className={labelClass}>Hours Spent (production + marketing)</label>
          <input type="number" value={hoursSpent} onChange={(e) => setHoursSpent(+e.target.value || 0)} className={inputClass} placeholder="0" />
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className={resultBoxClass}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Net Profit</div>
          <div className="mt-1 font-lux text-2xl font-bold text-cream">{money(netProfit)}</div>
        </div>
        <div className={resultBoxClass}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Profit Margin</div>
          <div className="mt-1 font-lux text-2xl font-bold text-cream">{profitMargin.toFixed(0)}%</div>
        </div>
        <div className={resultBoxClass}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Avg Order Value</div>
          <div className="mt-1 font-lux text-2xl font-bold text-cream">{money(aov)}</div>
        </div>
        <div className={resultBoxClass}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Return on Effort</div>
          <div className="mt-1 font-lux text-2xl font-bold text-cream">{money(returnOnEffort)}/hr</div>
        </div>
      </div>
      <div className="mt-5 border border-gold/20 bg-gold/5 p-5">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gold">Scaling Recommendations</div>
        <ul className="flex flex-col gap-2">
          {recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-cream-dim">
              <span className="mt-0.5 text-gold">&rarr;</span>
              {r}
            </li>
          ))}
        </ul>
        <div className="mt-3 text-xs text-cream-dim">Top traffic source: <strong className="text-gold">{topSource}</strong> — double down here for your next drop.</div>
      </div>
    </ToolShell>
  );
}

/* ── Tool Registry ────────────────────────────────────────────── */

export const TOOL_REGISTRY: Record<string, { component: React.FC; name: string }> = {
  'goal-calculator': { component: GoalCalculator, name: '90-Day Goal & Unit Sales Calculator' },
  'profit-calculator': { component: ProfitCalculator, name: 'Sewing Profit Margin Calculator' },
  'avatar-generator': { component: AvatarGenerator, name: 'Customer Avatar Generator' },
  'description-writer': { component: DescriptionWriter, name: 'Product Description Copywriter' },
  'content-matrix': { component: ContentMatrix, name: '30-Day Content Matrix' },
  'bio-optimizer': { component: BioOptimizer, name: 'Social Bio & Link-in-Bio Optimizer' },
  'dm-scripts': { component: DMScripts, name: 'DM Script & Objection Handler' },
  'brand-voice': { component: BrandVoice, name: 'Brand Voice & Tone Selector' },
  'review-generator': { component: ReviewGenerator, name: 'Review & Testimonial Request Generator' },
  'launch-checklist': { component: LaunchChecklist, name: '14-Day Launch Countdown Checklist' },
  'live-script': { component: LiveScript, name: 'TikTok / IG Live Sales Script Generator' },
  'post-launch': { component: PostLaunch, name: 'Post-Launch Performance Dashboard' },
};

export function getToolComponent(toolId: string | null): React.FC | null {
  if (!toolId) return null;
  return TOOL_REGISTRY[toolId]?.component ?? null;
}
