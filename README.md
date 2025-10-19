# Ada Bot 🌟

A safe, structured emotion recognition and regulation chatbot designed for neurodivergent children (ages 6-12). Ada helps children practice identifying emotions, rating their intensity, and learning self-regulation strategies through short, therapeutic story-based conversations with natural voice interaction.

Ada was inspired by this paper: "Using Artificial Intelligence to Improve Empathetic Statements in Autistic Adolescents and Adults: A Randomized Clinical Trial". 
https://www.researchgate.net/publication/389029249_Using_Artificial_Intelligence_to_Improve_Empathetic_Statements_in_Autistic_Adolescents_and_Adults_A_Randomized_Clinical_Trial
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
- **Delivers natural voice interaction** with child-friendly, emotionally expressive speech
- **Tracks progress** with measurable outcomes (emotion accuracy, intensity delta, script completion)

### Not a Replacement for Therapy
Ada is a **practice companion and bridge** — between therapy sessions, between emotional overwhelm and calm, between technology and empathy.

---

## 🏗️ Architecture Overview

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) + TypeScript | SSR, type safety, modern React patterns |
| **UI Components** | Radix UI + Tailwind CSS | Accessible primitives, rapid development |
| **State Management** | XState v5 | Finite-state machine for predictable session flow |
| **Database** | Supabase (PostgreSQL) | Real-time database, auth, Row Level Security |
| **AI Agents** | OpenAI GPT-4 & GPT-4o-mini | **Observer Agent** (analysis) + **Action Agent** (content generation) |
| **Voice Interaction** | ElevenLabs API | Natural text-to-speech with child-friendly voice |
| **Content Safety** | Multi-layer pipeline | Crisis keywords, inappropriate content, pseudoscience detection |

### Core Design Principles

1. **Adaptive Two-Agent Architecture** 🆕
   - **Observer Agent**: Analyzes child's emotional patterns across rounds
   - **Action Agent**: Generates adaptive stories, scripts, and praise
   - Content is **context-aware and personalized** while maintaining clinical safety
   - Automatic fallback to clinician-vetted static content on any safety concern
   - See [Agent Architecture Documentation](./docs/AGENT_ARCHITECTURE.md) for details

2. **Natural Voice Interaction** 🎙️
   - **ElevenLabs-powered speech**: Child-friendly voice reads stories, guides exercises, and delivers praise
   - **Emotional expression**: High-quality, natural-sounding voice optimized for children
   - **Simple integration**: Server-side API calls keep API keys secure
   - **Accessible design**: Always shows text alongside voice, with manual play/pause controls
   - **Graceful fallback**: Automatic Web Speech API fallback if ElevenLabs unavailable

3. **Finite-State Machine (XState)**
   - Session flow is **deterministic and predictable**
   - Clear state transitions: `greeting → story → emotion → intensity → regulation → script → reflection → praise`
   - No ambiguous states or infinite loops
   - Built-in error recovery and timeout handling

4. **Safety-First**
   - Crisis keyword detection on all child input
   - Parent notification system for safety alerts
   - Keyword-based safety checks on all inputs
   - No data stored in localStorage (COPPA compliance)
   - Row Level Security (RLS) enforces parent-child data boundaries

