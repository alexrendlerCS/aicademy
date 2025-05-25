-- Update The Three-Act Structure lesson
UPDATE lessons 
SET content = '
<h1>The Three-Act Structure</h1>
<p>The three-act structure is the backbone of storytelling, providing a framework that has engaged audiences for centuries.</p>

<h2>Act 1: Setup (Beginning)</h2>
<ul>
  <li>Introduce the main character(s)</li>
  <li>Establish the setting</li>
  <li>Present the inciting incident</li>
  <li>Set the stakes</li>
</ul>

<div class="bg-muted/50 p-4 rounded-lg my-4">
  <h3 class="text-lg font-semibold mb-2">Example:</h3>
  <p>"Harry Potter discovers he''s a wizard and receives an invitation to Hogwarts."</p>
</div>

<h2>Act 2: Confrontation (Middle)</h2>
<ul>
  <li>Develop conflicts</li>
  <li>Raise the stakes</li>
  <li>Create complications</li>
  <li>Show character growth</li>
</ul>

<div class="bg-muted/50 p-4 rounded-lg my-4">
  <h3 class="text-lg font-semibold mb-2">Example:</h3>
  <p>"Harry faces increasingly difficult challenges while uncovering the mystery of the Sorcerer''s Stone."</p>
</div>

<h2>Act 3: Resolution (End)</h2>
<ul>
  <li>Climactic moment</li>
  <li>Resolution of conflicts</li>
  <li>Character transformation</li>
  <li>Tie up loose ends</li>
</ul>

<div class="bg-muted/50 p-4 rounded-lg my-4">
  <h3 class="text-lg font-semibold mb-2">Example:</h3>
  <p>"Harry confronts Voldemort and saves the Sorcerer''s Stone, proving his worth as a wizard."</p>
</div>

<h2>Key Elements:</h2>
<ol>
  <li>Pacing: Balance between action and reflection</li>
  <li>Tension: Gradual build-up of conflict</li>
  <li>Stakes: What''s at risk for the characters</li>
  <li>Satisfaction: Meaningful resolution</li>
</ol>

<div class="bg-primary/10 p-4 rounded-lg my-4">
  <h3 class="text-lg font-semibold mb-2">Practice Exercise:</h3>
  <p>Think of your favorite movie or book. Can you identify these three acts? How does the story build tension throughout each act?</p>
</div>'
WHERE id = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a20';

-- Update Show, Don't Tell lesson
UPDATE lessons 
SET content = '
<h1>Show, Don''t Tell</h1>
<p>The principle of "show, don''t tell" is about creating vivid experiences for your readers through descriptive writing.</p>

<h2>Telling vs. Showing:</h2>

<div class="grid grid-cols-2 gap-4 my-4">
  <div class="bg-destructive/10 p-4 rounded-lg">
    <h3 class="text-lg font-semibold mb-2">Telling:</h3>
    <p>"John was angry."</p>
  </div>
  <div class="bg-primary/10 p-4 rounded-lg">
    <h3 class="text-lg font-semibold mb-2">Showing:</h3>
    <p>"John''s fists clenched at his sides, his face flushed red as he struggled to control his breathing."</p>
  </div>
</div>

<h2>Key Techniques:</h2>

<h3>1. Sensory Details:</h3>
<ul>
  <li>Sight: The crimson sunset painted the sky</li>
  <li>Sound: Leaves rustled in the gentle breeze</li>
  <li>Touch: The rough bark scraped against her palm</li>
  <li>Smell: Coffee aroma wafted through the morning air</li>
  <li>Taste: The bitter tang of lemon made her wince</li>
</ul>

<h3>2. Action and Body Language:</h3>
<div class="grid grid-cols-2 gap-4 my-4">
  <div class="bg-destructive/10 p-4 rounded-lg">
    <p>Instead of "She was nervous"</p>
  </div>
  <div class="bg-primary/10 p-4 rounded-lg">
    <p>Write "She tapped her foot rapidly, constantly checking her phone"</p>
  </div>
</div>

