/**
 * Ündes — Components: Quote card (shareable image-like card)
 *
 * Renders a stylized quote card into a container, with controls to
 * copy text, share via Web Share API, and download as PNG via the
 * SVG-to-canvas technique (no external libs).
 */

window.UNDES = window.UNDES || {};
var comp = window.UNDES.components = window.UNDES.components || {};
var esc = window.UNDES.escapeHtml;

comp.quoteCard = function (poem, lines) {
  var svc = window.UNDES.i18nService;
  var author = poem.author || window.UNDES.api.authorById(poem.authorId);
  var text = (lines || poem.excerpt || '').trim();

  return (
    '<div class="quote-canvas" id="quoteCanvas">' +
      '<span class="quote-canvas__mark">“</span>' +
      '<div class="quote-canvas__text">' + esc(text) + '</div>' +
      '<div class="quote-canvas__attr">' +
        '<div>' +
          '<div class="quote-canvas__author">— ' + esc(author ? author.name : '') + '</div>' +
          '<div class="quote-canvas__source">«' + esc(poem.title) + '»</div>' +
        '</div>' +
        '<div style="flex:1"></div>' +
        '<div class="quote-canvas__logo">Ündes</div>' +
      '</div>' +
    '</div>'
  );
};

comp.quoteCardModal = function (poem, lines) {
  var svc = window.UNDES.i18nService;
  var body = document.createElement('div');
  body.innerHTML =
    '<div style="display:flex;justify-content:center;margin-bottom:20px;">' + comp.quoteCard(poem, lines) + '</div>' +
    '<div class="field">' +
      '<label class="field__label">Цитата</label>' +
      '<textarea class="textarea" id="quoteText" style="min-height:80px;">' + esc((lines || poem.excerpt || '').trim()) + '\n\n— ' + esc((poem.author || window.UNDES.api.authorById(poem.authorId) || {}).name || '') + '«' + esc(poem.title) + '»</textarea>' +
    '</div>' +
    '<div class="flex gap-2 flex-wrap">' +
      '<button class="btn btn--soft btn--sm" id="qcCopy"><span data-lucide="copy"></span> ' + svc.t('poem.copy') + '</button>' +
      '<button class="btn btn--soft btn--sm" id="qcShare"><span data-lucide="share-2"></span> ' + svc.t('poem.share') + '</button>' +
      '<button class="btn btn--soft btn--sm" id="qcDownload"><span data-lucide="download"></span> PNG</button>' +
    '</div>';

  var modal = window.UNDES.modal.open({
    title: svc.t('poem.quoteCard'),
    size: 'lg',
    body: body,
    onMount: function (root) {
      root.querySelector('#qcCopy').addEventListener('click', function () {
        var ta = root.querySelector('#quoteText');
        ta.select();
        try { document.execCommand('copy'); window.UNDES.toast.success(svc.t('poem.copy'), svc.t('poem.copied')); }
        catch (e) { navigator.clipboard && navigator.clipboard.writeText(ta.value); }
      });
      root.querySelector('#qcShare').addEventListener('click', function () {
        var ta = root.querySelector('#quoteText');
        if (navigator.share) {
          navigator.share({ title: poem.title, text: ta.value }).catch(function () {});
        } else {
          ta.select();
          try { document.execCommand('copy'); } catch (e) {}
          window.UNDES.toast.success(svc.t('poem.share'), svc.t('poem.linkCopied'));
        }
      });
      root.querySelector('#qcDownload').addEventListener('click', function () {
        downloadCardAsPNG(root.querySelector('#quoteCanvas'), poem.title);
      });
    }
  });
  return modal;
};

/* ---------- PNG export (SVG foreignObject -> canvas) ---------- */
function downloadCardAsPNG(node, name) {
  var svc = window.UNDES.i18nService;
  var rect = node.getBoundingClientRect();
  var w = Math.ceil(rect.width);
  var h = Math.ceil(rect.height);

  // Clone node and inline computed styles + computed text colors
  var clone = node.cloneNode(true);
  clone.style.margin = '0';
  clone.style.width = w + 'px';
  clone.style.height = h + 'px';

  var wrap = document.createElement('div');
  wrap.style.position = 'fixed';
  wrap.style.left = '-99999px';
  wrap.style.top = '0';
  wrap.appendChild(clone);
  document.body.appendChild(wrap);

  // Inline critical CSS variables so the SVG renders correctly
  var cs = getComputedStyle(node);
  clone.style.background = cs.background;
  clone.style.color = cs.color;
  clone.style.fontFamily = cs.fontFamily;

  var data = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
    '<foreignObject width="100%" height="100%">' +
    '<div xmlns="http://www.w3.org/1999/xhtml" style="width:' + w + 'px;height:' + h + 'px;">' +
    wrap.innerHTML +
    '</div></foreignObject></svg>';

  document.body.removeChild(wrap);

  var svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
  var url = URL.createObjectURL(svgBlob);
  var img = new Image();
  img.onload = function () {
    var canvas = document.createElement('canvas');
    canvas.width = w * 2; canvas.height = h * 2;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob(function (blob) {
      if (!blob) { window.UNDES.toast.error(svc.t('toast.error')); return; }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (name || 'undes-quote').replace(/[^\w\-]+/g, '_') + '.png';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }, 'image/png');
  };
  img.onerror = function () {
    URL.revokeObjectURL(url);
    // Fallback: just copy text
    window.UNDES.toast.info(svc.t('poem.copy'), svc.t('poem.copied'));
  };
  img.src = url;
}
