// scripts/convert-tailwind-to-styles.js
// Best-effort converter: finds className="..." in .tsx files under app/ and
// replaces them with StyleSheet-based `style={styles.<name>}` and appends
// a `const styles = StyleSheet.create({...})` block at the end of the file.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appDir = path.join(root, 'app');

// Basic mapping from Tailwind-like utility to RN style properties.
// This map covers common utilities used in the project; unmapped classes will be logged.
const simpleMap = {
  // layout
  'flex': { display: 'flex' },
  'flex-row': { flexDirection: 'row' },
  'flex-col': { flexDirection: 'column' },
  'flex-1': { flex: 1 },
  'items-center': { alignItems: 'center' },
  'items-start': { alignItems: 'flex-start' },
  'items-end': { alignItems: 'flex-end' },
  'justify-between': { justifyContent: 'space-between' },
  'justify-center': { justifyContent: 'center' },
  'justify-start': { justifyContent: 'flex-start' },
  'justify-end': { justifyContent: 'flex-end' },
  'flex-wrap': { flexWrap: 'wrap' },

  // spacing (some common fixed ones)
  'p-4': { padding: 16 },
  'p-3': { padding: 12 },
  'p-2': { padding: 8 },
  'p-6': { padding: 24 },
  'px-4': { paddingHorizontal: 16 },
  'py-3': { paddingVertical: 12 },
  'pt-4': { paddingTop: 16 },
  'pb-4': { paddingBottom: 16 },
  'pl-4': { paddingLeft: 16 },
  'pr-4': { paddingRight: 16 },
  'm-4': { margin: 16 },
  'mb-2': { marginBottom: 8 },
  'mb-3': { marginBottom: 12 },
  'mb-4': { marginBottom: 16 },
  'mt-4': { marginTop: 16 },
  'mx-4': { marginHorizontal: 16 },
  'my-4': { marginVertical: 16 },
  'gap-4': { gap: 16 },

  // sizes
  'w-full': { width: '100%' },
  'h-full': { height: '100%' },

  // text
  'text-sm': { fontSize: 14 },
  'text-xs': { fontSize: 12 },
  'text-lg': { fontSize: 18 },
  'text-xl': { fontSize: 20 },
  'text-2xl': { fontSize: 24 },
  'font-bold': { fontWeight: '700' },
  'font-medium': { fontWeight: '600' },

  // colors (map to color tokens - keep as placeholders)
  'text-foreground': { color: '#0f172a' },
  'text-muted-foreground': { color: '#6b7280' },
  'text-accent': { color: '#f97316' },
  'text-primary-foreground': { color: '#ffffff' },

  'bg-background': { backgroundColor: '#ffffff' },
  'bg-card': { backgroundColor: '#ffffff' },
  'bg-primary': { backgroundColor: '#0f172a' },
  'bg-secondary': { backgroundColor: '#f3f4f6' },
  'bg-accent': { backgroundColor: '#f97316' },

  // borders and rounding
  'rounded': { borderRadius: 6 },
  'rounded-lg': { borderRadius: 12 },
  'border': { borderWidth: 1 },
  'border-border': { borderColor: '#e6edf3' },
  'border-input': { borderColor: '#e6edf3' },

  // shadows and misc
  'shadow-sm': { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  'animate-pulse': {},
  'hidden': { display: 'none' },
};

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function walkDir(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full));
    } else if (/\.tsx?$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function parseClassList(classList) {
  const parts = classList.split(/\s+/).filter(Boolean);
  const style = {};
  const unmapped = [];

  for (const part of parts) {
    if (simpleMap[part]) {
      Object.assign(style, simpleMap[part]);
      continue;
    }

    // handle w-[48%], min-w-[160px], w-[45%], w-[48%]
    const wMatch = part.match(/^w-\[([\d.%]+)\]$/);
    if (wMatch) {
      style.width = wMatch[1].endsWith('%') ? wMatch[1] : Number(wMatch[1]);
      continue;
    }
    const minWMatch = part.match(/^min-w-\[([\d.%]+)\]$/);
    if (minWMatch) {
      style.minWidth = minWMatch[1].endsWith('%') ? minWMatch[1] : Number(minWMatch[1].replace('px',''));
      continue;
    }
    const hMatch = part.match(/^h-\[?([\d.]+)p?x?%?\]?$/);
    if (hMatch) {
      // fallback not strict
      continue;
    }

    // padding/margin numeric like w-[48%] handled, numbers like p-4 already mapped
    // text color tokens like text-accent already handled

    unmapped.push(part);
  }

  return { style, unmapped };
}

function makeSafeName(base, idx) {
  return `${base}_${idx}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

function convertFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  const classRegex = /className=\"([^\"]+)\"/g;
  const matches = [...src.matchAll(classRegex)];
  if (matches.length === 0) return { changed: false };

  const styleBlocks = {};
  const unmappedAll = new Set();
  let idx = 0;

  for (const m of matches) {
    const full = m[0];
    const classes = m[1];
    const key = classes.trim();
    if (!styleBlocks[key]) {
      idx++;
      const { style, unmapped } = parseClassList(key);
      styleBlocks[key] = { name: makeSafeName('s', idx), style, classes: key };
      unmapped.forEach(u => unmappedAll.add(u));
    }
  }

  // build styles object text
  const styleEntries = Object.values(styleBlocks).map(b => {
    const styleObj = JSON.stringify(b.style, null, 2).replace(/"(\w+)":/g, '$1:');
    return `  ${b.name}: ${styleObj}`;
  }).join(',\n\n');

  // replace occurrences with style={styles.<name>}
  for (const key of Object.keys(styleBlocks)) {
    const name = styleBlocks[key].name;
    const regex = new RegExp(`className=\\"${escapeRegex(key)}\\"`, 'g');
    src = src.replace(regex, `style={styles.${name}}`);
  }

  // append StyleSheet import if missing
  if (!/StyleSheet/.test(src)) {
    // add import at top after react-native imports
    src = src.replace(/(from 'react-native';)/, `$1\nimport { StyleSheet } from 'react-native';`);
  }

  // append styles block at end before export default
  const stylesBlock = `\n\nconst styles = StyleSheet.create({\n${styleEntries}\n});\n`;

  // find last export default or end of file
  if (/export default/.test(src)) {
    src = src.replace(/(export default[\s\S]*?$)/m, `${stylesBlock}$1`);
  } else {
    src = src + stylesBlock;
  }

  fs.writeFileSync(filePath, src, 'utf8');

  return { changed: true, unmapped: Array.from(unmappedAll) };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function run() {
  const files = walkDir(appDir);
  console.log(`Found ${files.length} files under app/`);
  const summary = { total: 0, changed: 0, unmapped: {} };

  for (const f of files) {
    const res = convertFile(f);
    summary.total++;
    if (res.changed) {
      summary.changed++;
      if (res.unmapped && res.unmapped.length) {
        summary.unmapped[f] = res.unmapped;
      }
      console.log(`Updated: ${path.relative(root, f)} (unmapped: ${res.unmapped.length})`);
    }
  }

  console.log('\nSummary:');
  console.log(JSON.stringify(summary, null, 2));
}

run();