5. **Neurodiversity-Affirming Design**
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
│   │   │   └── route.ts        # POST /api/rounds (create + update)
│   │   ├── agent/              # 🆕 AI Agent endpoints
│   │   │   ├── observe/route.ts           # Observer Agent analysis
│   │   │   ├── generate-story/route.ts    # Adaptive story generation
│   │   │   ├── generate-script/route.ts   # Personalized scripts
│   │   │   └── generate-praise/route.ts   # Context-aware praise
│   │   ├── admin/              # 🆕 Admin endpoints
│   │   │   └── agent-logs/
│   │   │       ├── route.ts    # GET agent generation logs
│   │   │       └── export/route.ts  # Export logs to CSV
│   │   ├── elevenlabs-tts/route.ts      # 🎙️ ElevenLabs TTS endpoint
│   │   ├── scripts/recommended/route.ts  # GET recommended scripts
│   │   ├── praise/route.ts     # POST /api/praise (routes to agents)
│   │   └── safety/route.ts     # POST /api/safety (crisis check)
│   │
│   ├── auth/                    # Authentication routes
│   │   ├── login/page.tsx      # Login page
│   │   ├── signup/page.tsx     # Sign up page
│   │   ├── reset-password/page.tsx  # Password reset
│   │   ├── callback/route.ts   # OAuth callback
│   │   └── logout/route.ts     # Logout handler
│   │
│   ├── admin/                   # 🆕 Admin panel
│   │   └── agent-logs/page.tsx  # Agent generation viewer & analytics
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
│   │   ├── ScriptPlayer.tsx   # Guided practice playback (with voice)
│   │   ├── ReflectionPrompt.tsx
│   │   ├── PraiseDisplay.tsx  # Praise display (with voice)
│   │   ├── StoryDisplay.tsx   # Story display (with voice)
│   │   └── ProgressIndicator.tsx
│   │
│   ├── dashboard/              # Parent dashboard components
│   │   ├── ChildCard.tsx
│   │   ├── ProgressChart.tsx
│   │   ├── SessionHistory.tsx
│   │   └── SafetyAlerts.tsx
│   │
│   ├── admin/                  # 🆕 Admin components
│   │   └── AgentLogsDashboard.tsx  # Agent logs viewer & analytics
│   │
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── slider.tsx
│   │   ├── progress.tsx
│   │   ├── badge.tsx
│   │   └── table.tsx
│   │
│   └── providers/
│       ├── SupabaseProvider.tsx
│       └── PostHogProvider.tsx  # 🆕 Analytics provider
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client (API routes)
│   │   ├── middleware.ts      # Auth middleware
│   │   └── auth-helpers.ts    # Auth helper functions
│   │
│   ├── agents/                # 🆕 AI Agent configuration
│   │   ├── prompts.ts        # System prompts & model config
│   │   └── openai-client.ts  # 🆕 OpenAI client with timeout wrapper
│   │
│   ├── services/              # Business logic
│   │   ├── elevenLabsTTS.ts  # 🎙️ ElevenLabs TTS service
│   │   ├── stories.ts        # Story fetching
│   │   ├── scripts.ts        # Script recommendations
│   │   ├── safety.ts         # Crisis detection
│   │   ├── agentSafety.ts    # 🆕 Agent content safety pipeline
│   │   ├── agentLogger.ts    # 🆕 Agent audit trail logging
│   │   └── analytics.ts      # Event tracking
│   │
│   ├── machines/
│   │   └── emotionRoundMachine.ts  # XState FSM
│   │
│   ├── validation/
│   │   └── schemas.ts        # Zod schemas
│   │
│   ├── hooks/
│   │   ├── useSession.ts     # Session management
│   │   └── useElevenLabsTTS.ts  # 🎙️ ElevenLabs TTS hook
│   │
│   └── utils/
│       ├── utils.ts          # General utilities
│       ├── cn.ts             # Tailwind class merge
│       └── constants.ts      # App constants
│
├── types/
│   ├── database.types.ts    # Supabase auto-generated types
│   ├── database.ts          # Database types (extended with agent columns)
│   ├── agents.ts            # 🆕 Agent-specific types
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
│   │   ├── 20241017000001_initial_schema.sql
│   │   ├── 20241017000002_add_agent_architecture.sql
│   │   └── 20251018150019_add_metadata_to_agent_generations.sql
│   ├── config.toml            # Supabase configuration
│   └── seed.sql               # Database seeding script
│
├── docs/                      # Documentation
│   ├── AGENT_ARCHITECTURE.md  # Complete agent system guide
│   └── VAPI_SETUP.md         # Legacy Vapi setup (deprecated)
│
├── public/
│   ├── sounds/              # Sound effects
│   └── avatars/             # Avatar emoji images
│
├── .env.local               # Environment variables (not in repo)
├── .env.example             # Environment template
├── .eslintrc.json           # ESLint configuration
├── .gitignore               # Git ignore rules
├── next.config.js           # Next.js configuration
├── next-env.d.ts            # Next.js TypeScript declarations
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies
├── package-lock.json        # Dependency lock file
├── verify-scripts.ts        # Script verification utility
│
├── AGENT_AUDIT_REPORT.md    # Agent system audit findings
├── AGENT_ERRORS_FIXED.md    # Agent error resolution log
├── AGENT_SYSTEM_FIXES.md    # Agent system improvements
├── ELEVENLABS_MIGRATION_COMPLETE.md  # ElevenLabs migration notes
└── FIXES_APPLIED.md         # General fixes log
```

---

## 🤖 Two-Agent Adaptive Architecture

Ada uses a sophisticated **two-agent system** to provide personalized, context-aware therapeutic experiences while maintaining clinical safety.

### How It Works

```
┌──────────────────────────────────────────────────────────┐
│  Observer Agent (GPT-4)                                   │
│  ↓ Analyzes: Emotion patterns, regulation effectiveness  │
│  ↓ Outputs: Therapeutic insights & recommendations        │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  Session Context                                          │
│  Cumulative insights across all rounds                    │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  Action Agent (GPT-4 / GPT-4o-mini)                       │
│  ↓ Generates: Adaptive stories, scripts, praise          │
│  ↓ Personalized to child's demonstrated needs             │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  Safety Pipeline                                          │
│  ✓ Crisis keyword filter                                 │
│  ✓ Inappropriate content detection                       │
│  ✓ Pseudoscience check (for scripts)                     │
│  ✓ Length & structure validation                         │
│  → Fallback to static content if ANY check fails         │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  ElevenLabs Voice System 🎙️                              │
│  ↓ Reads: Stories, scripts, and praise                   │
│  ↓ Voice: Child-friendly, natural, high-quality          │
│  → Text always visible alongside voice                    │
└──────────────────────────────────────────────────────────┘
```

### Agent Responsibilities

**Observer Agent (Reflector/Analyzer)**
- 🔍 Passive analysis of child's emotional learning trajectory
- 📊 Pattern detection across rounds (what works, what doesn't)
- 🎯 Recommendations for next therapeutic targets
- 📈 Cumulative context building for session continuity
- **Model**: GPT-4 (Temperature: 0.3 - analytical)

**Action Agent (Generator/Facilitator)**
- 📖 **Story Generation**: Adaptive 2-3 sentence stories based on Observer insights
- 🧘 **Script Adaptation**: Personalized regulation scripts (breathing, grounding, movement)
- 🎉 **Praise Generation**: Context-aware, growth-focused affirmations
- **Models**: GPT-4 (stories/scripts) + GPT-4o-mini (praise)

**ElevenLabs Voice System (Speech Delivery)** 🎙️
- 🗣️ **Natural Voice**: High-quality child-friendly voice (Sarah voice)
- 😊 **Emotional Expression**: Natural-sounding voice optimized for children
- 🔒 **Secure**: Server-side API integration keeps keys secure
- 🔊 **Accessible**: Always shows text, manual controls, Web Speech API fallback

### Key Features

✅ **Adaptive Scaffolding**: Content difficulty adjusts to child's demonstrated skills
✅ **Therapeutic Continuity**: Each round builds on previous insights
✅ **Natural Voice**: Child-friendly speech with appropriate emotional expression
✅ **Safety-First**: Multi-layer validation with automatic fallback
✅ **Neurodiversity-Affirming**: Celebrates diverse coping styles
✅ **Evidence-Based**: Grounded in CBT, DBT, and sensory integration
✅ **Audit Trail**: Complete logging of all AI generations

### Feature Flags & A/B Testing

Agents can be **enabled or disabled per session** for testing:

```typescript
// Agent-enabled session (default)
POST /api/sessions { agent_enabled: true }
→ Adaptive stories, scripts, and praise

