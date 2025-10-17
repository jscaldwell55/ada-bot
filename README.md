# Ada Emotion Coach 🌟

A safe, structured emotion recognition and regulation chatbot designed for neurodivergent children (ages 6-12). Ada helps children practice identifying emotions, rating their intensity, and learning self-regulation strategies through short, therapeutic story-based conversations.

---

## 🎯 Vision & Purpose

### The Challenge
Many neurodivergent children (especially those with autism, ADHD, or anxiety) struggle with:
- Identifying and labeling emotions accurately
- Understanding emotion intensity and gradations
- Learning and applying self-regulation strategies
- Limited access to consistent therapeutic support

### The Solution
Ada provides a **closed-domain, AI-mediated micro-intervention** that:
- **Scaffolds emotional awareness** through clinically vetted micro-stories
- **Teaches self-regulation** via evidence-based coping strategies (breathing exercises, grounding techniques, physical regulation)
- **Reduces therapist load** by enabling consistent at-home practice between sessions
- **Provides real-time, safe feedback** in a low-pressure, neurodiversity-affirming environment
- **Tracks progress** with measurable outcomes (emotion accuracy, intensity delta, script completion)

### Not a Replacement for Therapy
Ada is a **practice companion and bridge** — between therapy sessions, between emotional overwhelm and calm, between technology and empathy.

---

## 🏗️ Architecture Overview

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) + TypeScript | SSR, type safety, modern React patterns |
| **UI Components** | shadcn/ui + Radix UI + Tailwind CSS | Accessible primitives, rapid development |
| **State Management** | XState v5 | Finite-state machine for predictable session flow |
| **Database** | Supabase (PostgreSQL) | Real-time database, auth, Row Level Security |
| **LLM** | OpenAI GPT-4o-mini | **Praise generation only** (JSON mode) |
| **Content Safety** | Azure AI Content Safety | Moderation for all AI-generated text |
| **Analytics** | PostHog | Privacy-first, COPPA-compliant tracking |
| **Error Tracking** | Sentry | Real-time monitoring and debugging |
| **TTS (Optional)** | Web Speech API | Browser-native text-to-speech |

### Core Design Principles

1. **Closed-Domain Architecture**
   - All stories and regulation scripts are **pre-vetted by clinicians**
   - No open-ended AI chat or advice generation
   - LLM used **only** for praise message variations (safety-checked)
   - Content is static, therapeutic, and age-appropriate

2. **Finite-State Machine (XState)**
   - Session flow is **deterministic and predictable**
   - Clear state transitions: `greeting → story → emotion → intensity → regulation → script → reflection → praise`
   - No ambiguous states or infinite loops
   - Built-in error recovery and timeout handling

3. **Safety-First**
   - Crisis keyword detection on all child input
   - Parent notification system for safety alerts
   - Azure Content Safety checks on all AI outputs
   - No data stored in localStorage (COPPA compliance)
   - Row Level Security (RLS) enforces parent-child data boundaries

4. **Neurodiversity-Affirming Design**
   - Predictable, consistent UI patterns
   - Optional low-sensory mode (reduced animations, muted colors)
   - Visual + text feedback for all interactions
   - No time pressure or forced progression
   - Celebrates effort, not just "correct" answers

---

## 📁 Project Structure

