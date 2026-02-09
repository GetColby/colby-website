// Intersection Observer for scroll reveal
(function () {
  // Scroll reveal for all sections
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.section:not(.hero-section)').forEach(function (section) {
    revealObserver.observe(section);
  });
})();

// ── Cursor spotlight tracking ──
(function () {
  var body = document.body;
  var mouseX = 0.5, mouseY = 0.5;
  var currentX = 0.5, currentY = 0.5;
  var ease = 0.15;
  var running = false;

  function animate() {
    currentX += (mouseX - currentX) * ease;
    currentY += (mouseY - currentY) * ease;
    body.style.setProperty('--mouse-x', currentX.toFixed(4));
    body.style.setProperty('--mouse-y', currentY.toFixed(4));

    if (Math.abs(mouseX - currentX) > 0.0001 || Math.abs(mouseY - currentY) > 0.0001) {
      requestAnimationFrame(animate);
    } else {
      running = false;
    }
  }

  function startIfNeeded() {
    if (!running) { running = true; animate(); }
  }

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
    startIfNeeded();
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    if (e.touches.length > 0) {
      mouseX = e.touches[0].clientX / window.innerWidth;
      mouseY = e.touches[0].clientY / window.innerHeight;
      startIfNeeded();
    }
  }, { passive: true });
})();
