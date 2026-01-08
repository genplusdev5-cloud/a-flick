const fs = require('fs');
const path = require('path');

const rootDir = 'e:\\projects\\a-flick\\src\\app\\[lang]\\(dashboard)\\(private)\\admin';

const targetString = "height: '100%'";
const replacementString = "maxHeight: '100%'";

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(targetString)) {
        console.log(`Updating: ${fullPath}`);
        // Only replace if it's likely a style object (preceded by a space or { or :)
        // Using a simple split/join to replace all occurrences efficiently
        content = content.split(targetString).join(replacementString);
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

walk(rootDir);
console.log('Finished comprehensive updates.');