<h3>3. Environmental Description:</h3>
<div class="grid grid-cols-2 gap-4 my-4">
  <div class="bg-destructive/10 p-4 rounded-lg">
    <p>Instead of "It was a messy room"</p>
  </div>
  <div class="bg-primary/10 p-4 rounded-lg">
    <p>Write "Clothes spilled from open drawers, books lay scattered across the floor, and yesterday''s coffee cups gathered dust on every surface"</p>
  </div>
</div>

<div class="bg-primary/10 p-4 rounded-lg my-4">
  <h3 class="text-lg font-semibold mb-2">Practice Exercise:</h3>
  <p>Take these "telling" sentences and rewrite them to "show":</p>
  <ol>
    <li>"The beach was beautiful"</li>
    <li>"He was tired"</li>
    <li>"The food was delicious"</li>
  </ol>
</div>'
WHERE id = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a21';

-- Update Creating Conflict lesson
UPDATE lessons 
SET content = '
<h1>Creating Conflict</h1>
<p>Conflict drives stories forward and keeps readers engaged. Understanding different types of conflict helps create compelling narratives.</p>

<h2>Types of Conflict:</h2>

<div class="space-y-4">
  <div class="bg-muted/50 p-4 rounded-lg">
    <h3 class="text-lg font-semibold">1. Person vs. Person</h3>
    <ul>
      <li>Direct opposition between characters</li>
      <li>Example: Hero vs. Villain</li>
      <li>Creates immediate tension and drama</li>
    </ul>
  </div>

  <div class="bg-muted/50 p-4 rounded-lg">
    <h3 class="text-lg font-semibold">2. Person vs. Self</h3>
    <ul>
      <li>Internal struggles</li>
      <li>Moral dilemmas</li>
      <li>Character growth opportunities</li>
    </ul>
  </div>

  <div class="bg-muted/50 p-4 rounded-lg">
    <h3 class="text-lg font-semibold">3. Person vs. Nature</h3>
    <ul>
      <li>Survival stories</li>
      <li>Environmental challenges</li>
      <li>Tests character resilience</li>
    </ul>
  </div>

  <div class="bg-muted/50 p-4 rounded-lg">
    <h3 class="text-lg font-semibold">4. Person vs. Society</h3>
    <ul>
      <li>Challenging social norms</li>
      <li>Fighting systemic issues</li>
      <li>Cultural conflicts</li>
    </ul>
  </div>

  <div class="bg-muted/50 p-4 rounded-lg">
    <h3 class="text-lg font-semibold">5. Person vs. Technology/Fate</h3>
    <ul>
      <li>Modern challenges</li>
      <li>Destiny vs. Free will</li>
      <li>Technological ethical dilemmas</li>
    </ul>
  </div>
</div>

<h2 class="mt-6">Creating Effective Conflict:</h2>
<ol>
  <li>Make it relevant to the character</li>
  <li>Raise the stakes gradually</li>
  <li>Create obstacles that test growth</li>
  <li>Ensure resolution feels earned</li>
</ol>

<div class="bg-primary/10 p-4 rounded-lg my-4">
  <h3 class="text-lg font-semibold mb-2">Practice Exercise:</h3>
  <p>Choose a type of conflict and write a short scene demonstrating it. Consider how the conflict reveals character and drives the story forward.</p>
</div>'
WHERE id = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

-- Update Character Motivation lesson
UPDATE lessons 
SET content = '
<h1>Character Motivation</h1>
<p>Understanding what drives your characters is crucial for creating believable and engaging stories.</p>

<h2>Core Elements of Motivation:</h2>

