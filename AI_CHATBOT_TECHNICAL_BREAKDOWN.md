# AI Chatbot Technical Breakdown - AICademy
## Complete Architecture Guide for Implementing Advanced Features (RAG, etc.)

---

## 🏗️ ARCHITECTURE OVERVIEW

### Data Flow Pipeline
```
Frontend (AIChat Component) 
    ↓ sends: { messages, userId, moduleId, lessonId }
API Route (/api/ai-chat) 
    ↓ calls generateSystemPrompt()
Context Gathering (ai-utils.ts) 
    ↓ fetches from Supabase
System Prompt Construction 
    ↓ injects into message array
LLM Request (Ollama/Llama2) 
    ↓ receives response
Response Formatting (ensureMarkdownFormatting) 
    ↓ returns to frontend
UI Rendering (ReactMarkdown)
```

---

## 📁 FILE STRUCTURE

### 1. Frontend Component
**File:** `/components/ai-chat.tsx`

**Key Variables:**
```typescript
interface AIChatProps {
  moduleId: string;      // Current module student is viewing
  lessonId?: string;     // Optional: specific lesson context
}

// State Management
const [isOpen, setIsOpen] = useState(false);                    // Dialog visibility
const [messages, setMessages] = useState<{                      // Chat history
  role: string;          // "user" | "assistant" | "system"
  content: string;       // Message text
}[]>([]);
const [input, setInput] = useState("");                         // User input field
const [isLoading, setIsLoading] = useState(false);             // Loading state
```

**Request Payload to API:**
```typescript
const response = await fetch("/api/ai-chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [...messages, newMessage],  // Full conversation history
    userId: userData.user.id,             // Current user ID from Supabase Auth
    moduleId,                             // Module context
    lessonId,                             // Lesson context (optional)
  }),
});
```

---

### 2. API Route Handler
**File:** `/app/api/ai-chat/route.ts`

**Main Function:**
```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, userId, moduleId, lessonId } = body;
  
  // 1. Generate context-aware system prompt
  const systemPrompt = await generateSystemPrompt({
    userId,
    moduleId,
    lessonId,
  });
  
  // 2. Construct messages with system prompt as first message
  const messagesWithSystem = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];
  
  // 3. Send to LLM
  const ollamaRes = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama2",                    // LLM model name
      messages: messagesWithSystem,       // Complete message array
      stream: false,                      // Non-streaming response
    }),
  });
  
  // 4. Format and return response
  const data = await ollamaRes.json();
  const formattedContent = ensureMarkdownFormatting(data.message?.content || "");
  
  return NextResponse.json({ 
    aiMessage: { role: "assistant", content: formattedContent } 
  });
}
```

**Response Formatting Function:**
```typescript
function ensureMarkdownFormatting(content: string): string {
  // Parses AI response and restructures to match pedagogical format
  const sections = {
    topic: "",           // Header/concept name
    answer: "",          // Main explanation
    quote: "",           // Lesson quote
    followUp: [],        // Follow-up questions
  };
  
  // ... parsing logic ...
  
  // Returns formatted markdown string:
  // ### [Topic]
  // [Explanation]
  // > [Quote from lesson]
  // Would you like me to: ...
}
```

---

### 3. Context Generation Engine
**File:** `/lib/ai-utils.ts`

**Core Interface:**
```typescript
interface StudentContext {
  userId: string;      // Student's Supabase auth ID
  moduleId: string;    // Current module UUID
  lessonId?: string;   // Current lesson UUID (optional)
}
```

