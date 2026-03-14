const data = require('../psalms_extracted/psalms_index.json');

const byLang = {};
data.forEach(v => {
  const key = v.lang_short || '??';
  if (!byLang[key]) {
    byLang[key] = {lang: v.lang || '(unknown)', count: 0, versions: []};
  }
  byLang[key].count++;
  byLang[key].versions.push(v.module);
});

const sorted = Object.entries(byLang).sort((a, b) => b[1].count - a[1].count);

console.log('=== Languages (' + sorted.length + ' unique) | Total versions: ' + data.length + ' ===\n');
sorted.forEach(([code, info]) => {
  const versions = info.count > 1
    ? info.count + ' versions: ' + info.versions.join(', ')
    : '1 version:  ' + info.versions[0];
  console.log(code.padEnd(6) + '| ' + (info.lang || '').padEnd(20) + '| ' + versions);
});
