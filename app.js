(function(){
  var qtyState = {};
  document.querySelectorAll('[data-qty]').forEach(function(box){
    var key = box.getAttribute('data-qty');
    qtyState[key] = 1;
    var valueEl = box.querySelector('[data-role="qty-value"]');
    box.querySelectorAll('button').forEach(function(btn){
      btn.addEventListener('click', function(){
        var delta = btn.getAttribute('data-action') === 'plus' ? 1 : -1;
        qtyState[key] = Math.max(1, Math.min(20, qtyState[key] + delta));
        valueEl.textContent = qtyState[key];
      });
    });
  });

  var cart = {};
  try {
    var saved = localStorage.getItem('sadema_cart');
    if (saved) cart = JSON.parse(saved);
  } catch(e) { cart = {}; }

  function saveCart(){
    try { localStorage.setItem('sadema_cart', JSON.stringify(cart)); } catch(e) {}
  }

  function renderCart(){
    var count = 0, total = 0;
    Object.keys(cart).forEach(function(k){
      count += cart[k].qty;
      total += cart[k].qty * cart[k].price;
    });
    var bar = document.getElementById('cartbar');
    if (!bar) return;
    document.getElementById('cartbar-info').textContent = count + (count === 1 ? ' articolo nel carrello' : ' articoli nel carrello');
    document.getElementById('cartbar-total').textContent = '€ ' + total.toFixed(2).replace('.', ',');
    if (count > 0) bar.classList.add('show'); else bar.classList.remove('show');
  }

  document.querySelectorAll('.add-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var product = btn.getAttribute('data-product');
      var price = parseFloat(btn.getAttribute('data-price'));
      var name = btn.getAttribute('data-name');
      var qtyBox = document.querySelector('[data-qty="' + product + '"] [data-role="qty-value"]');
      var qty = parseInt(qtyBox.textContent, 10);

      if (!cart[product]) cart[product] = { name: name, price: price, qty: 0 };
      cart[product].qty += qty;
      saveCart();
      renderCart();

      var original = btn.textContent;
      btn.textContent = 'Aggiunto ✓';
      btn.classList.add('added');
      setTimeout(function(){
        btn.textContent = original;
        btn.classList.remove('added');
      }, 1200);
    });
  });

  function buildOrderSummary(){
    var lines = [];
    var total = 0;
    Object.keys(cart).forEach(function(k){
      var item = cart[k];
      var subtotal = item.qty * item.price;
      total += subtotal;
      lines.push(item.qty + 'x ' + item.name + ' — € ' + subtotal.toFixed(2).replace('.', ','));
    });
    lines.push('');
    lines.push('Totale (spedizione esclusa): € ' + total.toFixed(2).replace('.', ','));
    return lines.join('%0D%0A');
  }

  var checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function(e){
      e.preventDefault();
      if (Object.keys(cart).length === 0) return;
      var body = buildOrderSummary();
      var subject = 'Nuovo ordine SÂ DE MÂ';
      window.location.href = 'mailto:ordini@sadema.it?subject=' + encodeURIComponent(subject) + '&body=' + body;
    });
  }

  document.querySelectorAll('[data-cart-open]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      document.getElementById('cartbar').scrollIntoView({behavior:'smooth', block:'end'});
    });
  });

  renderCart();
})();

// Menu mobile (tre linee)
(function(){
  var header = document.querySelector('header.nav');
  var btn = document.querySelector('.nav-toggle');
  if (!header || !btn) return;
  function setOpen(open){
    header.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
  }
  btn.addEventListener('click', function(){ setOpen(!header.classList.contains('open')); });
  document.querySelectorAll('.navlinks a').forEach(function(a){
    a.addEventListener('click', function(){ setOpen(false); });
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', function(){ if (window.innerWidth > 900) setOpen(false); });
})();

// Slide laterali della home
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.side-slider').forEach(function(box){
    var track = box.querySelector('.slider-track');
    var slides = box.querySelectorAll('.slide');
    var dotsBox = box.querySelector('.slider-dots');
    if (!track || slides.length < 2) return;
    var i = 0, timer = null, paused = false;
    var dots = [];
    slides.forEach(function(_, k){
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Immagine ' + (k + 1));
      b.addEventListener('click', function(){ go(k); restart(); });
      dotsBox.appendChild(b); dots.push(b);
    });
    function go(n){
      i = (n + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-100 * i) + '%)';
      dots.forEach(function(d, k){ d.classList.toggle('on', k === i); });
    }
    function restart(){
      if (timer) clearInterval(timer);
      if (reduce) return;
      timer = setInterval(function(){ if (!paused) go(i + 1); }, 4800);
    }
    box.addEventListener('mouseenter', function(){ paused = true; });
    box.addEventListener('mouseleave', function(){ paused = false; });
    go(0);
    var delay = parseInt(box.getAttribute('data-delay') || '0', 10);
    setTimeout(restart, delay);
  });
})();
