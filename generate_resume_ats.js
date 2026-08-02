// ATS-first CV for Oron Turgeman — single column, no tables, no text boxes, no images.
// Keyword-bolded so a recruiter scanning in 6 seconds lands on the terms they search for.
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, ExternalHyperlink, LevelFormat, convertInchesToTwip,
} = require('docx');

const INK = '1A1A1A';
const MUTED = '4A4A4A';
const RULE = 'A6A6A6';
const FONT = 'Calibri';

const t = (text, opts = {}) => new TextRun({ text, font: FONT, color: INK, ...opts });

// Section heading: plain uppercase word + a rule. ATS reads the text, humans see the divider.
const h = (text) => new Paragraph({
  spacing: { before: 240, after: 100 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 4 } },
  children: [t(text, { bold: true, size: 22, characterSpacing: 20 })],
});

// Role line + dates on the same paragraph — never a table, ATS scramble those.
const role = (title, org, dates) => [
  new Paragraph({
    spacing: { before: 160, after: 0 },
    children: [t(title, { bold: true, size: 22 })],
  }),
  new Paragraph({
    spacing: { before: 0, after: 60 },
    children: [
      t(org, { size: 20, color: MUTED }),
      t('  |  ', { size: 20, color: MUTED }),
      t(dates, { size: 20, color: MUTED }),
    ],
  }),
];

// Bullets take mixed runs so keywords can be bolded inside the sentence.
const bullet = (runs) => new Paragraph({
  numbering: { reference: 'cv-bullets', level: 0 },
  spacing: { before: 0, after: 60 },
  children: runs.map(r => (typeof r === 'string' ? t(r, { size: 20 }) : t(r[0], { size: 20, bold: true }))),
});

const B = (s) => [s];            // bold keyword inside a bullet
const line = (text, opts = {}) => new Paragraph({ spacing: { after: 60 }, children: [t(text, { size: 20, ...opts })] });

const labelled = (label, value) => new Paragraph({
  spacing: { after: 60 },
  children: [t(label + ': ', { bold: true, size: 20 }), t(value, { size: 20 })],
});