```
ada-emotion-coach/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles
│   │
│   ├── api/                     # API routes
│   │   ├── sessions/
│   │   │   ├── route.ts        # POST /api/sessions (create)
│   │   │   └── [id]/route.ts   # GET /api/sessions/:id
│   │   ├── rounds/
│   │   │   ├── route.ts        # POST /api/rounds (create)
│   │   │   └── [id]/route.ts   # PATCH /api/rounds/:id
│   │   ├── praise/route.ts     # POST /api/praise (LLM generation)
│   │   └── safety/route.ts     # POST /api/safety (crisis check)
│   │
│   ├── child/[childId]/         # Child-facing routes
│   │   ├── page.tsx            # Welcome screen
│   │   └── session/[sessionId]/page.tsx  # Active session
│   │
│   └── parent/                  # Parent dashboard
│       ├── layout.tsx          # Protected layout
│       ├── page.tsx            # Dashboard home
│       ├── children/new/page.tsx
│       └── [childId]/
│           ├── page.tsx        # Child detail
│           └── progress/page.tsx
│
├── components/
│   ├── session/                # Session flow components
│   │   ├── ChatInterface.tsx  # Main container (XState)
│   │   ├── EmotionPicker.tsx  # Emotion selection grid
│   │   ├── IntensitySlider.tsx # 1-5 rating
│   │   ├── ScriptSelector.tsx # Choose regulation strategy
│   │   ├── ScriptPlayer.tsx   # Guided practice playback
│   │   ├── ReflectionPrompt.tsx
│   │   ├── PraiseDisplay.tsx
│   │   ├── StoryDisplay.tsx
│   │   └── ProgressIndicator.tsx
│   │
│   ├── dashboard/              # Parent dashboard components
│   │   ├── ChildCard.tsx
│   │   ├── ProgressChart.tsx
│   │   ├── SessionHistory.tsx
│   │   └── SafetyAlerts.tsx
│   │
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── slider.tsx
│   │   └── progress.tsx
│   │
│   └── providers/
│       ├── SupabaseProvider.tsx
│       └── PostHogProvider.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client (API routes)
│   │   └── middleware.ts      # Auth middleware
│   │
│   ├── machines/
│   │   └── emotionRoundMachine.ts  # XState FSM
│   │
│   ├── services/              # Business logic
│   │   ├── stories.ts        # Story fetching
│   │   ├── scripts.ts        # Script recommendations
│   │   ├── safety.ts         # Crisis detection
│   │   └── analytics.ts      # Event tracking
│   │
│   ├── validation/
│   │   └── schemas.ts        # Zod schemas
│   │
│   ├── hooks/
│   │   ├── useSession.ts     # Session management
│   │   └── useSafety.ts      # Safety monitoring
│   │
│   └── utils/
│       ├── cn.ts             # Tailwind class merge
│       └── constants.ts      # App constants
│
├── types/
│   ├── database.ts           # Database types
│   ├── api.ts               # API types
│   └── xstate.ts            # State machine types
│
├── content/
│   ├── stories.json         # 30 micro-stories
│   ├── scripts.json         # 5 regulation scripts
│   └── seed.ts              # Seeding script
│
├── supabase/
│   ├── migrations/
│   │   └── 20241017000001_initial_schema.sql
│   └── seed.sql
│
├── public/
│   ├── sounds/              # Optional sound effects
│   └── avatars/             # Avatar emoji images
│
├── .env.local               # Environment variables
├── .env.example             # Template
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔄 Session Flow (State Machine)

Each session consists of **5 emotion rounds**. Each round follows this exact sequence:

```
┌─────────────────────────────────────────────────────────┐
│                    EMOTION ROUND                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  GREETING   │
                    └──────┬──────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ PRESENTING     │
                  │ STORY          │
                  └────────┬───────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ LABELING       │
                  │ EMOTION        │  ← Child picks emotion
                  └────────┬───────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ RATING         │
                  │ INTENSITY      │  ← Child rates 1-5
                  └────────┬───────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ OFFERING       │
                  │ REGULATION     │  ← Show 2-3 scripts
                  └────────┬───────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ RUNNING        │
                  │ SCRIPT         │  ← Step-through practice
                  └────────┬───────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ REFLECTING     │  ← Re-rate intensity
                  └────────┬───────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ PRAISING       │  ← LLM-generated praise
                  └────────┬───────┘
                           │
                           ▼
                  Round complete (repeat 5x)
                           │
                           ▼
                   Session complete!