<div class="space-y-4">
  <div class="bg-muted/50 p-4 rounded-lg">
    <h3 class="text-lg font-semibold">1. Desires</h3>
    <ul>
      <li>What does the character want?</li>
      <li>Short-term vs. long-term goals</li>
      <li>Surface desires vs. deep needs</li>
    </ul>
  </div>

  <div class="bg-muted/50 p-4 rounded-lg">
    <h3 class="text-lg font-semibold">2. Fears</h3>
    <ul>
      <li>What does the character avoid?</li>
      <li>Past traumas</li>
      <li>Future concerns</li>
    </ul>
  </div>

  <div class="bg-muted/50 p-4 rounded-lg">
    <h3 class="text-lg font-semibold">3. Values</h3>
    <ul>
      <li>What does the character believe in?</li>
      <li>Moral compass</li>
      <li>Personal ethics</li>
    </ul>
  </div>
</div>

<h2 class="mt-6">Creating Complex Motivations:</h2>
<ol>
  <li>Layer different desires</li>
  <li>Create conflicts between goals</li>
  <li>Challenge character values</li>
  <li>Develop realistic flaws</li>
</ol>

<div class="bg-primary/10 p-4 rounded-lg my-4">
  <h3 class="text-lg font-semibold mb-2">Example Character Profile:</h3>
  <p class="font-semibold">Sarah Chen</p>
  <ul>
    <li>Desire: To become a renowned chef</li>
    <li>Fear: Following in her parents'' failed restaurant business</li>
    <li>Value: Creative expression through food</li>
    <li>Internal Conflict: Tradition vs. Innovation</li>
  </ul>
</div>

<div class="bg-primary/10 p-4 rounded-lg my-4">
  <h3 class="text-lg font-semibold mb-2">Practice Exercise:</h3>
  <p>Create a character profile including:</p>
  <ol>
    <li>Three distinct motivations</li>
    <li>Two conflicting desires</li>
    <li>One core value being challenged</li>
  </ol>
</div>'
WHERE id = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a23';

-- Update Dialogue and Voice lesson
UPDATE lessons 
SET content = '
<h1>Dialogue and Voice</h1>
<p>Effective dialogue reveals character, advances plot, and creates engaging scenes. Each character should have a distinct voice that reflects their personality and background.</p>

<h2>Elements of Strong Dialogue:</h2>

<div class="space-y-4">
  <div class="bg-muted/50 p-4 rounded-lg">
    <h3 class="text-lg font-semibold">1. Character Voice</h3>
    <ul>
      <li>Vocabulary choice</li>
      <li>Speech patterns</li>
      <li>Cultural influences</li>
      <li>Educational background</li>
    </ul>
  </div>

  <div class="bg-muted/50 p-4 rounded-lg">
    <h3 class="text-lg font-semibold">2. Subtext</h3>
    <ul>
      <li>What''s not being said</li>
      <li>Hidden meanings</li>
      <li>Emotional undertones</li>
    </ul>
  </div>

  <div class="bg-muted/50 p-4 rounded-lg">
    <h3 class="text-lg font-semibold">3. Conflict in Dialogue</h3>
    <ul>
      <li>Competing goals</li>
      <li>Misunderstandings</li>
      <li>Power dynamics</li>
    </ul>
  </div>
</div>

<h2 class="mt-6">Example:</h2>
<div class="grid grid-cols-2 gap-4 my-4">
  <div class="bg-destructive/10 p-4 rounded-lg">
    <h3 class="text-lg font-semibold mb-2">Poor dialogue:</h3>
    <p>"I am angry because you didn''t do what I asked you to do."</p>
  </div>
  <div class="bg-primary/10 p-4 rounded-lg">
    <h3 class="text-lg font-semibold mb-2">Better dialogue:</h3>
    <p>"You know what? Never mind. I''ll do it myself. I always do."</p>
  </div>
</div>

<h2>Tips for Writing Dialogue:</h2>
<ol>
  <li>Read it aloud</li>
  <li>Give each character unique patterns</li>
  <li>Use dialogue to reveal character</li>
  <li>Include non-verbal cues</li>
</ol>

<div class="bg-primary/10 p-4 rounded-lg my-4">
  <h3 class="text-lg font-semibold mb-2">Practice Exercise:</h3>
  <p>Write a dialogue scene between two characters with opposing goals, focusing on subtext and distinct voices.</p>
</div>'
WHERE id = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a24'; 