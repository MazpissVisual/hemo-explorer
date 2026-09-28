/** Convert decorative emoji in UI text to the shared monochrome SVG icon set. */
(function initUnifiedIcons() {
  'use strict';

  const iconMap = {
    '👩‍🏫': 'teacher', '👩‍🎓': 'student', '🎒': 'student',
    '👤': 'user', '👥': 'user', '🏫': 'school', '🆔': 'user',
    '👴': 'user', '👧': 'user', '👦': 'user', '👋': 'user', '🙈': 'user', '😴': 'user',
    '❤️': 'heart', '💔': 'heart', '💓': 'heart', '🫀': 'heart', '🩸': 'heart', '🫁': 'heart', '🩺': 'heart', '🩹': 'heart', '🥀': 'heart',
    '🌐': '3d', '🥽': '3d', '📷': 'camera',
    '🔊': 'audio', '🎵': 'audio', '🔔': 'audio',
    '🏆': 'trophy', '🥇': 'trophy', '🥈': 'trophy', '🥉': 'trophy', '⭐': 'trophy', '🌟': 'trophy', '🎉': 'trophy',
    '🧪': 'lab', '🔬': 'lab', '🧬': 'lab', '☣️': 'lab',
    '📊': 'chart', '📈': 'chart', '📉': 'chart', '📋': 'chart', '📝': 'chart', '📜': 'chart', '📄': 'chart', '📖': 'chart', '📭': 'chart',
    '⚙️': 'settings', '🎨': 'settings', '🔤': 'settings',
    '🔑': 'key', '🔐': 'key', '🔒': 'key', '🚪': 'key',
    '👁️': 'eye', '🎯': 'target', '🛡️': 'shield',
    '🥗': 'target', '🧂': 'target', '💧': 'target', '🍔': 'target', '🍎': 'target',
    '🧠': 'target', '🦵': 'target', '🧍': 'target', '📍': 'target', '❓': 'target', '🃏': 'target',
    '🏃‍♂️': 'arrow', '🚶‍♂️': 'arrow', '🏃': 'arrow', '⬅': 'arrow', '👍': 'check',
    '🖨️': 'print', '📥': 'arrow', '🗑️': 'trash',
    '▶️': 'play', '⏸️': 'play', '🎬': 'play',
    '⚠️': 'alert', '🚨': 'alert', '❌': 'alert', '✅': 'check', '✓': 'check', 'ℹ️': 'info',
    '🚀': 'arrow', '🔄': 'arrow', '➔': 'arrow', '👇': 'arrow',
    '✨': 'spark', '💡': 'spark', '⚡': 'spark', '☀️': 'spark', '🌙': 'spark',
    '🔴': 'heart', '🔵': 'heart', '🟡': 'spark', '🟢': 'check', '🖤': 'heart',
    '🔍': 'eye', '✕': 'alert', '⏳': 'info', '👾': 'alert', '🦠': 'alert'
  };

  const keys = Object.keys(iconMap).sort((a, b) => b.length - a.length);
  const escaped = keys.map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const emojiPattern = new RegExp(`(${escaped.join('|')})`, 'gu');
  const ignoredParents = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'OPTION', 'CANVAS', 'SVG']);

  function makeIcon(name, source) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ui-inline-icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.dataset.sourceIcon = source;
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#ui-icon-${name}`);
    svg.appendChild(use);
    return svg;
  }

  function convertTextNode(node) {
    if (!node.parentElement || ignoredParents.has(node.parentElement.tagName)) return;
    const value = node.nodeValue;
    if (!value || !emojiPattern.test(value)) {
      emojiPattern.lastIndex = 0;
      return;
    }
    emojiPattern.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    value.replace(emojiPattern, (match, _capture, offset) => {
      if (offset > lastIndex) fragment.append(value.slice(lastIndex, offset));
      fragment.append(makeIcon(iconMap[match], match));
      lastIndex = offset + match.length;
      return match;
    });
    if (lastIndex < value.length) fragment.append(value.slice(lastIndex));
    node.replaceWith(fragment);
  }

  function convertTree(root) {
    if (!root || (root.nodeType === Node.ELEMENT_NODE && ignoredParents.has(root.tagName))) return;
    if (root.nodeType === Node.TEXT_NODE) return convertTextNode(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(convertTextNode);
  }

  convertTree(document.body);

  const observer = new MutationObserver(records => {
    records.forEach(record => {
      if (record.type === 'characterData') convertTextNode(record.target);
      record.addedNodes.forEach(convertTree);
    });
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
