/* ============================================================================
 * build.js  —  Bundle all source into a single self-contained index.html
 * ----------------------------------------------------------------------------
 * The game source lives in modular files (css/, js/...) for easy development.
 * But for a foolproof "double-click to play" experience we inline EVERYTHING
 * into one index.html, so there are no separate files that can fail to load.
 *
 * Run:  node build.js
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const root = __dirname;

// JS files, in dependency order (must match the original load order).
const JS_FILES = [
  'js/core/ratings.js', 'js/core/player.js', 'js/core/club.js',
  'js/data/clubs.js', 'js/data/squads.js',
  'js/engine/match.js', 'js/engine/league.js',
  'js/save/save.js', 'js/main.js', 'js/ui/ui.js'
];

const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');

// Inline JS as separate <script> tags (preserves per-file isolation). Guard any
// literal "</script" so the closing tag can't break the inline block.
function safe(js) { return js.replace(/<\/script/gi, '<\\/script'); }
const scripts = JS_FILES.map(function (f) {
  return '<script>\n' + safe(fs.readFileSync(path.join(root, f), 'utf8')) + '\n</script>';
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#07090d" />
  <title>Gaffer — Football Management</title>
  <meta name="description" content="A football management career sim. Pick a club, set your tactics, run the transfer market, and sim your way through the season." />
  <!-- SELF-CONTAINED BUILD: all CSS + JS are inlined below so this one file runs
       anywhere with no other files needed. Edit the source in css/ and js/, then
       regenerate with:  node build.js -->
  <style>
${css}
  </style>
</head>
<body>
  <div id="app"></div>
  <noscript>
    <div style="padding:40px;text-align:center;font-family:sans-serif;color:#e7ecf3;background:#07090d">
      <h1>Gaffer</h1><p>This game needs JavaScript enabled. Please turn it on and reload.</p>
    </div>
  </noscript>

${scripts}

  <script>
    document.addEventListener('DOMContentLoaded', function () {
      try {
        Gaffer.UI.boot();
      } catch (e) {
        document.getElementById('app').innerHTML =
          '<div style="padding:40px;color:#e25563;font-family:monospace;background:#07090d;min-height:100vh">Failed to start: ' + e.message + '</div>';
        console.error(e);
      }
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log('Built self-contained index.html (' + kb + ' KB, ' + JS_FILES.length + ' modules inlined)');
