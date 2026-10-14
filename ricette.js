(function(){
  var R = window.RICETTE || [], CAT = window.CATEGORIE || {}, NOTE = window.NOTE_CATEGORIE || {};
  var input = document.getElementById('rc-q');
  var list = document.getElementById('rc-sugg');
  var out = document.getElementById('rc-out');
  var chips = document.querySelectorAll('[data-cat]');
  var dlg = document.getElementById('rc-modal');
  var activeCat = 'tutte', active = -1, shown = [];

  function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim(); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function ingName(i){ return Array.isArray(i) ? i[0] : i; }
  function ingText(i){ return Array.isArray(i) ? '<strong>'+esc(i[0])+'</strong><span>'+esc(i[1].length<=14 ? i[1].replace(/ /g,'\u00a0') : i[1])+'</span>' : esc(i); }
  R.forEach(function(r){ r._t = norm(r.title); r._all = norm(r.title+' '+r.tags+' '+r.ingr.map(ingName).join(' ')+' '+(CAT[r.cat]||'')); });

  function score(r, q){
    var words = r._t.split(' '), s = 0;
    if (r._t.indexOf(q) === 0) s = 5;
    else if (words.some(function(w){ return w.indexOf(q) === 0; })) s = 4;
    else if (r._t.indexOf(q) > -1) s = 3;
    else if (r._all.split(' ').some(function(w){ return w.indexOf(q) === 0; })) s = 2;
    else if (r._all.indexOf(q) > -1) s = 1;
    return s;
  }
  function search(q){
    q = norm(q); if (!q) return [];
    var parts = q.split(' ');
    return R.map(function(r){
      var tot = 0;
      for (var i=0;i<parts.length;i++){ var s = score(r, parts[i]); if (!s) return null; tot += s; }
      return {r:r, s:tot};
    }).filter(Boolean).sort(function(a,b){ return b.s - a.s; }).map(function(x){ return x.r; });
  }
  function hl(title, q){
    var n = norm(title), qq = norm(q).split(' ')[0], i = qq ? n.indexOf(qq) : -1;
    if (i < 0 || title.length !== n.length) return esc(title);
    return esc(title.slice(0,i)) + '<mark>' + esc(title.slice(i,i+qq.length)) + '</mark>' + esc(title.slice(i+qq.length));
  }

  function card(r){
    return '<button type="button" class="rc-card" data-id="'+r.id+'">'
      + '<img src="'+r.img+'" alt="" loading="lazy">'
      + '<span class="rc-card-body"><span class="rc-tag">'+esc(CAT[r.cat])+'</span>'
      + '<h3>'+esc(r.title)+'</h3><p>'+esc(r.desc)+'</p>'
      + '<span class="rc-meta">'+esc(r.time)+' · '+r.serves+' porzioni · '+esc(r.level)+'</span></span></button>';
  }
  function render(){
    var q = input.value, items, html = '';
    if (norm(q)){
      items = search(q).filter(function(r){ return activeCat==='tutte' || r.cat===activeCat; });
      html = '<div class="rc-head"><h2>Risultati per “'+esc(q.trim())+'”</h2><p>'+items.length+(items.length===1?' ricetta trovata':' ricette trovate')+'</p></div>';
      html += items.length ? '<div class="rc-grid">'+items.map(card).join('')+'</div>'
        : '<p class="rc-empty">Nessuna ricetta trovata. Prova con un altro ingrediente, ad esempio “pesce”, “spinaci” o “cioccolato”.</p>';
    } else {
      Object.keys(CAT).forEach(function(k){
        if (activeCat!=='tutte' && activeCat!==k) return;
        var its = R.filter(function(r){ return r.cat===k; });
        html += '<section class="rc-block" id="cat-'+k+'"><div class="rc-head"><h2>'+CAT[k]+'</h2><p>'+its.length+' ricette</p></div>'+(NOTE[k]?'<p class="rc-catnote">'+esc(NOTE[k])+'</p>':'')+'<div class="rc-grid">'+its.map(card).join('')+'</div></section>';
      });
    }
    out.innerHTML = html;
  }

  function closeSugg(){ list.hidden = true; list.innerHTML=''; active=-1; shown=[]; input.setAttribute('aria-expanded','false'); }
  function suggest(){
    var q = input.value;
    if (norm(q).length < 2){ closeSugg(); return; }
    shown = search(q).slice(0,6);
    if (!shown.length){
      list.innerHTML = '<li class="rc-none" role="option" aria-disabled="true">Nessun suggerimento per “'+esc(q.trim())+'”</li>';
    } else {
      list.innerHTML = shown.map(function(r,i){
        return '<li role="option" id="sg'+i+'" data-id="'+r.id+'"><img src="'+r.img+'" alt=""><span class="rc-sg-t">'+hl(r.title,q)+'</span><span class="rc-sg-c">'+esc(CAT[r.cat])+'</span></li>';
      }).join('');
    }
    list.hidden = false; active = -1; input.setAttribute('aria-expanded','true');
  }
  function mark(){
    var lis = list.querySelectorAll('li[data-id]');
    lis.forEach(function(li,i){ li.classList.toggle('on', i===active); });
    if (active>-1) input.setAttribute('aria-activedescendant','sg'+active); else input.removeAttribute('aria-activedescendant');
  }

  function open(id){
    var r = R.filter(function(x){ return x.id===id; })[0]; if (!r) return;
    document.getElementById('rc-m-img').src = r.img;
    document.getElementById('rc-m-tag').textContent = CAT[r.cat];
    document.getElementById('rc-m-title').textContent = r.title;
    document.getElementById('rc-m-desc').textContent = r.desc || '';
    var facts = [];
    if (r.prep) facts.push(['Preparazione', r.prep], ['Cottura', r.cook]); else facts.push(['Tempo', r.time]);
    facts.push(['Porzioni', String(r.serves)], ['Difficoltà', r.level]);
    document.getElementById('rc-m-facts').innerHTML = facts.map(function(f){ return '<div><dt>'+f[0]+'</dt><dd>'+esc(f[1])+'</dd></div>'; }).join('');
    document.getElementById('rc-m-ingr').innerHTML = r.ingr.map(function(i){return '<li>'+ingText(i)+'</li>';}).join('');
    document.getElementById('rc-m-steps').innerHTML = r.steps.map(function(x){return '<li>'+esc(x)+'</li>';}).join('');
    var box = document.getElementById('rc-m-dose');
    if (r.dose){
      var h = '<strong>SÂ DE MÂ al posto del sale aggiunto</strong><p class="rc-dose">'+esc(r.dose)+'</p>';
      h += '<p class="rc-stato"><em>Stato della dose.</em> '+esc(r.stato||'Dose iniziale da provare in cucina.')+'</p>';
      if (r.ref) h += '<p class="rc-stato"><a href="'+esc(r.ref)+'" target="_blank" rel="noopener">Riferimento consultato</a></p>';
      box.innerHTML = h;
    } else {
      box.innerHTML = '<strong>Consiglio</strong><p>'+esc(r.consiglio||'')+'</p>';
    }
    document.getElementById('rc-m-img-note').hidden = !r.imgQuery;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open','');
  }

  input.addEventListener('input', function(){ suggest(); render(); });
  input.addEventListener('focus', suggest);
  input.addEventListener('keydown', function(e){
    var n = shown.length;
    if (e.key==='ArrowDown' && n){ e.preventDefault(); active = (active+1)%n; mark(); }
    else if (e.key==='ArrowUp' && n){ e.preventDefault(); active = (active-1+n)%n; mark(); }
    else if (e.key==='Enter'){ e.preventDefault(); if (active>-1 && shown[active]) { var pick = shown[active].id; closeSugg(); open(pick); } else { closeSugg(); render(); out.scrollIntoView({behavior:'smooth',block:'start'}); } }
    else if (e.key==='Escape'){ closeSugg(); }
  });
  list.addEventListener('mousedown', function(e){
    var li = e.target.closest('li[data-id]'); if (!li) return;
    e.preventDefault(); closeSugg(); open(li.getAttribute('data-id'));
  });
  document.addEventListener('click', function(e){
    if (!e.target.closest('.rc-search')) closeSugg();
    var c = e.target.closest('.rc-card'); if (c) open(c.getAttribute('data-id'));
    var close = e.target.closest('[data-close]'); if (close && dlg.close) dlg.close();
    if (e.target === dlg && dlg.close) dlg.close();
  });
  document.getElementById('rc-clear').addEventListener('click', function(){ input.value=''; closeSugg(); render(); input.focus(); });
  chips.forEach(function(ch){
    ch.addEventListener('click', function(){
      activeCat = ch.getAttribute('data-cat');
      chips.forEach(function(c){ c.classList.toggle('on', c===ch); c.setAttribute('aria-pressed', c===ch); });
      render();
    });
  });
  render();
})();
