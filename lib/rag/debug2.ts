import { JSDOM } from 'jsdom';

const html = `
<h2>Introduction to Functions</h2>
<p>Functions are reusable blocks of code that perform specific tasks. They are one of the fundamental building blocks of programming and help you organize your code efficiently.</p>

<h3>Why Use Functions?</h3>
<p>Functions provide several key benefits:</p>
<ul>
  <li>Code reusability - write once, use many times</li>
  <li>Better organization and readability</li>
  <li>Easier debugging and maintenance</li>
  <li>Abstraction of complex logic</li>
</ul>
`;

const wrappedContent = `<body>${html}</body>`;
const dom = new JSDOM(wrappedContent);
const document = dom.window.document;
const body = document.querySelector('body');
const elements = body?.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, pre, blockquote');

console.log(`Found ${elements?.length} elements:\n`);

elements?.forEach((el, i) => {
  const text = el.textContent?.trim() || '';
  const words = text.split(/\s+/).length;
  console.log(`${i + 1}. <${el.tagName}> - ${words} words - "${text.substring(0, 50)}..."`);
});