```

### State Machine Context

```typescript
{
  sessionId: string;
  roundNumber: number;      // 1-5
  roundId: string | null;
  
  // Current story
  story: Story | null;
  
  // Child's progress
  labeledEmotion: EmotionType | null;
  preIntensity: number | null;      // 1-5
  postIntensity: number | null;     // 1-5
  
  // Regulation
  selectedScript: RegulationScript | null;
  availableScripts: RegulationScript[];
  
  // Praise
  praiseMessage: string | null;
  
  // Error handling
  error: string | null;
}
```

---

## 🗃️ Database Schema

### Core Tables

**children**
- Links to parent via `auth.users`
- Stores: nickname (no PII), age_band, avatar, preferences
- RLS ensures parents only see their own children

**stories**
- 30 pre-vetted micro-narratives
- Fields: text, primary_emotion, tags, age_band, intensity_level, scenario_type
- Public read-only access

**regulation_scripts**
- 5 evidence-based coping strategies
- Fields: name, description, steps (JSONB), emotion_tags, duration
- Public read-only access

**sessions**
- Groups 5 emotion rounds
- Tracks: child_id, started_at, completed_at, total_rounds, completed_rounds

**emotion_rounds**
- Individual story interactions
- Tracks: story_id, labeled_emotion, is_correct, pre_intensity, post_intensity, intensity_delta, regulation_script_id, script_completed
- Auto-calculates accuracy and delta via triggers

**safety_alerts**
- Crisis keyword detections
- Triggers parent notification
- Fields: child_id, trigger_text, alert_type, parent_notified, resolved

**parent_feedback**
- Weekly check-ins
- Likert scales (1-5) for engagement, benefit, ease of use
- Qualitative feedback text

### Key Triggers

1. **Auto-calculate intensity delta**: `pre_intensity - post_intensity`
2. **Auto-check emotion accuracy**: Compare `labeled_emotion` to `story.primary_emotion`
3. **Auto-update timestamps**: `updated_at` on record changes

### Analytics Views

- `child_progress_summary`: Aggregates accuracy %, avg delta, session count
- `session_completion_funnel`: Tracks abandonment rates

---

## 🎨 Content Library

### Emotions (7 types)
- **Happy** 😊 - Feeling good and joyful
- **Sad** 😢 - Feeling down or upset
- **Angry** 😠 - Feeling mad or upset
- **Worried** 😰 - Feeling nervous or scared
- **Frustrated** 😤 - Feeling stuck or annoyed
- **Calm** 😌 - Feeling peaceful and relaxed
- **Excited** 🤩 - Feeling energized and eager

### Intensity Levels (1-5)
1. **Tiny** 🔸 - Just a little bit
2. **Small** 🔹 - A small feeling
3. **Medium** 🔶 - A medium feeling
4. **Big** 🔴 - A big feeling
5. **Huge** ⭐ - A very big feeling

### Regulation Scripts (5 strategies)

1. **Bubble Breathing** 🫧 (60s)
   - For: worried, sad, angry, frustrated
   - Slow diaphragmatic breathing
   - 3 rounds of inhale (3s) + exhale (4s)

2. **Wall Pushes** 🧱 (45s)
   - For: angry, frustrated
   - Proprioceptive input (heavy work)
   - Push against wall 2x for 5 seconds each

3. **5-4-3-2-1 Grounding** 👀 (90s)
   - For: worried, overwhelmed
   - Sensory grounding technique
   - Notice: 5 things you see, 4 touch, 3 hear, 2 smell, 1 taste

4. **Gentle Stretch** 🤸 (50s)
   - For: sad, worried, calm
   - Slow body movements
   - Arm reaches, side bends, shoulder rolls, hand shakes

5. **Count to Ten** 🔢 (40s)
   - For: angry, frustrated
   - Simple counting with breathing
   - Slow count from 1-10

### Story Distribution (30 stories)

| Emotion | Count | Age 6-8 | Age 9-12 | Both |
|---------|-------|---------|----------|------|
| Happy | 4 | 1 | 2 | 1 |
| Sad | 6 | 3 | 2 | 1 |
| Angry | 4 | 2 | 1 | 1 |
| Worried | 5 | 2 | 2 | 1 |
| Frustrated | 4 | 1 | 2 | 1 |
| Calm | 3 | 1 | 1 | 1 |
| Excited | 2 | 1 | 1 | 0 |

**Scenario Types**: school (40%), peer (27%), home (20%), solo (10%), family (3%)

---

## 🔒 Safety & Privacy

### Crisis Detection
- **Triggers**: Monitors for keywords like "hurt myself", "want to die", "suicide"
- **Action**: Shows child "Let's get a grown-up" + notifies parent immediately
- **Logging**: All incidents logged in `safety_alerts` table

### Content Safety Pipeline
```
Child Input → Crisis Keyword Check → Store if Safe
                      ↓
                  ALERT! → Notify Parent + Show Support Message

LLM Output → Azure Content Safety API → Store if Safe
                      ↓
                  BLOCKED → Use Fallback Praise
