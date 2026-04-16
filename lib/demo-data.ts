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
    
    aiResponse: "Great question! Let me guide you through understanding cells by exploring what the lesson material tells us.\n\nFrom the reading, we learn that:\n> \"Cells are the basic building blocks of all living things... Think of cells as tiny factories that carry out all the functions needed for life.\"\n\nWhat do you think this factory analogy means? 🤔\n\nThe material also explains:\n> \"Inside each cell, there are different parts called organelles that each have specific jobs. The nucleus acts like the control center, containing DNA with instructions for the cell.\"\n\nBased on this information, can you identify:\n1. What makes cells so important to living things?\n2. What role does the nucleus play in the cell?\n\nThe lesson goes on to describe how \"Cells work together in multicellular organisms to form tissues, which form organs, which form organ systems.\"\n\n**Reflection Questions**:\n- How might different types of cells (like muscle cells vs. nerve cells) have different structures to match their functions?\n- Why do you think the lesson compares cells to factories?\n\nUse these quotes from the material to develop your understanding, and let me know what conclusions you draw!",
    
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
    
    aiResponse: "Interesting question! Let's work through this together using the lesson material.\n\nThe reading tells us:\n> \"The atmosphere is divided into several distinct layers, each with unique characteristics. The troposphere is the lowest layer (0-10 km) where all weather occurs.\"\n\nBased on this, what can you identify about the first layer?\n\nContinuing with the lesson:\n> \"Above the troposphere is the stratosphere (10-50 km), which contains the protective ozone layer. Unlike the troposphere, temperature increases with height here.\"\n\n**Think about it**: Why might temperature behave differently in the stratosphere compared to the troposphere? What makes the ozone layer significant?\n\nThe material also describes:\n> \"The mesosphere (50-80 km) is the coldest layer where most meteors burn up. Finally, the thermosphere (80+ km) has very high temperatures due to solar activity and is home to auroras and satellites.\"\n\n**Exploration Questions**:\n1. How many main layers can you identify from these descriptions?\n2. What pattern do you notice about how temperature changes as you move up?\n3. Which layer would you say is most important for daily weather, and why?\n\nTry organizing the information from the quotes into a summary - what are the key characteristics of each layer?",
    
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
    
    aiResponse: "Great question about dialogue! Let's discover the answer together using what the lesson teaches.\n\nThe lesson explains:\n> \"Good dialogue sounds natural and reveals character. Each character should have a distinct voice - the way they speak should reflect their personality, background, and current emotional state.\"\n\n**Consider this**: What do you think it means for dialogue to \"reveal character\"? How might two different people say \"hello\" in ways that show their personality?\n\nHere's an important technique from the reading:\n> \"Use dialogue to show, not tell. Instead of writing 'Sarah was angry,' have her say something sharp: 'I can't believe you did that!' The words and tone reveal her emotion without you having to state it directly.\"\n\nCan you think of other emotions you could show through dialogue instead of stating them?\n\nThe lesson also advises:\n> \"Keep it concise. Real people rarely speak in long paragraphs. Break up dialogue with action beats - small physical movements that add context and pacing.\"\n\n**Practice Challenge**: Try rewriting this:\n- Weak: \"John said he was nervous about the test.\"\n- Strong: Using dialogue and action beats, how would you SHOW John's nervousness?\n\nUse these principles from the lesson to craft your dialogue. What makes it feel more authentic?",
    
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
    
    aiResponse: "Excellent topic! Let's explore conflict by examining what the lesson teaches us.\n\nThe reading starts with this key insight:\n> \"Conflict is the engine that drives your story forward. It creates tension and keeps readers engaged. Without conflict, there's no story - just a series of events. Conflict comes from characters wanting something but facing obstacles.\"\n\n**Think about this**: Why do you think the lesson compares conflict to an \"engine\"? What happens to a car without an engine?\n\nNow, let's apply this to a story:\n\nImagine a character named Alex who wants to audition for the school play. Based on the lesson's definition, what elements do you need to create conflict?\n1. What does Alex want? (That's clear - to audition)\n2. What ________ might prevent them from getting it?\n3. Why does this matter to Alex personally?\n\n**Challenge Questions**:\n- If Alex easily auditions and gets the part, do we have conflict? Why or why not?\n- What kinds of obstacles could you add to create tension?\n- According to the lesson, what happens to a story without conflict?\n\n**Extension**: Think of your favorite book or movie. Can you identify the main character's goal and the obstacles they face? How does this create the \"engine\" that drives the story?\n\nUse the lesson's framework to build your understanding of how conflict works!",
    
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
    
    aiResponse: "Perfect question! Let's discover the answer together using what you've learned.\n\nYour lesson gives us this example:\n> \"Multiplication shows up everywhere in daily life! When you're shopping and need to buy multiple items of the same price, that's multiplication. If apples cost $2 each and you want 5 apples, you're calculating 5 × $2 = $10.\"\n\n**Think about it**: \n- In this apple example, why is multiplication faster than addition?\n- What would you have to do if you used addition instead?\n\nNow, let's explore further. The lesson mentions shopping, but where else might you see this pattern of \"repeated groups of the same amount\"?\n\n**Discovery Activity**:\nLook around your daily life:\n1. If you walk 2 miles every day for 7 days, how would multiplication help you find the total distance?\n2. When cooking, if a recipe calls for 3 cups of flour to serve 4 people, how would you use multiplication to serve 8 people?\n3. If you save $5 every week, how could multiplication help you plan for something you want to buy?\n\n**Connection Question**: \nBased on the lesson's shopping example and these scenarios, can you identify the pattern? What makes a situation perfect for using multiplication instead of repeated addition?\n\nTry to come up with 2-3 more real-life examples from your own daily routine where multiplication would be useful!",
    
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
    
    aiResponse: "Great foundational question! Let's build your understanding using the lesson material.\n\nThe lesson explains:\n> \"The four basic arithmetic operations are addition, subtraction, multiplication, and division. Addition combines numbers to find a total. Subtraction finds the difference between numbers. Multiplication is repeated addition, and division splits a number into equal parts.\"\n\n**Let's explore each one**:\n\n1. **Addition** - \"combines numbers to find a total\"\n   - Can you think of a time today when you combined or added things together?\n   - Example: If you have 3 apples and get 2 more, what operation helps you find the total?\n\n2. **Subtraction** - \"finds the difference between numbers\"\n   - When might you need to find a difference or take away?\n   - Try this: You have $10 and spend $3. Which operation shows what's left?\n\n3. **Multiplication** - \"repeated addition\"\n   - What do you think \"repeated addition\" means?\n   - Challenge: Write 4 + 4 + 4 as a multiplication problem\n\n4. **Division** - \"splits a number into equal parts\"\n   - When might you need to split something equally?\n   - If 12 cookies are shared equally among 4 friends, which operation helps?\n\n**Reflection Question**: According to the lesson, how are multiplication and addition related? How are division and subtraction related?\n\nTry creating your own word problems that use each of the four operations!",
    
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