const doc = new Document({
  creator: 'Oron Turgeman',
  title: 'Oron Turgeman — Product Manager / Project Manager / Product Designer',
  description: 'CV',
  numbering: {
    config: [{
      reference: 'cv-bullets',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: convertInchesToTwip(0.22), hanging: convertInchesToTwip(0.15) } } },
      }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: FONT, size: 20, color: INK }, paragraph: { spacing: { line: 264 } } },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 720, bottom: 720, left: 850, right: 850 },
      },
    },
    children: [
      // ---------------------------------------------------------------- header
      new Paragraph({
        spacing: { after: 20 },
        children: [t('ORON TURGEMAN', { bold: true, size: 34, characterSpacing: 30 })],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [t('Product Manager  |  Project Manager  |  Product Designer', { bold: true, size: 22, color: MUTED })],
      }),
      new Paragraph({
        spacing: { after: 40 },
        children: [
          t('Hadera, Israel  ·  052-4541258  ·  ', { size: 19, color: MUTED }),
          new ExternalHyperlink({ link: 'mailto:oron2558@gmail.com', children: [t('oron2558@gmail.com', { size: 19, color: MUTED })] }),
          t('  ·  ', { size: 19, color: MUTED }),
          new ExternalHyperlink({ link: 'https://www.linkedin.com/in/oron-turgeman-892277225', children: [t('linkedin.com/in/oron-turgeman', { size: 19, color: MUTED })] }),
          t('  ·  ', { size: 19, color: MUTED }),
          new ExternalHyperlink({ link: 'https://oronturgemanux.com', children: [t('oronturgemanux.com', { size: 19, color: MUTED })] }),
        ],
      }),

      // ------------------------------------------------------------- summary
      h('PROFESSIONAL SUMMARY'),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          t('Product Manager and Project Manager', { bold: true, size: 20 }),
          t(' with 6+ years leading ', { size: 20 }),
          t('cross-functional projects', { bold: true, size: 20 }),
          t(' in advertising and digital, now building and shipping digital products end-to-end. Advertising project leadership is the same discipline as tech product management — ', { size: 20 }),
          t('briefs, requirements, stakeholders, budgets, deadlines and measurable results', { bold: true, size: 20 }),
          t(' — applied to products instead of campaigns.', { size: 20 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          t('Two products live in the market', { bold: true, size: 20 }),
          t(', including an iOS SaaS app with ', { size: 20 }),
          t('paying subscribers', { bold: true, size: 20 }),
          t(', 486 registered users and a 5.0-star App Store rating — owned solo from ', { size: 20 }),
          t('market research and product characterization (PRD)', { bold: true, size: 20 }),
          t(' through ', { size: 20 }),
          t('UX/UI, delivery, launch and paid go-to-market', { bold: true, size: 20 }),
          t('. Fluent in Hebrew, English and Spanish.', { size: 20 }),
        ],
      }),

      // -------------------------------------------------------- competencies
      h('CORE COMPETENCIES'),
      labelled('Product Management', 'Product Discovery · Product Requirements (PRD) · Product Characterization · Roadmap Planning · Backlog & Prioritization · MVP Definition · Product Lifecycle · KPIs & Success Metrics · Product Strategy'),
      labelled('Project Management', 'End-to-End Delivery · Cross-Functional Leadership · Stakeholder Management · Scope & Timeline Management · Budget Management · Vendor Management · Risk & Dependency Tracking · Agile Ways of Working'),
      labelled('Research & Strategy', 'Market Research · Competitive Analysis · Pricing Strategy · User Research & Interviews · Personas & User Journeys · Business Requirements Analysis · Go-to-Market Strategy'),
      labelled('UX / Product Design', 'User Flows · Information Architecture · Wireframing · Prototyping · High-Fidelity UI · Design Systems · Usability Testing · Accessibility · Mobile (iOS) & Web'),

      // ---------------------------------------------------------- experience
      h('PROFESSIONAL EXPERIENCE'),

      ...role('Founder & Product Manager — Independent Digital Products', 'Self-employed  ·  2 live products in the market', '2024 – Present'),
      bullet([B('Meashrim in Click'), ' (iOS SaaS, event RSVP & seating): built and launched a live product with ', B('486 registered users'), ', ', B('paying subscribers'), ' and a ', B('5.0-star App Store rating'), '.']),
      bullet(['Owned the ', B('full product lifecycle'), ' solo: market research, competitive and pricing analysis, ', B('product characterization (PRD)'), ', UX/UI, delivery, App Store release and post-launch iteration.']),
      bullet(['Ran ', B('market and competitor research'), ' across incumbent RSVP vendors — average price per record, bundled offerings and gaps — and used it to set a ', B('penetration-pricing'), ' and single-system positioning strategy.']),
      bullet(['Characterized the hardest flow in the product, ', B('seating arrangement'), ', from real user constraints rather than screens first — turning a manual, error-prone process into a guided digital one.']),
      bullet(['Took the product to market with a ', B('paid acquisition campaign'), ' and iterated the roadmap on ', B('real paying-user feedback'), ' and usage data.']),
      bullet([B('MyPlanner'), ' (second live product): a wedding planning system consolidating ', B('suppliers, budget and cashback tracking'), ' into one place — requirements defined, feature set prioritized, system shipped and in real use.']),

      ...role('Advertising & Digital Project Coordinator', 'Africa Israel Residences', 'Jan 2023 – Present'),
      bullet(['Lead ', B('digital and marketing projects end-to-end'), ' — research and strategy through execution and performance review.']),
      bullet(['Manage ', B('cross-functional teams'), ' across development, design, media and creative, coordinating scope, dependencies and delivery dates.']),
      bullet(['Write ', B('project briefs'), ' that translate business needs into precise requirements — the same artifact as a product spec, for campaigns.']),
      bullet(['Own ', B('multimillion-shekel budgets'), ' with ', B('vendor management'), ' and ongoing ', B('performance monitoring'), ' against targets.']),
      bullet(['Plan and deliver corporate events, sales days and conferences — full ', B('logistics, scheduling and stakeholder management'), '.']),

      ...role('Advertising & Strategic Project Manager', 'Hamashbir Lazarchan', 'Apr 2020 – Dec 2022'),
      bullet(['Led ', B('cross-channel projects'), ' from concept development to launch across retail, digital and in-store.']),
      bullet(['Drove ', B('digital transformation initiatives'), ' as part of the marketing strategy.']),
      bullet(['Built ', B('annual plans'), ' and steered campaigns from planning to launch, tracking results against goals.']),
      bullet(['Worked with ', B('international suppliers and strategic partners'), ' on brand integration and joint launches.']),
      bullet(['Planned and managed ', B('product launches'), ', corporate events and branding initiatives.']),

      // ----------------------------------------------------------- portfolio
      h('SELECTED PRODUCTS & CASE STUDIES'),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          t('Full case studies, process and screens: ', { size: 20 }),
          new ExternalHyperlink({ link: 'https://oronturgemanux.com', children: [t('oronturgemanux.com', { size: 20, bold: true })] }),
        ],
      }),
      bullet([B('Meashrim in Click'), ' — live iOS SaaS, event RSVP & seating. Market research, pricing strategy, PRD, UX/UI, launch, paid marketing. ', B('Live in the App Store.')]),
      bullet([B('MyPlanner'), ' — wedding planning system: suppliers, budget and cashback in one product. ', B('Live and in use.')]),
      bullet([B('MessAge — AI Messaging CRM'), ' — concept case study: unified inbox across WhatsApp, Instagram and email, AI reply drafting, lead pipeline and an AI agent builder. Discovery, 12 user interviews, full product characterization and UI.']),
      bullet([B('Woofio'), ' — concept case study: all-in-one dog care platform replacing 4+ separate apps. Research, service definition, flows and high-fidelity UI.']),

      // ----------------------------------------------------------- education
      h('EDUCATION & CERTIFICATIONS'),
      ...role('Figma Master Class & Portfolio — Certification Program', 'Dan Shiran', '2025 – 2026'),
      ...role('User Experience Design — UXV Certification Program', 'Tal Florentin (award-winning)', '2024 – 2025'),

      // --------------------------------------------------------------- tools
      h('TOOLS & TECHNOLOGIES'),
      labelled('Design', 'Figma · Sketch · UX Pilot · Design Systems · Prototyping'),
      labelled('Product & Delivery', 'Miro · Product Specs & PRDs · User Flows · Roadmaps · Analytics & Performance Tracking'),
      labelled('Build & AI', 'Claude Code · Lovable · Google Stitch AI · No-code / Low-code · Automation'),

      // ----------------------------------------------------------- languages
      h('LANGUAGES'),
      line('Hebrew — Native  ·  English — Fully proficient  ·  Spanish — Fully proficient'),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(process.argv[2] || 'Oron_Turgeman_Resume.docx', buf);
  console.log('written', process.argv[2]);
});