// Agent-disabled session
POST /api/sessions { agent_enabled: false }
→ Static content (original 30 stories, 5 scripts)
```

### Documentation

For complete technical details, see:
- 📘 [**Agent Architecture Guide**](./docs/AGENT_ARCHITECTURE.md) - Comprehensive documentation
- 🔧 API endpoints, safety pipeline, database schema
- 📊 Monitoring, testing, and troubleshooting

---

## 🎙️ Voice Interaction with ElevenLabs

Ada uses **ElevenLabs** text-to-speech API for natural, child-friendly voice interaction throughout the therapeutic session.

### How Voice Works

**During Stories** 📖
- "Read Story Aloud" button speaks the entire story
- High-quality, natural-sounding voice reads with clear pronunciation
- Text remains visible on screen for multimodal support
- Stop button available to interrupt playback

**During Regulation Scripts** 🧘
- Each step is read aloud as it appears
- Calm, measured pacing guides child through the exercise
- Natural pauses between instructions for practicing

**During Praise** 🎉
- Praise message auto-plays when displayed
- Warm, encouraging voice celebrates child's effort
- Visual celebration animations accompany voice

### Voice Features

✅ **Natural Voice**: ElevenLabs Sarah voice (child-friendly, warm, clear)
✅ **High Quality**: Advanced AI voice synthesis for natural pronunciation
✅ **Secure**: Server-side API integration keeps API keys safe
✅ **Simple**: Base64 audio streaming, no complex WebSocket management
✅ **Always Accessible**: Text always visible, manual play/stop controls
✅ **Graceful Fallback**: Automatic Web Speech API fallback if ElevenLabs unavailable

### Technical Implementation

**Server-Side Processing** 🔒
- API route at `/api/elevenlabs-tts` handles all ElevenLabs calls
- API key never exposed to client
- Configurable voice settings (stability, similarity, style)

**Client Integration**
- `useElevenLabsTTS` hook provides simple speak/stop interface
- Automatic fallback to Web Speech API if server TTS fails
- Visual indicators show speaking state

### Privacy & Cost

🔒 **No Microphone**: Read-only, no voice input required
🔒 **COPPA Compliant**: ElevenLabs meets children's privacy requirements
🔒 **No Recording**: Audio generated on-demand, not stored
💰 **Free Tier**: 10,000 characters/month (~11 sessions)
💰 **Affordable**: $5/month for 30,000 characters if needed

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
                  │ STORY          │  🎙️ Voice reads story
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
                  │ SCRIPT         │  🎙️ Voice guides steps
                  └────────┬───────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ REFLECTING     │  ← Re-rate intensity
                  └────────┬───────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ PRAISING       │  🎙️ Voice delivers praise
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
- Fields: id, title, text, emotion (happy|sad|angry|scared|calm), age_band (6-7|8-9|10-12), complexity_score (1-5)
- Public read-only access

**regulation_scripts**
- 5 evidence-based coping strategies
- Fields: id, name, description, icon_emoji, recommended_for_emotions (array), recommended_for_intensities (array), duration_seconds, steps (JSONB)
- Public read-only access

**sessions**
- Groups 5 emotion rounds
- Tracks: child_id, started_at, completed_at, total_rounds, completed_rounds, story_ids (array)
- **Agent columns**: cumulative_context (JSONB - Observer insights), agent_enabled (BOOLEAN - feature flag)

**emotion_rounds**
- Individual story interactions within a session
- Tracks: session_id, round_number, story_id, labeled_emotion, pre_intensity (1-5), regulation_script_id, post_intensity (1-5), praise_message, is_correct, started_at, completed_at
- **Agent columns**: observer_context (JSONB), action_agent_story (JSONB), action_agent_script (JSONB), action_agent_praise (TEXT), generation_metadata (JSONB)
- Auto-calculates is_correct by comparing labeled_emotion to story.emotion

**safety_alerts**
- Crisis keyword detections
- Triggers parent notification
- Fields: child_id, session_id, trigger_text, matched_keywords (array), severity (low|medium|high), parent_notified, parent_notified_at, created_at

**parent_feedback**
- Parent feedback on sessions
- Fields: child_id, session_id, rating (1-5), comment (optional), created_at

**agent_generations** 🆕
- Audit trail for all AI agent generations
- Fields: round_id, agent_type (observer|action_story|action_script|action_praise), input_context (JSONB), output_content (JSONB), model_version, safety_flags (array), generation_time_ms, tokens_used, created_at
- Enables monitoring, debugging, and quality assurance

### Key Functions & Triggers

1. **Auto-update timestamps**: `updated_at` column updated on record changes for children table
2. **Emotion accuracy**: Compare `labeled_emotion` to `story.emotion` to calculate `is_correct`
3. **Intensity tracking**: Store both `pre_intensity` and `post_intensity` for regulation effectiveness

---

## 🎨 Content Library

### Emotions (5 types)
- **Happy** 😊 - Feeling good and joyful
- **Sad** 😢 - Feeling down or upset
- **Angry** 😠 - Feeling mad or upset
- **Scared** 😰 - Feeling nervous or afraid
- **Calm** 😌 - Feeling peaceful and relaxed

### Intensity Levels (1-5)
1. **Tiny** 🔸 - Just a little bit
2. **Small** 🔹 - A small feeling
3. **Medium** 🔶 - A medium feeling
4. **Big** 🔴 - A big feeling
5. **Huge** ⭐ - A very big feeling

### Regulation Scripts (5 strategies)

1. **Calm Breathing** 🫧 (30s)
   - For: scared, sad, angry
   - Slow diaphragmatic breathing with hand on belly
   - Breathe in through nose, out through mouth

2. **Body Squeeze** 💪 (45s)
   - For: angry, scared
   - Proprioceptive input (heavy work)
   - Squeeze and release different body parts

3. **5-4-3-2-1 Grounding** 👀 (60s)
   - For: scared, angry
   - Sensory grounding technique
   - Notice: 5 things you see, 4 touch, 3 hear, 2 smell, 1 taste

4. **Gentle Stretch** 🤸 (40s)
   - For: sad, calm
   - Slow body movements
   - Arm reaches, side bends, shoulder rolls

5. **Count and Breathe** 🔢 (35s)
   - For: angry, scared
   - Simple counting with breathing
   - Slow count from 1-10 while breathing deeply

### Story Distribution (30 stories)

| Emotion | Count |
|---------|-------|
| Happy | 7 |
| Angry | 9 |
| Sad | 6 |
| Scared | 5 |
| Calm | 3 |

**Age Bands**: Stories are distributed across age bands (6-7, 8-9, 10-12) to match developmental complexity

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

Agent Output → Multi-Layer Validation → Store if Safe
                      ↓
                  ERROR → Use Fallback Content
```