**Context Fetching Function:**
```typescript
export async function generateSystemPrompt(context: StudentContext) {
  // STEP 1: Fetch Student Profile
  const { data: studentData } = await supabase
    .from("students")           // Table: students
    .select("*")
    .eq("id", context.userId)
    .single();
  
  // Available fields:
  // - studentData.name          (string)
  // - studentData.level         (number)
  // - studentData.email         (string)
  // - studentData.xp            (number)
  
  // STEP 2: Fetch Module Data
  const { data: moduleData } = await supabase
    .from("modules")            // Table: modules
    .select("*")
    .eq("id", context.moduleId)
    .single();
  
  // Available fields:
  // - moduleData.title          (string)
  // - moduleData.description    (string)
  // - moduleData.subject        (string)
  // - moduleData.created_by     (string - teacher UUID)
  
  // STEP 3: Fetch Lesson Content (if lessonId provided)
  let lessonData = null;
  if (context.lessonId) {
    const { data } = await supabase
      .from("lessons")          // Table: lessons
      .select("*")
      .eq("id", context.lessonId)
      .single();
    lessonData = data;
  }
  
  // Available fields:
  // - lessonData.title          (string)
  // - lessonData.content        (string - HTML/Markdown)
  // - lessonData.order_index    (number)
  // - lessonData.module_id      (string - FK to modules)
  
  // STEP 4: Fetch Student Progress
  const { data: progressData } = await supabase
    .from("student_modules")    // Table: student_modules
    .select("*")
    .eq("student_id", context.userId)
    .eq("module_id", context.moduleId)
    .single();
  
  // Available fields:
  // - progressData.progress     (number 0-1)
  // - progressData.completed_at (timestamp)
  // - progressData.started_at   (timestamp)
  
  // STEP 5: Fetch Recent Quiz Performance
  const { data: quizScores } = await supabase
    .from("quiz_attempts")      // Table: quiz_attempts
    .select("*")
    .eq("student_id", context.userId)
    .order("attempted_at", { ascending: false })
    .limit(5);
  
  // Available fields per attempt:
  // - question_id               (string - FK to quiz_questions)
  // - selected_index            (number - for multiple choice)
  // - answer_text               (string - for free response)
  // - is_correct                (boolean)
  // - attempted_at              (timestamp)
  
  // Calculate metrics
  const quizPerformance = quizScores?.length
    ? `${quizScores.filter((q) => q.is_correct).length}/${quizScores.length} correct`
    : "No recent attempts";
  
  const progressPercentage = progressData?.progress
    ? Math.round(progressData.progress * 100)
    : 0;
  
  // STEP 6: Construct System Prompt
  const systemPrompt = `You are an AI learning coach...
  
  You have access to the following information:
  - Student profile: ${studentData?.name || "Student"}, Level ${studentData?.level || "1"}
  - Current module: ${moduleData?.title || "Current Module"}
  - Current lesson: ${lessonData?.title || "Current Lesson"}
  - Lesson content: ${lessonData?.content || "No lesson content provided"}
  - Recent progress: ${progressPercentage}% complete
  - Recent quiz performance: ${quizPerformance}
  
  [... formatting instructions ...]`;
  
  return systemPrompt;
}
```

---

## 🗄️ DATABASE SCHEMA

### Core Tables Used by AI System

#### 1. `students` Table
```typescript
{
  id: string;              // Primary Key (UUID)
  name: string;            // Student full name
  email: string;           // Student email
  level: number;           // Student level (1-100)
  xp: number;              // Experience points
  created_at: timestamp;
}
```

#### 2. `modules` Table
```typescript
{
  id: string;              // Primary Key (UUID)
  title: string;           // "Introduction to Functions"
  description: string;     // Module overview
  subject: string;         // "math" | "science" | "computer_science" etc.
  created_by: string;      // FK to teachers (UUID)
  status: string;          // "published" | "draft"
  created_at: timestamp;
}
```

#### 3. `lessons` Table
```typescript
{
  id: string;              // Primary Key (UUID)
  module_id: string;       // FK to modules
  title: string;           // "Understanding Variables"
  content: string;         // ⭐ CRITICAL: Full HTML/Markdown lesson content
  order_index: number;     // Position in module (1, 2, 3...)
  created_at: timestamp;
}
```

#### 4. `quiz_questions` Table
```typescript
{
  id: string;              // Primary Key (UUID)
  lesson_id: string;       // FK to lessons
  question: string;        // Question text
  type: string;            // "multiple_choice" | "free_response"
  options: jsonb;          // Array of answer options
  correct_index: number;   // Index of correct option (for multiple choice)
  correct_answer_text: string; // Expected answer (for free response)
}
```

#### 5. `quiz_attempts` Table
```typescript
{
  id: string;              // Primary Key (UUID)
  student_id: string;      // FK to students
  question_id: string;     // FK to quiz_questions
  selected_index: number;  // Student's answer (multiple choice)
  answer_text: string;     // Student's answer (free response)
  is_correct: boolean;     // Whether answer was correct
  attempted_at: timestamp;
}
```

#### 6. `student_modules` Table
```typescript
{
  id: string;              // Primary Key (UUID)
  student_id: string;      // FK to students
  module_id: string;       // FK to modules
  progress: number;        // 0.0 to 1.0 (percentage complete)
  completed_at: timestamp; // When module was completed
  started_at: timestamp;   // When student first accessed module
}
```

#### 7. `lesson_progress` Table
```typescript
{
  id: string;              // Primary Key (UUID)
  student_id: string;      // FK to students
  lesson_id: string;       // FK to lessons
  completed: boolean;      // Whether lesson is completed
  completed_at: timestamp;
  xp_earned: number;       // XP awarded for completion
}
```

