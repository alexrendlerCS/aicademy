/**
 * Debug script for chunking
 */

import { JSDOM } from 'jsdom';

const sampleHTML = `
<h2>Introduction to Functions</h2>
<p>Functions are reusable blocks of code that perform specific tasks.</p>
`;

console.log('Testing JSDOM parsing...\n');

const wrappedContent = `<body>${sampleHTML}</body>`;
const dom = new JSDOM(wrappedContent);
const document = dom.window.document;

const body = document.querySelector('body');
console.log('Body found:', !!body);
console.log('Body innerHTML:', body?.innerHTML?.substring(0, 100));

const elements = body?.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
console.log('Elements found:', elements?.length);

elements?.forEach((el, i) => {
  console.log(`Element ${i + 1}:`, el.tagName, '-', el.textContent?.trim().substring(0, 50));
});