### Multi-Layer AI Content Safety

All AI-generated content passes through 4 safety checks before reaching children:

1. **Crisis Keywords** - Immediate detection of self-harm, suicide, violence triggers
2. **Inappropriate Content** - Blocks profanity, adult themes, political content
3. **Toxicity Detection** ✨ **Enhanced** - Scans for 40+ toxic patterns across 5 categories:
   - Derogatory/Insulting: "worthless", "pathetic", "useless"
   - Dismissive/Belittling: "cry baby", "grow up", "get over it"
   - Exclusionary/Rejection: "nobody wants", "no one likes"
   - Shaming: "should be ashamed", "disgrace", "failure"
   - Threatening/Aggressive: "shut up", "go away", "i hate"
   - **Zero tolerance**: ANY toxic pattern triggers fallback to static content
4. **Structure Validation** - Ensures appropriate length, format, and developmental level

**Fallback Behavior**: If any check fails, system automatically uses clinician-vetted static content (stories, scripts, praise).

### API Timeout Protection ✨ **New**

All OpenAI API calls have configurable timeouts to prevent hanging sessions:

| Operation | Timeout | Fallback on Timeout |
|-----------|---------|---------------------|
| Observer Agent | 15 seconds | Skip analysis, continue session |
| Story Generation | 10 seconds | Use static story from library |
| Script Adaptation | 10 seconds | Use static script from library |
| Praise Generation | 5 seconds | Use generic praise message |

