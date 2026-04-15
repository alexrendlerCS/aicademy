/**
 * Demo Scenarios for RAG Showcase
 * 
 * Pre-computed RAG results for interactive demo
 * No API calls needed - all data is static
 */

export interface DemoChunk {
  text: string;
  similarity: number;
  sectionTitle?: string;
  chunkIndex: number;
}

export interface DemoScenario {
  id: string;
  subject: 'science' | 'reading' | 'math';
  lessonId: string;
  lessonTitle: string;
  question: string;
  
  // RAG metrics
  ragMetrics: {
    chunks: DemoChunk[];
    fullContentTokens: number;
    retrievedTokens: number;
    reductionPercent: number;
    accuracy: number; // 0-100
    contamination: number; // 0-100
    semanticSimilarity: number; // 0-1
    searchTime: number; // ms
  };
  
  // Pre-written AI response
  aiResponse: string;
  
  // Technical details for "How it works" panel
  technical: {
    embeddingDimensions: number;
    totalChunksSearched: number;
    chunkMatches: number;
    hybridSearchUsed: boolean;
    subjectFilterApplied: boolean;
  };
}

export const demoScenarios: DemoScenario[] = [
  // SCIENCE SCENARIOS
  {
    id: 'cells-how-work',
    subject: 'science',
    lessonId: 'e540f377-0d87-4985-877b-7692be4cbcd7',
    lessonTitle: 'Understanding Cells',
    question: 'How do cells work?',
    
    ragMetrics: {
      chunks: [
        {
          text: 'Cells are the basic building blocks of all living things. Every living organism, from the tiniest bacteria to the largest whale, is made up of cells. Think of cells as tiny factories that carry out all the functions needed for life.',
          similarity: 0.72,
          sectionTitle: 'What Are Cells?',
          chunkIndex: 0
        },
        {
          text: 'Inside each cell, there are different parts called organelles that each have specific jobs. The nucleus acts like the control center, containing DNA with instructions for the cell. The mitochondria are like power plants, creating energy the cell needs to function.',
          similarity: 0.68,
          sectionTitle: 'Cell Organelles',
          chunkIndex: 2
        },
        {
          text: 'Cells work together in multicellular organisms to form tissues, which form organs, which form organ systems. For example, muscle cells work together to help you move, while nerve cells help you think and feel.',
          similarity: 0.61,
          sectionTitle: 'Cells Working Together',
          chunkIndex: 5
        }
      ],
      fullContentTokens: 320,
      retrievedTokens: 156,
      reductionPercent: 51.3,
      accuracy: 100,
      contamination: 0,
      semanticSimilarity: 0.67,
      searchTime: 42
    },
    
    aiResponse: "Cells are the fundamental building blocks of all living things! Think of them as tiny factories that perform all the essential functions of life.\n\nHere's how they work:\n\n**Basic Function**: Every cell has a protective outer membrane that controls what goes in and out. Inside, you'll find various organelles (specialized structures) that each have specific jobs.\n\n**Key Components**:\n- **Nucleus**: The control center containing DNA with all the instructions\n- **Mitochondria**: The powerhouses that create energy\n- **Ribosomes**: Protein-making factories\n- **Cell membrane**: The protective barrier\n\n**Working Together**: In your body, billions of cells cooperate to keep you alive. Muscle cells contract to help you move, nerve cells transmit signals so you can think and feel, and blood cells carry oxygen throughout your body.\n\nIt's amazing - every function in your body, from breathing to thinking, comes down to cells doing their specific jobs!",
    
    technical: {
      embeddingDimensions: 768,
      totalChunksSearched: 7,
      chunkMatches: 3,
      hybridSearchUsed: false,
      subjectFilterApplied: true
    }
  },
  
  {
    id: 'atmosphere-layers',
    subject: 'science',
    lessonId: 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a25',
    lessonTitle: "The Earth's Atmosphere",
    question: 'What are the layers of the atmosphere?',
    
    ragMetrics: {
      chunks: [
        {
          text: 'The atmosphere is divided into several distinct layers, each with unique characteristics. The troposphere is the lowest layer (0-10 km) where all weather occurs. Temperature decreases with height here, and it contains about 75% of atmospheric mass.',
          similarity: 0.78,
          sectionTitle: 'Atmospheric Layers',
          chunkIndex: 1
        },
        {
          text: 'Above the troposphere is the stratosphere (10-50 km), which contains the protective ozone layer. Unlike the troposphere, temperature increases with height here. High-altitude aircraft fly in this layer.',
          similarity: 0.74,
          sectionTitle: 'Stratosphere',
          chunkIndex: 2
        },
        {
          text: 'The mesosphere (50-80 km) is the coldest layer where most meteors burn up. Finally, the thermosphere (80+ km) has very high temperatures due to solar activity and is home to auroras and satellites.',
          similarity: 0.69,
          sectionTitle: 'Upper Layers',
          chunkIndex: 3
        }
      ],
      fullContentTokens: 280,
      retrievedTokens: 142,
      reductionPercent: 49.3,
      accuracy: 100,
      contamination: 0,
      semanticSimilarity: 0.74,
      searchTime: 38
    },
    
    aiResponse: "The Earth's atmosphere has four main layers, each with distinct characteristics:\n\n**1. Troposphere (0-10 km)**\n- Closest to Earth's surface\n- Where all weather happens\n- Contains 75% of atmospheric mass\n- Temperature decreases as you go higher\n\n**2. Stratosphere (10-50 km)**\n- Contains the ozone layer that protects us from UV radiation\n- Temperature increases with height\n- Where commercial aircraft fly\n\n**3. Mesosphere (50-80 km)**\n- Coldest layer of the atmosphere\n- Where meteors burn up (shooting stars!)\n\n**4. Thermosphere (80+ km)**\n- Highest layer with very high temperatures\n- Home to the Northern Lights (auroras)\n- Where satellites and the International Space Station orbit\n\nEach layer plays a crucial role in protecting life on Earth and regulating our climate!",
    
    technical: {
      embeddingDimensions: 768,
      totalChunksSearched: 7,
      chunkMatches: 3,
      hybridSearchUsed: false,
      subjectFilterApplied: true
    }
  },
  
  // READING/WRITING SCENARIOS
  {
    id: 'dialogue-writing',
    subject: 'reading',
    lessonId: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a24',
    lessonTitle: 'Dialogue and Voice',
    question: 'How do I write good dialogue?',
    
    ragMetrics: {
      chunks: [
        {
          text: 'Good dialogue sounds natural and reveals character. Each character should have a distinct voice - the way they speak should reflect their personality, background, and current emotional state. Avoid making everyone sound the same.',
          similarity: 0.71,
          sectionTitle: 'Creating Authentic Dialogue',
          chunkIndex: 0
        },
        {
          text: 'Use dialogue to show, not tell. Instead of writing "Sarah was angry," have her say something sharp: "I can\'t believe you did that!" The words and tone reveal her emotion without you having to state it directly.',
          similarity: 0.66,
          sectionTitle: 'Show Don\'t Tell in Dialogue',
          chunkIndex: 2
        },
        {
          text: 'Keep it concise. Real people rarely speak in long paragraphs. Break up dialogue with action beats - small physical movements that add context and pacing. "He crossed his arms. \'I\'m not going.\'"',
          similarity: 0.62,
          sectionTitle: 'Dialogue Techniques',
          chunkIndex: 4
        }
      ],
      fullContentTokens: 172,
      retrievedTokens: 98,
      reductionPercent: 43.0,
      accuracy: 100,
      contamination: 0,
      semanticSimilarity: 0.66,
      searchTime: 35
    },
    
    aiResponse: "Writing great dialogue is about making it sound natural while serving your story. Here are the key principles:\n\n**1. Give Each Character a Unique Voice**\n- Consider their background, age, and personality\n- A teenager speaks differently than a professor\n- Word choice matters: \"Yeah\" vs \"Indeed\"\n\n**2. Show, Don't Tell**\n- Instead of: \"John was nervous\"\n- Write: \"Um, I... I think we should go,\" John stammered\n- The dialogue reveals the emotion\n\n**3. Keep It Real and Concise**\n- People don't speak in paragraphs\n- Use interruptions and incomplete sentences\n- Add action beats: *She glanced away. \"Fine.\"*\n\n**4. Make It Count**\n- Every line should reveal character or advance the plot\n- Cut small talk unless it serves a purpose\n- Subtext is powerful - what's NOT said can be important\n\n**Practice Tip**: Read your dialogue aloud. If it sounds stiff or unnatural, revise it!",
    
    technical: {
      embeddingDimensions: 768,
      totalChunksSearched: 7,
      chunkMatches: 3,
      hybridSearchUsed: false,
      subjectFilterApplied: true
    }
  },
  
  {
    id: 'story-conflict',
    subject: 'reading',
    lessonId: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    lessonTitle: 'Creating Conflict',
    question: 'How do I create conflict in my story?',
    
    ragMetrics: {
      chunks: [
        {
          text: 'Conflict is the engine that drives your story forward. It creates tension and keeps readers engaged. Without conflict, there\'s no story - just a series of events. Conflict comes from characters wanting something but facing obstacles.',
          similarity: 0.71,
          sectionTitle: 'Understanding Conflict',
          chunkIndex: 0
        }
      ],
      fullContentTokens: 170,
      retrievedTokens: 57,
      reductionPercent: 66.5,
      accuracy: 100,
      contamination: 0,
      semanticSimilarity: 0.71,
      searchTime: 29
    },
    
    aiResponse: "Conflict is what makes stories interesting! Here's how to create compelling conflict:\n\n**Types of Conflict**:\n1. **Character vs. Character**: Two people want different things (Harry vs. Voldemort)\n2. **Character vs. Self**: Internal struggles (Should I tell the truth?)\n3. **Character vs. Society**: Fighting against rules or norms\n4. **Character vs. Nature**: Surviving a storm, illness, etc.\n\n**Creating Strong Conflict**:\n- **Give your character a clear goal**: What do they want?\n- **Add obstacles**: What's preventing them from getting it?\n- **Raise the stakes**: What happens if they fail?\n- **Make it personal**: Why does this matter to THEM?\n\n**Example**:\n- Goal: Maya wants to make the soccer team\n- Obstacle: The coach doesn't think she's fast enough\n- Stakes: This is her last chance before moving schools\n- Personal: Her late father loved soccer\n\nConflict drives the story forward and forces characters to grow!",
    
    technical: {
      embeddingDimensions: 768,
      totalChunksSearched: 1,
      chunkMatches: 1,
      hybridSearchUsed: false,
      subjectFilterApplied: true
    }
  },
  
  // MATH SCENARIOS
  {
    id: 'multiplication-real-life',
    subject: 'math',
    lessonId: '3f7c5441-ba8e-45d1-9f2b-13b13ea397f2',
    lessonTitle: 'Real-Life Math Applications',
    question: 'When do I use multiplication in real life?',
    
    ragMetrics: {
      chunks: [
        {
          text: 'Multiplication shows up everywhere in daily life! When you\'re shopping and need to buy multiple items of the same price, that\'s multiplication. If apples cost $2 each and you want 5 apples, you\'re calculating 5 × $2 = $10.',
          similarity: 0.78,
          sectionTitle: 'Shopping and Money',
          chunkIndex: 0
        }
      ],
      fullContentTokens: 158,
      retrievedTokens: 48,
      reductionPercent: 69.6,
      accuracy: 100,
      contamination: 0,
      semanticSimilarity: 0.78,
      searchTime: 31
    },
    
    aiResponse: "Multiplication is everywhere in everyday life! Here are common situations:\n\n**Shopping**:\n- Buying multiple items: 4 notebooks × $3 each = $12\n- Calculating totals at the grocery store\n\n**Cooking**:\n- Doubling a recipe: 2 cups flour × 2 = 4 cups\n- Feeding more people\n\n**Time**:\n- Converting hours to minutes: 3 hours × 60 minutes = 180 minutes\n- Calculating work hours in a week\n\n**Sports & Games**:\n- Scoring: 3 touchdowns × 6 points = 18 points\n- Keeping track of wins and losses\n\n**Planning**:\n- If you save $5 per week, after 10 weeks: 10 × $5 = $50\n- Calculating total distance if you walk 2 miles per day\n\n**Building/Creating**:\n- Finding area: 5 feet × 3 feet = 15 square feet\n- Determining how many tiles you need\n\nMultiplication helps you plan, budget, and solve problems quickly!",
    
    technical: {
      embeddingDimensions: 768,
      totalChunksSearched: 1,
      chunkMatches: 1,
      hybridSearchUsed: false,
      subjectFilterApplied: true
    }
  },
  
  {
    id: 'arithmetic-basics',
    subject: 'math',
    lessonId: '7177ad4e-cc97-4c89-8db0-bd8fcc98be00',
    lessonTitle: 'Understanding Arithmetic',
    question: 'What are the basic arithmetic operations?',
    
    ragMetrics: {
      chunks: [
        {
          text: 'The four basic arithmetic operations are addition, subtraction, multiplication, and division. Addition combines numbers to find a total. Subtraction finds the difference between numbers. Multiplication is repeated addition, and division splits a number into equal parts.',
          similarity: 0.72,
          sectionTitle: 'The Four Operations',
          chunkIndex: 0
        }
      ],
      fullContentTokens: 135,
      retrievedTokens: 60,
      reductionPercent: 55.6,
      accuracy: 100,
      contamination: 0,
      semanticSimilarity: 0.72,
      searchTime: 28
    },
    
    aiResponse: "The four basic arithmetic operations are the foundation of all math:\n\n**1. Addition (+)**\n- Combining numbers together\n- Example: 5 + 3 = 8\n- Real life: Adding items to your shopping cart\n\n**2. Subtraction (−)**\n- Finding the difference between numbers\n- Taking away from a total\n- Example: 10 − 4 = 6\n- Real life: Calculating change after buying something\n\n**3. Multiplication (×)**\n- Repeated addition\n- Example: 4 × 3 = 12 (same as 4 + 4 + 4)\n- Real life: Calculating the cost of multiple items\n\n**4. Division (÷)**\n- Splitting into equal parts\n- Example: 12 ÷ 3 = 4\n- Real life: Sharing pizza slices equally among friends\n\n**Order of Operations**: Remember PEMDAS:\n- Parentheses\n- Exponents\n- Multiplication & Division (left to right)\n- Addition & Subtraction (left to right)\n\nThese four operations are the building blocks for all other math!",
    
    technical: {
      embeddingDimensions: 768,
      totalChunksSearched: 1,
      chunkMatches: 1,
      hybridSearchUsed: false,
      subjectFilterApplied: true
    }
  }
];

// Helper function to get scenarios by subject
export function getScenariosBySubject(subject?: 'science' | 'reading' | 'math'): DemoScenario[] {
  if (!subject) return demoScenarios;
  return demoScenarios.filter(s => s.subject === subject);
}

// Helper function to get a random scenario
export function getRandomScenario(subject?: 'science' | 'reading' | 'math'): DemoScenario {
  const scenarios = getScenariosBySubject(subject);
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

// Get subject display info
export const subjectInfo = {
  science: {
    label: 'Science',
    icon: '🔬',
    color: 'blue',
    description: 'Biology, Chemistry, Physics, Earth Science'
  },
  reading: {
    label: 'Reading & Writing',
    icon: '📚',
    color: 'purple',
    description: 'Creative Writing, Reading Comprehension'
  },
  math: {
    label: 'Mathematics',
    icon: '➕',
    color: 'green',
    description: 'Arithmetic, Algebra, Problem Solving'
  }
} as const;
