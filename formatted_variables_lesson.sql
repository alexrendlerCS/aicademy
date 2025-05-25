UPDATE lessons 
SET content = '
<h1>Understanding Variables</h1>
<p>Understanding variables is like understanding how computers remember things. Imagine your brain has different "boxes" for storing different types of information.</p>

<h2>Basic Data Types</h2>

<div class="space-y-4">
  <div class="bg-muted/50 p-4 rounded-lg">
    <h3 class="text-lg font-semibold">Numbers Box (Number Types)</h3>
    <ul>
      <li>Integers: Whole numbers like 1, 42, -7</li>
      <li>Floating-point: Numbers with decimals like 3.14, -0.001</li>
    </ul>
    <div class="bg-primary/10 p-3 rounded-lg mt-2">
      <p class="font-semibold">Examples:</p>
      <code>age = 15</code><br>
      <code>temperature = 98.6</code>
    </div>
  </div>

  <div class="bg-muted/50 p-4 rounded-lg">
    <h3 class="text-lg font-semibold">Text Box (Strings)</h3>
    <ul>
      <li>Any sequence of characters: "Hello, World!", "OpenAI"</li>
      <li>Can include letters, numbers, symbols</li>
    </ul>
    <div class="bg-primary/10 p-3 rounded-lg mt-2">
      <p class="font-semibold">Examples:</p>
      <code>name = "Alex"</code><br>
      <code>message = "Keep coding!"</code>
    </div>
  </div>

  <div class="bg-muted/50 p-4 rounded-lg">
    <h3 class="text-lg font-semibold">True/False Box (Booleans)</h3>
    <ul>
      <li>Only two possible values: true or false</li>
      <li>Used for yes/no conditions</li>
    </ul>
    <div class="bg-primary/10 p-3 rounded-lg mt-2">
      <p class="font-semibold">Examples:</p>
      <code>isStudent = true</code><br>
      <code>hasCompleted = false</code>
    </div>
  </div>
</div>

<div class="my-6">
  <p class="mb-4">Just like how we use different containers for different items in real life (water bottle for liquids, backpack for books), programming uses different data types to store different kinds of information efficiently.</p>

  <h2>Key Concepts:</h2>
  <ol class="list-decimal pl-6 space-y-2">
    <li>Variables must be declared before use</li>
    <li>Choose appropriate data types for your needs</li>
    <li>Understanding type conversion</li>
    <li>Memory management basics</li>
  </ol>
</div>

<div class="bg-primary/10 p-4 rounded-lg my-4">
  <h3 class="text-lg font-semibold mb-2">Think About It:</h3>
  <ul class="space-y-2">
    <li>Why do we need different data types?</li>
    <li>How does choosing the right data type make our programs better?</li>
  </ul>
</div>'
WHERE id = ''; 