**Result**: Children never experience broken sessions, even if AI services are slow or unavailable.

### Privacy Compliance (COPPA)
- ✅ Parental consent before first session
- ✅ No PII collected (only nickname, age band)
- ✅ Parent email verification required
- ✅ Data deletion on request
- ✅ No behavioral advertising
- ✅ No localStorage/cookies (all state in memory)
- ✅ Row Level Security enforces data boundaries
- ✅ Minimal analytics (database-only tracking)
- ✅ **Voice privacy**: ElevenLabs is COPPA compliant, no voice recordings stored

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
| **Voice Engagement** | % of sessions using voice features | ≥70% |
| **Parent Satisfaction** | Weekly survey (1-5 scale) | ≥4.0/5.0 |

### Data Collection

All analytics are stored in the Supabase database:

**Session-level**:
- Session start/completion timestamps
- Total rounds and completed rounds
- Session duration
- Voice feature usage

**Round-level**:
- Emotion labeling accuracy
- Pre/post intensity ratings
- Script selection and completion
- Reflection responses

**Safety**:
- Safety alerts with trigger text
- Parent notification status

### Success Indicators (First 3 Months)
- 100+ sessions completed across 20 children
- Mean intensity delta ≥1.0
- Emotion accuracy trending upward (60% → 75%)
- Zero unhandled safety incidents
- Voice engagement ≥70%
- Parent satisfaction ≥4/5 stars

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm
- Supabase account (free tier works)
- OpenAI API key (for two-agent architecture)
- ElevenLabs account (for voice interaction - free tier available)

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

