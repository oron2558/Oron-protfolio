# How to Build This Portfolio in Framer — Step by Step

## Prerequisites
- Framer account (free tier works, Pro recommended)
- The HTML/CSS files from this folder as reference
- Your Figma project screenshots exported as PNG

---

## Step 1: Create New Framer Project
1. Go to framer.com → New Project
2. Choose "Blank" template
3. Set canvas to Desktop (1440px)

## Step 2: Set Up Design Tokens
In Framer, go to **Site Settings → Styles**:

### Colors (Dark Premium)
| Token Name | Value |
|-----------|-------|
| Background | #02020a |
| Card Background | #111119 |
| Text Primary | #ffffff |
| Text Secondary | #b0b0b8 |
| Accent | #7c3aed |
| Border | rgba(255,255,255,0.06) |

### Typography
| Level | Font | Weight | Size |
|-------|------|--------|------|
| Display | Playfair Display | 700 | 72px |
| H1 | Playfair Display | 700 | 56px |
| H2 | Playfair Display | 700 | 40px |
| H3 | Inter | 600 | 28px |
| Body | Inter | 400 | 17px |
| Small | Inter | 500 | 14px |
| Tiny | Inter | 700 | 12px |

## Step 3: Build Navigation
1. Add a **Frame** → set to Fixed position, top: 0, width: 100%
2. Height: 72px
3. Background: rgba(2, 2, 10, 0.85) with backdrop blur: 20px
4. Inside, add horizontal Auto Layout:
   - Left: Text "Oron Turgeman" (Inter 700, 18px)
   - Right: Links "Projects" "About" "Contact" + Button "Let's Talk"
5. Set distribution: Space Between
6. Padding: 0 24px
7. Max-width: 1200px, centered

## Step 4: Build Hero Section
1. Add a **Section** → Full viewport height
2. Layout: Vertical, center aligned
3. Add background blur orbs:
   - Frame 1: 500x500, rounded 100%, fill #7c3aed, opacity 8%, blur 80px, absolute positioned top-left
   - Frame 2: 400x400, rounded 100%, fill #3b82f6, opacity 6%, blur 80px, absolute positioned bottom-right
4. Content (centered, max 800px):
   - "Hi there 👋" — Inter 500, 28px, secondary color
   - "I'm Oron, Product Designer" — Playfair Display 700, 72px
   - Apply gradient fill to "Oron" text
   - Subtitle — Inter 400, 22px, secondary color, max 600px
   - 2 buttons horizontal: "View My Work" (accent gradient fill) + "Let's Talk" (outline)
5. Add entrance animations: Fade in + slide up, staggered 0.1s per element

## Step 5: Build Project Cards
1. Add a **Section** with padding 140px top/bottom
2. Header: "Selected Work" label + "Case Studies" title
3. Add a 2-column Grid with 24px gap
4. Each card:
   - Frame: height 520px, border-radius 24px, overflow hidden
   - Background image: your Figma screenshot (Fill → Image → Cover)
   - Overlay frame: absolute positioned, inset 0
   - Overlay gradient: linear-gradient(to bottom, transparent 30%, rgba(2,2,10,0.92))
   - Content at bottom: tags + title + description + "View Case Study →"
   - **Hover**: translateY -8px + shadow increase
   - **Image hover**: scale 1.05
5. Link each card to its case study page

### Card Content:
| Project | Tags | Title | Description |
|---------|------|-------|-------------|
| AI CRM | SaaS, AI, CRM | Supercharging Sales Teams with AI | Designing an intelligent CRM that learns from user behavior |
| FinApp | Fintech, AI, Mobile | Turning Financial Stress into Confidence | AI-powered personal finance companion |
| Woofio | Pet Care, Mobile | Simplifying Pet Care for Busy Owners | Comprehensive dog care app |
| MyPlanner | Productivity, Mobile | Planning Made Personal | Smart daily planner that adapts to your lifestyle |

## Step 6: Build About Section
1. 2-column grid: Text (left) + Photo (right)
2. Left column: "About Me" label + title + paragraphs + tool badges
3. Right column: Your photo with rounded corners
4. Tool badges: horizontal wrap, pill-shaped, card background

## Step 7: Build Footer/Contact
1. Centered layout
2. "Let's create something amazing together" — large display text
3. 2 buttons: "Say Hello" (email link) + "LinkedIn"
4. Divider line
5. Footer links: Email, LinkedIn, Projects
6. Copyright: "© 2026 Oron Turgeman"

## Step 8: Add Breakpoints
1. Click breakpoint icon → Add Tablet (810px) and Mobile (390px)
2. **Tablet adjustments**:
   - Project grid → 1 column
   - About grid → 1 column
   - Reduce section padding to 100px
   - Hide nav links, show hamburger menu
3. **Mobile adjustments**:
   - Section padding: 64px
   - Card height: 340px
   - Hero title: smaller
   - Buttons: full width, stacked

## Step 9: Add Case Study Pages
1. Create a new page for each project
2. Copy structure from casestudy-finapp.html
3. Import Figma screenshots for each section
4. Add "Back to Portfolio" navigation at top
5. Add prev/next project navigation at bottom

## Step 10: Animations
For each section, add **While in View** trigger:
- Type: Fade in
- From: opacity 0, Y +30px
- To: opacity 1, Y 0
- Duration: 0.7s
- Easing: Spring (damping 25, stiffness 200)
- Stagger children by 0.1s

## Step 11: SEO & Metadata
1. Site Settings → SEO
2. Title: "Oron Turgeman — Product Designer"
3. Description: "Product Designer specializing in AI-powered digital experiences"
4. Add Open Graph image (screenshot of hero section)

## Step 12: Publish
1. Click "Publish" button
2. Choose subdomain: oronturgeman.framer.website
3. Or connect custom domain: oronturgeman.com
4. Enable SSL (automatic)

## Step 13: Language Toggle (Optional)
For bilingual support:
1. Use Framer's Localization feature (Pro plan)
2. Add locale: Hebrew (he)
3. Duplicate all text content with Hebrew translations
4. The RTL layout auto-handles with Framer's built-in support

---

## Quick Reference: CSS → Framer Translation
| CSS Property | Framer Setting |
|-------------|---------------|
| display: flex | Auto Layout |
| flex-direction: column | Direction: Vertical |
| flex-direction: row | Direction: Horizontal |
| gap: 24px | Gap: 24 |
| padding: 40px | Padding: 40 |
| justify-content: space-between | Distribution: Space Between |
| align-items: center | Align: Center |
| width: 100% | Width: Fill |
| width: fit-content | Width: Hug |
| border-radius: 24px | Corner Radius: 24 |
| position: fixed | Position: Fixed |
| overflow: hidden | Clip Content: On |
| backdrop-filter: blur(20px) | Background Blur: 20 |