---

## 🔑 KEY INSIGHTS FOR RAG IMPLEMENTATION

### Current Limitations (Opportunities for Improvement)

1. **Single Lesson Context**
   - Currently only injects ONE lesson's content into prompt
   - Doesn't access related lessons or prerequisites
   - **RAG Opportunity:** Semantic search across all lesson content

2. **No Historical Context**
   - Doesn't analyze past chat conversations
   - Can't reference previous questions the student asked
   - **RAG Opportunity:** Store chat history in vector database

3. **Static Content Injection**
   - Entire lesson content dumped into prompt (can be huge)
   - No chunking or relevance filtering
   - **RAG Opportunity:** Chunk lessons, retrieve only relevant sections

4. **No Cross-Module Knowledge**
   - AI can't reference other modules the student has taken
   - Can't draw connections between topics
   - **RAG Opportunity:** Index all completed module content

---

## 🚀 RAG IMPLEMENTATION ROADMAP

### Phase 1: Lesson Content Chunking & Embedding

**What to Add:**
```typescript
// New table: lesson_chunks
{
  id: string;
  lesson_id: string;       // FK to lessons
  chunk_text: string;      // 200-500 word segment
  chunk_index: number;     // Position in lesson
  embedding: vector(1536); // OpenAI or sentence-transformers embedding
  metadata: jsonb;         // { section_title, keywords, concepts }
}
```

**Implementation Steps:**
1. Parse lesson HTML/Markdown into semantic chunks
2. Generate embeddings for each chunk
3. Store in Supabase with pgvector extension
4. Create similarity search function

### Phase 2: Query-Based Retrieval

**Modify `generateSystemPrompt()` to:**
```typescript
export async function generateSystemPrompt(
  context: StudentContext,
  userQuery: string  // ⭐ NEW: User's current question
) {
  // ... existing code ...
  
  // NEW: Semantic search for relevant lesson chunks
  const { data: relevantChunks } = await supabase.rpc('search_lesson_chunks', {
    query_embedding: await getEmbedding(userQuery),
    match_threshold: 0.8,
    match_count: 5,
    student_modules: [context.moduleId] // Only search current module initially
  });
  
  // Inject relevant chunks instead of full lesson
  const contextSnippets = relevantChunks
    .map(chunk => `[From ${chunk.lesson_title}]: ${chunk.chunk_text}`)
    .join('\n\n');
  
  const systemPrompt = `...
  Lesson content (relevant sections):
  ${contextSnippets}
  ...`;
}
```

### Phase 3: Conversation Memory

**New table: chat_history**
```typescript
{
  id: string;
  student_id: string;
  module_id: string;
  lesson_id: string;
  role: string;            // "user" | "assistant"
  content: string;
  embedding: vector(1536); // For semantic search of past conversations
  created_at: timestamp;
}
```

**Use Case:**
- "Earlier you asked about X, which relates to..."
- Detect repeated confusion on same topic
- Personalize follow-up questions based on past struggles

### Phase 4: Cross-Module Knowledge Graph

**Enhance with:**
- Prerequisite tracking (Lesson A requires Lesson B)
- Concept tagging (both use "functions" concept)
- Student's learning path analysis

---

## 🛠️ VARIABLE REFERENCE GUIDE

### Critical Variables for AI Context

| Variable | Source | Type | Usage in Prompt |
|----------|--------|------|-----------------|
| `studentData.name` | students table | string | Personalization |
| `studentData.level` | students table | number | Difficulty adjustment |
| `moduleData.title` | modules table | string | Topic context |
| `lessonData.content` | lessons table | string | ⭐ PRIMARY KNOWLEDGE SOURCE |
| `lessonData.title` | lessons table | string | Current topic |
| `progressData.progress` | student_modules | number (0-1) | Progress indicator |
| `quizScores` | quiz_attempts | array | Performance tracking |
| `quizPerformance` | calculated | string | "3/5 correct" |
| `progressPercentage` | calculated | number | 0-100% |

---

## 📊 CURRENT PROMPT STRUCTURE

```
SYSTEM PROMPT TEMPLATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are an AI learning coach...

Context Variables Injected:
├─ Student: ${name}, Level ${level}
├─ Module: ${moduleTitle}
├─ Lesson: ${lessonTitle}
├─ Lesson Content: ${lessonContent}  ← FULL HTML/MARKDOWN
├─ Progress: ${progressPercentage}%
└─ Quiz Performance: ${quizPerformance}

Formatting Rules:
├─ Topic header (###)
├─ 2-3 sentence explanation
├─ Lesson quote (blockquote)
└─ 3 follow-up questions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER MESSAGE(S):
[Conversation history]

ASSISTANT RESPONSE:
[Generated by LLM]
```