**Note:** Voice features require a valid `ELEVENLABS_API_KEY` in `.env.local`. If not configured, the system automatically falls back to Web Speech API.

### Environment Variables

Required variables:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=          # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=         # Supabase service role key (for API routes)

# OpenAI API Key - Powers the two-agent architecture:
# - Observer Agent: Emotional pattern analysis (GPT-4, 15s timeout)
# - Action Agent: Adaptive story generation (GPT-4, 10s timeout)
# - Action Agent: Script adaptation (GPT-4, 10s timeout)
# - Action Agent: Personalized praise (GPT-4o-mini, 5s timeout)
# Get your key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=                    # OpenAI API key

# ElevenLabs TTS Integration
# Powers natural voice interaction for stories, scripts, and praise
# Get your API key from: https://elevenlabs.io/app/settings/api-keys
# Free tier includes 10,000 characters/month (~11 sessions)
ELEVENLABS_API_KEY=                # Your ElevenLabs API key
```

### ElevenLabs Voice Configuration

The ElevenLabs integration is pre-configured with optimal settings:

1. **Voice**: Sarah (`EXAVITQu4vr4xnSDxMaL`) - child-friendly, warm, clear
2. **Model**: `eleven_turbo_v2_5` - fast, high-quality synthesis
3. **Settings**: Stability 0.5, Similarity 0.75, Style 0.4
4. **Get API Key**:
   - Sign up at https://elevenlabs.io/
   - Navigate to https://elevenlabs.io/app/settings/api-keys
   - Create new API key and add to `.env.local`
5. **Monitor Usage**: Check at https://elevenlabs.io/app/usage

---

## 🧪 Testing Strategy

### Unit Tests
- Story/script fetching logic
- Crisis keyword detection
- Intensity delta calculations
- Script recommendation algorithm
- ElevenLabs TTS service integration

### Integration Tests
- API routes (sessions, rounds, praise)
- Database triggers (accuracy, delta)
- Safety alert flow
- Parent notification system
- Voice session lifecycle

### E2E Tests (Playwright)
- Complete session flow (5 rounds)
- Emotion labeling accuracy
- Script playback with voice
- Voice feature enable/disable
- ElevenLabs API integration
- Web Speech API fallback behavior
- Parent dashboard functionality

### Accessibility Testing
- Keyboard navigation
- Screen reader compatibility (NVDA, JAWS)
- WCAG 2.1 AA compliance
- Color contrast ratios
- Voice + text multimodal support

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
- [ ] ElevenLabs API key configured
- [ ] Environment variables configured
- [ ] Custom domain configured (optional)
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
  ENABLE_VOICE_BY_DEFAULT: true,   // Voice features on by default
};
```

### Script Recommendations
```typescript
// Emotion → Recommended Scripts
{
  sad: ['bubble-breathing', 'gentle-stretch'],
  angry: ['body-squeeze', 'count-and-breathe', 'grounding'],
  scared: ['bubble-breathing', 'grounding', 'body-squeeze'],
  happy: ['gentle-stretch'],
  calm: ['gentle-stretch', 'bubble-breathing'],
}

// High intensity (4-5): Prioritize physical regulation
// Low intensity (1-2): Gentle approaches only
```

---

## 🆕 Recent Updates

### October 2025 - ElevenLabs Migration