```

### Privacy Compliance (COPPA)
- ✅ Parental consent before first session
- ✅ No PII collected (only nickname, age band)
- ✅ Parent email verification required
- ✅ Data deletion on request
- ✅ No behavioral advertising
- ✅ No localStorage/cookies (all state in memory)
- ✅ Row Level Security enforces data boundaries
- ✅ Anonymized analytics (no cross-session tracking)

### FERPA Considerations
If deployed in schools:
- Educational records protection
- Parent/guardian access rights
- Explicit opt-in required
- Data sharing restrictions

---

## 📊 Metrics & Evaluation

### Clinical Efficacy Metrics

| Metric | Measurement | Target |
|--------|-------------|--------|
| **Emotion Accuracy** | % of correctly labeled emotions | ≥60% (rising trend) |
| **Intensity Delta** | Pre-intensity - Post-intensity | ≥1 point reduction |
| **Script Completion** | % of scripts completed | ≥80% |
| **Session Completion** | % of sessions with 3+ rounds | ≥80% |
| **Parent Satisfaction** | Weekly survey (1-5 scale) | ≥4.0/5.0 |

### Analytics Events (PostHog)

**Session-level**:
- `session_started`, `session_completed`, `session_abandoned`

**Round-level**:
- `emotion_labeled`, `intensity_rated`, `script_selected`, `script_completed`, `reflection_completed`

**Safety**:
- `safety_alert_triggered`, `parent_notified`

**Features**:
- `tts_enabled`, `low_sensory_toggled`

### Success Indicators (First 3 Months)
- 100+ sessions completed across 20 children
- Mean intensity delta ≥1.0
- Emotion accuracy trending upward (60% → 75%)
- Zero unhandled safety incidents
- Parent satisfaction ≥4/5 stars

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm
- Supabase account (free tier works)
- OpenAI API key (for praise generation)
- Azure Cognitive Services account (Content Safety)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ada-emotion-coach.git
cd ada-emotion-coach

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Initialize Supabase
npx supabase init
npx supabase link --project-ref your-project-ref

# Run database migrations
npx supabase db push

# Seed the database
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Required variables (see `.env.example`):
```bash
NEXT_PUBLIC_SUPABASE_URL=          # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=         # Supabase service role key
OPENAI_API_KEY=                    # OpenAI API key
AZURE_CONTENT_SAFETY_ENDPOINT=     # Azure endpoint
AZURE_CONTENT_SAFETY_KEY=          # Azure key
```

Optional:
```bash
NEXT_PUBLIC_POSTHOG_KEY=           # PostHog analytics
NEXT_PUBLIC_SENTRY_DSN=            # Sentry error tracking
```

---

## 🧪 Testing Strategy

### Unit Tests
- Story/script fetching logic
- Crisis keyword detection
- Intensity delta calculations
- Script recommendation algorithm

### Integration Tests
- API routes (sessions, rounds, praise)
- Database triggers (accuracy, delta)
- Safety alert flow
- Parent notification system

### E2E Tests (Playwright)
- Complete session flow (5 rounds)
- Emotion labeling accuracy
- Script playback
- Parent dashboard functionality

### Accessibility Testing
- Keyboard navigation
- Screen reader compatibility (NVDA, JAWS)
- WCAG 2.1 AA compliance
- Color contrast ratios

---

## 📦 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Environment Checklist
- [ ] Supabase production project created
- [ ] RLS policies enabled
- [ ] Database migrations applied
- [ ] Content seeded (stories + scripts)
- [ ] OpenAI API key set (with rate limits)
- [ ] Azure Content Safety configured
- [ ] PostHog project created (if using)
- [ ] Sentry project created (if using)
- [ ] Custom domain configured
- [ ] SSL certificate active

---

## 🔧 Configuration

### Session Configuration
```typescript
// lib/utils/constants.ts
export const SESSION_CONFIG = {
  ROUNDS_PER_SESSION: 5,           // Always 5 rounds
  MIN_ROUNDS_FOR_COMPLETION: 3,    // Minimum to count as valid
  SESSION_TIMEOUT_MS: 15 * 60 * 1000,  // 15 minutes
  ROUND_TIMEOUT_MS: 5 * 60 * 1000,     // 5 minutes per round
  AUTO_PRAISE_THRESHOLD: 1,        // Delta ≥1 gets extra praise
};
```

### Script Recommendations
```typescript
// Emotion → Recommended Scripts
{
  sad: ['bubble-breathing', 'comfort-time', 'gentle-stretch'],
  angry: ['wall-pushes', 'count-to-ten', 'bubble-breathing'],
  worried: ['grounding-5-4-3-2-1', 'bubble-breathing', 'gentle-stretch'],
  frustrated: ['wall-pushes', 'count-to-ten', 'gentle-stretch'],
  // ...
}

