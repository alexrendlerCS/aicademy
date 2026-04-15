'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  demoScenarios, 
  getScenariosBySubject, 
  subjectInfo,
  type DemoScenario 
} from '@/lib/demo-data';
import { 
  Sparkles, 
  Target, 
  TrendingDown, 
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  Search,
  Filter,
  Check
} from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
};

interface RAGDemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RAGDemoModal({ open, onOpenChange }: RAGDemoModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<keyof typeof subjectInfo | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [activeProcessStep, setActiveProcessStep] = useState<number>(0);
  const technicalDetailsRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to technical details when expanded
  useEffect(() => {
    if (showTechnicalDetails && technicalDetailsRef.current && sidebarRef.current) {
      setTimeout(() => {
        technicalDetailsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }, 100);
    }
  }, [showTechnicalDetails]);

  const availableScenarios = selectedSubject 
    ? getScenariosBySubject(selectedSubject)
    : demoScenarios;

  const handleReset = () => {
    setSelectedSubject(null);
    setSelectedScenario(null);
    setMessages([]);
    setIsTyping(false);
    setShowTechnicalDetails(false);
    setActiveProcessStep(0);
  };

  const handleScenarioSelect = (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    
    // Add greeting message first (if not already present)
    const greetingMessage: Message = {
      role: 'assistant',
      content: `👋 Hi! I'm your AI Tutor Assistant, powered by Retrieval-Augmented Generation (RAG).

I can help answer questions about Science, Reading, Math, and more!`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: scenario.question,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([greetingMessage, userMessage]);
    
    // Simulate RAG processing
    setTimeout(() => {
      setIsTyping(true);
      setActiveProcessStep(1);
    }, 500);
    
    // Animate through RAG steps
    setTimeout(() => setActiveProcessStep(2), 1200);
    setTimeout(() => setActiveProcessStep(3), 2000);
    setTimeout(() => setActiveProcessStep(4), 2800);
    
    // Show AI response
    setTimeout(() => {
      setIsTyping(false);
      const aiMessage: Message = {
        role: 'assistant',
        content: scenario.aiResponse,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
      setActiveProcessStep(5);
    }, 3800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] p-0">
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">AI Tutor Demo Chat</DialogTitle>
        
        {/* Demo Disclaimer Banner */}
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-center text-yellow-800 dark:text-yellow-200">
            <strong>For Demonstration Purposes Only.</strong> No LLM API used for cost purposes - responses are pre-generated to showcase RAG functionality.
          </p>
        </div>
        
        {/* Chat-style Header */}
        <div className="p-4 border-b bg-background flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold">AI Tutor Assistant</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Online • RAG-Enhanced
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-[70vh]">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Subject Filter - Only show when no scenario selected */}
            {!selectedScenario && (
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filter by subject:</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={selectedSubject === null ? "default" : "outline"}
                    onClick={() => setSelectedSubject(null)}
                  >
                    All Subjects
                  </Button>
                  {(Object.keys(subjectInfo) as Array<keyof typeof subjectInfo>).map((subject) => (
                    <Button
                      key={subject}
                      size="sm"
                      variant={selectedSubject === subject ? "default" : "outline"}
                      onClick={() => setSelectedSubject(subject)}
                      className="gap-1"
                    >
                      <span>{subjectInfo[subject].icon}</span>
                      {subjectInfo[subject].label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Header - Only show when scenario selected */}
            {selectedScenario && (
              <div className="p-4 border-b bg-muted/30">
                <div>
                  <div className="font-semibold">{selectedScenario.lessonTitle}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>{subjectInfo[selectedScenario.subject as keyof typeof subjectInfo].icon}</span>
                    <span>{selectedScenario.subject}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Messages / Welcome Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* AI Greeting Message - Always visible */}
                {messages.length === 0 && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                      <div className="text-sm mb-3">
                        👋 Hi! I'm your AI Tutor Assistant, powered by Retrieval-Augmented Generation (RAG).
                      </div>
                      <div className="text-sm mb-3">
                        I can help answer questions about Science, Reading, Math, and more!
                      </div>
                      <div className="text-xs mt-3 text-muted-foreground">
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )}

                {/* All chat messages */}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      {message.timestamp && (
                        <div className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp}
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sample Questions - Only show when no scenario selected */}
                {!selectedScenario && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs text-muted-foreground text-right px-1 mb-3">
                      💡 Try asking:
                    </div>
                    <div className="space-y-2 flex flex-col items-end">
                      {availableScenarios.map((scenario) => (
                        <button
                          key={scenario.id}
                          onClick={() => handleScenarioSelect(scenario)}
                          className="max-w-[85%] text-left px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary transition-all group"
                        >
                          <div className="text-sm font-medium text-primary group-hover:text-primary/90 transition-colors">
                            {scenario.question}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Input Box - Always visible for realistic feel */}
            <div className="p-4 border-t bg-background">
              {selectedScenario ? (
                // After selection: Show "Try Another" and "Technical Details"
                <div className="flex gap-2">
                  <Button onClick={handleReset} variant="outline" className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Another Question
                  </Button>
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTechnicalDetails(!showTechnicalDetails);
                    }}
                    variant={showTechnicalDetails ? "default" : "outline"}
                  >
                    {showTechnicalDetails ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Technical Details
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                // Before selection: Show realistic chat input (disabled)
                <div className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      disabled
                      className="w-full px-4 py-3 pr-10 border rounded-lg bg-muted/50 cursor-not-allowed text-muted-foreground placeholder:text-muted-foreground/50"
                    />
                    <button 
                      disabled
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      </svg>
                    </button>
                  </div>
                  <button
                    disabled
                    className="p-3 rounded-lg border bg-muted/50 cursor-not-allowed opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Sidebar - Only show when scenario selected */}
          {selectedScenario && (
            <div ref={sidebarRef} className="w-80 overflow-y-auto bg-muted/10 border-l">
              <div className="p-4 border-b bg-background">
                <h3 className="font-semibold flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  RAG Process
                </h3>
              </div>

              <div className="p-4 space-y-4">
                {/* Metrics */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase">
                    Performance Metrics
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-background rounded-lg border">
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                      <div className="text-lg font-bold text-green-600">
                        {selectedScenario.ragMetrics.accuracy}%
                      </div>
                    </div>
                    <div className="p-3 bg-background rounded-lg border">
                      <div className="text-xs text-muted-foreground">Contamination</div>
                      <div className="text-lg font-bold text-green-600">
                        {selectedScenario.ragMetrics.contamination}%
                      </div>
                    </div>
                    <div className="p-3 bg-background rounded-lg border">
                      <div className="text-xs text-muted-foreground">Token Reduction</div>
                      <div className="text-lg font-bold text-blue-600">
                        {selectedScenario.ragMetrics.reductionPercent.toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-3 bg-background rounded-lg border">
                      <div className="text-xs text-muted-foreground">Search Time</div>
                      <div className="text-lg font-bold">
                        {selectedScenario.ragMetrics.searchTime}ms
                      </div>
                    </div>
                  </div>
                </div>

                {/* Processing Steps */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase">
                    Processing Steps
                  </div>
                  <div className="space-y-2">
                    <ProcessStep
                      number={1}
                      title="Embed Query"
                      description="768-dim vector"
                      isActive={activeProcessStep >= 1}
                      isComplete={activeProcessStep > 1}
                    />
                    <ProcessStep
                      number={2}
                      title="Search Chunks"
                      description={`${selectedScenario.technical.totalChunksSearched} chunks`}
                      isActive={activeProcessStep >= 2}
                      isComplete={activeProcessStep > 2}
                    />
                    <ProcessStep
                      number={3}
                      title="Filter by Subject"
                      description={`"${selectedScenario.subject}"`}
                      isActive={activeProcessStep >= 3}
                      isComplete={activeProcessStep > 3}
                    />
                    <ProcessStep
                      number={4}
                      title="Optimize Context"
                      description={`${selectedScenario.ragMetrics.fullContentTokens} → ${selectedScenario.ragMetrics.retrievedTokens} tokens`}
                      isActive={activeProcessStep >= 4}
                      isComplete={activeProcessStep > 4}
                    />
                    <ProcessStep
                      number={5}
                      title="Generate Response"
                      description="AI processing"
                      isActive={activeProcessStep >= 5}
                      isComplete={activeProcessStep > 5}
                    />
                  </div>
                </div>

                {/* Retrieved Chunks */}
                {activeProcessStep >= 4 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase">
                      Retrieved Chunks ({selectedScenario.ragMetrics.chunks.length})
                    </div>
                    {selectedScenario.ragMetrics.chunks.map((chunk, index) => (
                      <div key={index} className="p-2 bg-background rounded border text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">
                            {chunk.sectionTitle || `Chunk ${chunk.chunkIndex + 1}`}
                          </span>
                          <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                            {(chunk.similarity * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <p className="text-muted-foreground line-clamp-2">
                          {chunk.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Technical Details */}
                {showTechnicalDetails && (
                  <div ref={technicalDetailsRef} className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase">
                      Technical Stack
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span className="text-muted-foreground">Vector DB:</span>
                        <span className="font-mono">pgvector</span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span className="text-muted-foreground">Model:</span>
                        <span className="font-mono">nomic-embed-text</span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span className="text-muted-foreground">Dimensions:</span>
                        <span className="font-mono">{selectedScenario.technical.embeddingDimensions}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span className="text-muted-foreground">Strategy:</span>
                        <span className="font-mono">
                          {selectedScenario.technical.hybridSearchUsed ? 'Hybrid (Lesson + Module)' : 'Lesson-only'}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span className="text-muted-foreground">Subject Filter:</span>
                        <span className="font-mono">
                          {selectedScenario.technical.subjectFilterApplied ? '✓ Enabled' : '✗ Disabled'}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span className="text-muted-foreground">Total Chunks:</span>
                        <span className="font-mono">{selectedScenario.technical.totalChunksSearched}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span className="text-muted-foreground">Retrieved:</span>
                        <span className="font-mono">{selectedScenario.ragMetrics.chunks.length} chunks</span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span className="text-muted-foreground">Similarity:</span>
                        <span className="font-mono">Cosine</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Component
function ProcessStep({ 
  number,
  title, 
  description, 
  isActive,
  isComplete
}: { 
  number: number;
  title: string; 
  description: string; 
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div className={`flex items-start gap-2 p-2 rounded transition-all duration-500 ${
      isActive ? 'bg-primary/10' : 'opacity-50'
    }`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        isComplete ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}>
        {isComplete ? <Check className="h-3 w-3" /> : number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      </div>
    </div>
  );
}