---

## 💡 RECOMMENDATIONS FOR AI ENGINEERING PRACTICE

### Beginner-Friendly Improvements
1. **Add conversation summarization** - Summarize long chats to reduce token usage
2. **Implement caching** - Cache system prompts for same lesson/module
3. **Add prompt templates** - Different templates for different question types
4. **Experiment with temperature** - Currently not set, defaults to model default

### Intermediate RAG Features
1. **Hybrid search** - Combine keyword search + semantic search
2. **Reranking** - Use cross-encoder to rerank retrieved chunks
3. **Context windowing** - Sliding window over lesson content
4. **Metadata filtering** - Filter by subject, difficulty level before embedding search

### Advanced Enhancements
1. **Multi-turn reasoning** - Chain of thought prompting for complex questions
2. **Self-critique loops** - AI evaluates own answers before responding
3. **Knowledge graph integration** - Connect concepts across all modules
4. **Adaptive difficulty** - Adjust explanation complexity based on quiz performance

---

## 🎯 NEXT STEPS TO ADD RAG

### Minimal RAG Implementation (Weekend Project)

1. **Install pgvector extension in Supabase**
2. **Create embeddings for existing lesson content:**
   ```typescript
   // Script: scripts/generate-embeddings.ts
   for (const lesson of allLessons) {
     const chunks = chunkLesson(lesson.content);
     for (const chunk of chunks) {
       const embedding = await openai.embeddings.create({
         model: "text-embedding-3-small",
         input: chunk.text,
       });
       await supabase.from('lesson_chunks').insert({
         lesson_id: lesson.id,
         chunk_text: chunk.text,
         embedding: embedding.data[0].embedding
       });
     }
   }
   ```

3. **Modify API route to accept user query separately:**
   ```typescript
   const body = await req.json();
   const { messages, userId, moduleId, lessonId } = body;
   const latestUserMessage = messages[messages.length - 1].content;
   
   const systemPrompt = await generateSystemPrompt({
     userId,
     moduleId,
     lessonId,
   }, latestUserMessage); // Pass query for RAG retrieval
   ```

4. **Update `generateSystemPrompt` to use semantic search**
5. **Test with example queries**

---

## 📝 PEDAGOGICAL APPROACH

### Current AI Tutor Strategy

The AI is engineered to act as a **Socratic learning coach** rather than an answer machine:

1. **Brief Explanations** - Forced to 2-3 sentences to prevent over-explaining
2. **Lesson Quotes** - Redirects students back to their learning materials
3. **Question-Based Follow-ups** - Uses Socratic method to prompt deeper exploration

### Example AI Response Format

```markdown
### Functions

Functions are like cookbook recipes, allowing you to organize and simplify your code 
by packaging it into reusable blocks. They make your code more maintainable and efficient 
by enabling you to reuse code without duplicating it.

From the lesson:
> Functions are like smart little robots that perform specific tasks whenever we call them. 
> They help us hide complex details and focus only on what the function does.

Would you like me to:
• Show you a practical example of functions in action?
• Explain how functions reduce code repetition?
• Demonstrate how this works in a real project?
```

---

## 🔧 TECHNICAL STACK

- **Frontend:** Next.js (TypeScript), React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **LLM:** Llama2 via Ollama (local inference)
- **Rendering:** ReactMarkdown with custom components
- **Styling:** Custom orange (#f97316) accent theme

---

## 📍 FILE LOCATIONS

```
/components/
  └─ ai-chat.tsx                 # Frontend chat component

/app/api/ai-chat/
  └─ route.ts                    # API route handler

/lib/
  ├─ ai-utils.ts                 # Context generation engine
  ├─ supabaseClient.ts           # Supabase client
  └─ database.types.ts           # TypeScript types for DB

/app/(student)/student/modules/[id]/
  └─ module-view.tsx             # Alternative chat implementation
```

---

## 🚀 Getting Started with AI Engineering

### Practice Projects (Ordered by Difficulty)

1. **Add temperature control** - Experiment with different creativity levels
2. **Implement prompt templates** - Create different templates for different subjects
3. **Add chat history persistence** - Store conversations in database
4. **Build simple RAG** - Start with keyword search before moving to embeddings
5. **Create evaluation metrics** - Measure response quality, relevance, helpfulness

---

**Last Updated:** April 12, 2026  
**Version:** 1.0  
**Author:** Alex Rendler
