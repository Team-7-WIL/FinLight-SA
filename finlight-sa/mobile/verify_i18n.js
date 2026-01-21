// Quick verification that all language files have parity
const translations = require('./src/i18n/index.js').default.translations || {};

const languages = ['en', 'af', 'zu', 'nso', 'sw', 'fr', 'pt', 'es'];
const enKeys = new Set();

// Collect all keys from English
const collectKeys = (obj, prefix = '') => {
  Object.keys(obj).forEach(key => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      collectKeys(obj[key], fullKey);
    } else {
      enKeys.add(fullKey);
    }
  });
};

console.log('🔍 Checking i18n key parity across all languages...\n');

if (!translations || !translations.en) {
  console.error('❌ ERROR: Could not load translations');
  process.exit(1);
}

collectKeys(translations.en);
console.log(`✅ English has ${enKeys.size} keys\n`);

let allGood = true;

languages.forEach(lang => {
  if (lang === 'en') return;
  
  if (!translations[lang]) {
    console.error(`❌ Language ${lang} not found!`);
    allGood = false;
    return;
  }

  const langKeys = new Set();
  collectKeys(translations[lang]);

  const missing = Array.from(enKeys).filter(k => !langKeys.has(k));
  
  if (missing.length > 0) {
    console.warn(`⚠️  ${lang}: Missing ${missing.length} keys:`);
    missing.slice(0, 5).forEach(k => console.warn(`    - ${k}`));
    if (missing.length > 5) console.warn(`    ... and ${missing.length - 5} more`);
    allGood = false;
  } else {
    console.log(`✅ ${lang}: All keys present`);
  }
});

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ SUCCESS: All languages have complete parity!');
  process.exit(0);
} else {
  console.log('❌ ISSUES FOUND: Some languages have missing keys');
  process.exit(1);
}