// High intensity (4-5): Prioritize physical regulation (wall-pushes)
// Low intensity (1-2): Gentle approaches only
```

---

## 🛣️ Roadmap

### Phase 1: MVP (Current)
- [x] Core session flow (5 rounds)
- [x] Emotion recognition practice
- [x] Self-regulation scripts
- [x] Parent dashboard
- [x] Safety monitoring
- [ ] Beta testing with 20 families

### Phase 2: Enhancement (3 months)
- [ ] Spanish language support
- [ ] More stories (60 total) and scripts (10 total)
- [ ] Progress visualization (charts)
- [ ] Parent weekly reports (email)
- [ ] Therapist portal (view multiple children)
- [ ] Export data for clinical review

### Phase 3: Expansion (6 months)
- [ ] **Empathy Coach** module (perspective-taking)
- [ ] **Conversation Coach** (turn-taking, topic maintenance)
- [ ] **Calm Cloud** (sensory regulation, mindfulness)
- [ ] **Executive Function Helper** (routine planning)
- [ ] Mobile apps (iOS, Android)
- [ ] Offline mode support

### Phase 4: Research (12 months)
- [ ] NIH SBIR grant application
- [ ] Pilot study (n=100 children, 8 weeks)
- [ ] Peer-reviewed publication
- [ ] Partnership with autism clinics
- [ ] Integration with EHR systems

---

## 🤝 Contributing

We welcome contributions from developers, clinicians, researchers, and educators!

### Development Guidelines
1. **Code Style**: Follow TypeScript/ESLint rules
2. **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`)
3. **Testing**: Add tests for new features
4. **Accessibility**: Ensure WCAG 2.1 AA compliance
5. **Safety**: Never bypass content safety checks

### Adding New Content
**Stories**:
1. Write story (2-3 sentences, age-appropriate)
2. Tag with emotion, scenario, intensity
3. Clinical review required
4. Add to `content/stories.json`
5. Run seed script

**Regulation Scripts**:
1. Evidence-based strategy only
2. Clear step-by-step instructions
3. Appropriate timing (duration_ms)
4. Test with children
5. Add to `content/scripts.json`

### Pull Request Process
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request with detailed description

---

## 📚 Resources

### Clinical References
- **CBT for Children**: Kendall, P.C. (2012). "Child and Adolescent Therapy"
- **Emotion Regulation**: Gross, J.J. (2015). "Emotion Regulation: Current Status and Future Prospects"
- **Autism & Emotion**: Baron-Cohen, S. (2011). "The Science of Evil"
- **Interoception**: Mahler, K. (2018). "Interoception: The Eighth Sensory System"

### Technical References
- [XState Documentation](https://xstate.js.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Research Partners
- Autism research centers
- University OT/SLP programs
- School SEL programs
- Pediatric psychology clinics

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Important**: While the code is open source, clinical content (stories and scripts) should be used responsibly and only in therapeutic or educational contexts.

---

## 🙏 Acknowledgments

- Inspired by evidence-based emotion regulation interventions
- Built with insights from OT/SLP professionals, autism specialists, and neurodivergent families
- Special thanks to the open-source community (Next.js, Supabase, XState, shadcn/ui)

---

## 📞 Contact

- **Project Lead**: [Your Name]
- **Email**: ada@example.com
- **Website**: https://ada-emotion.coach
- **GitHub**: https://github.com/your-org/ada-emotion-coach

For clinical inquiries, partnership opportunities, or research collaboration, please reach out via email.

---

**Ada Emotion Coach** is not a replacement for professional therapy. If you or a child you know is in crisis, please contact:
- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741
- **Emergency Services**: 911