#### **ElevenLabs Voice Integration** 🎙️ **New**
- **What Changed**: Migrated from Vapi to ElevenLabs TTS for simpler, more reliable voice interaction
- **Impact**: High-quality, child-friendly voice reads stories, guides regulation exercises, and delivers praise
- **Features**:
  - ElevenLabs Sarah voice (warm, child-appropriate, natural)
  - Server-side API integration (secure API key management)
  - Base64 audio streaming (simple, no WebSocket complexity)
  - Automatic Web Speech API fallback (no single point of failure)
  - Lower cost (free tier sufficient for development/testing)
- **Components**: StoryDisplay, ScriptPlayer, PraiseDisplay use `useElevenLabsTTS` hook
- **Migration Details**: See [ELEVENLABS_MIGRATION_COMPLETE.md](./ELEVENLABS_MIGRATION_COMPLETE.md)

#### **Enhanced Toxicity Detection** ✅
- **What Changed**: Added comprehensive toxic pattern detection with 40+ keywords across 5 categories
- **Impact**: Zero-tolerance policy for subtle harmful language
- **Location**: `lib/services/agentSafety.ts:203-270`

#### **Fixed Agent Audit Trail** ✅
- **What Changed**: Resolved `round_id` foreign key violations
- **Impact**: Complete audit trail for all AI generations
- **Location**: `app/api/rounds/route.ts:77-152`

#### **API Timeout Protection** ✅
- **What Changed**: Added configurable timeout wrapper for all OpenAI API calls
- **Impact**: Prevents hanging sessions if APIs are slow
- **Location**: `lib/agents/openai-client.ts`

---

## 🛣️ Roadmap

### Phase 1: MVP ✅
- [x] Core session flow (5 rounds)
- [x] Emotion recognition practice
- [x] Self-regulation scripts
- [x] Parent dashboard
- [x] Safety monitoring
- [x] **Two-Agent Adaptive Architecture**
- [x] **ElevenLabs Voice Integration** 🎙️
- [x] **Production-Ready Enhancements**
- [ ] Beta testing with 20 families

### Phase 2: Enhancement (3 months)
- [ ] **Voice Enhancement**
  - [ ] Multiple ElevenLabs voice options (voice preferences)
  - [ ] Emotion-aware voice modulation
  - [ ] Parent voice settings in dashboard
- [ ] **Agent Architecture Expansion**
  - [ ] Complete Action Agent script adaptation
  - [ ] Multi-session context tracking
  - [ ] Parent dashboard showing Observer insights
- [ ] Spanish language support (voice + text)
- [ ] Progress visualization (charts)
- [ ] Parent weekly reports (email)
- [ ] Therapist portal

### Phase 3: Expansion (6 months)
- [ ] **Empathy Coach** module with conversational practice
- [ ] **Conversation Coach** (turn-taking, topic maintenance)
- [ ] **Calm Cloud** (sensory regulation, mindfulness)
- [ ] Mobile apps (iOS, Android)
- [ ] Offline mode support

### Phase 4: Research (12 months)
- [ ] Voice interaction efficacy study
- [ ] Agent architecture efficacy study
- [ ] NIH SBIR grant application
- [ ] Pilot study (n=100 children, 8 weeks)
- [ ] Peer-reviewed publication
- [ ] Partnership with autism clinics

---

## 🤝 Contributing

We welcome contributions from developers, clinicians, researchers, and educators!

### Development Guidelines
1. **Code Style**: Follow TypeScript/ESLint rules
2. **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`)
3. **Testing**: Add tests for new features
4. **Accessibility**: Ensure WCAG 2.1 AA compliance
5. **Safety**: Never bypass content safety checks
6. **Voice**: Test with both voice enabled and disabled

### Adding New Content
**Stories**:
1. Write story (2-3 sentences, age-appropriate)
2. Tag with emotion, scenario, intensity
3. Clinical review required
4. Test with voice reading
5. Add to `content/stories.json`
6. Run seed script

**Regulation Scripts**:
1. Evidence-based strategy only
2. Clear step-by-step instructions
3. Test with voice guidance
4. Appropriate timing (duration_ms)
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
- [ElevenLabs Documentation](https://elevenlabs.io/docs/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

