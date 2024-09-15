// Import client startup through a single index entry point

import './routes.js';

console.log("set theme")
document.documentElement.removeAttribute('theme');
document.documentElement.setAttribute('theme', 'light');
