// Scroll-driven demo showcase — handles centering offset, scene detection, and scroll-driven demo progress
(function () {
  var panel = document.getElementById('demoPanel');
  var chatMessages = document.getElementById('chatMessages');
  var suggestionsEl = document.getElementById('suggestions');
  var chatInputArea = document.querySelector('.demo-sticky-panel .chat-input-area');
  var scenes = document.querySelectorAll('.demo-scene');
  var sectionTitle = document.querySelector('.demo-scene--intro .section-title');

  if (!panel || !scenes.length) return;

  var activeScene = null;
  var hasSaved = false;
  var isMobile = false;
  var centerOffset = 0;

  // ── New scroll-driven state ──
  var currentRenderedSteps = null;
  var activeSceneEl = null;

  // ── A. Centering offset calculation ──
  function calcCenterOffset() {
    isMobile = window.innerWidth <= 900;
    if (isMobile) {
      centerOffset = 0;
      panel.style.transform = '';
      return;
    }
    var inner = panel.parentElement;
    if (!inner) return;

    // Clear inline transform to read natural grid position
    panel.style.transform = 'none';
    var panelRect = panel.getBoundingClientRect();
    var panelNaturalCenterX = panelRect.left + panelRect.width / 2;
    var viewportCenterX = window.innerWidth / 2;
    centerOffset = viewportCenterX - panelNaturalCenterX;

    // Immediately set correct position
    updatePanelPosition();
  }

  calcCenterOffset();
  window.addEventListener('resize', calcCenterOffset, { passive: true });

  // ── B. Scroll-driven panel position ──
  function updatePanelPosition() {
    if (isMobile) return;
    if (!sectionTitle) return;

    var headingRect = sectionTitle.getBoundingClientRect();
    // Transition zone: heading top between bottom of viewport and 50% of viewport
    var start = window.innerHeight;       // heading just entering viewport from below
    var end = window.innerHeight * 0.5;   // heading at mid-viewport → fully docked
    // progress: 0 = fully centered, 1 = fully docked
    var t = 1 - Math.max(0, Math.min(1, (headingRect.top - end) / (start - end)));
    panel.style.transform = 'translateX(' + (centerOffset * (1 - t)) + 'px)';
  }

  // ── C. Scene progress — maps scroll position to 0→1 within a scene ──
  function getSceneProgress(sceneEl) {
    var rect = sceneEl.getBoundingClientRect();
    var viewportCenter = window.innerHeight / 2;
    // 0 = scene top at viewport center, 1 = scene bottom at viewport center
    var progress = (viewportCenter - rect.top) / (rect.bottom - rect.top);
    return Math.max(0, Math.min(1, progress));
  }

  // ── D. Scene detection (scroll-based, rAF throttled) ──
  var ticking = false;

  function getActiveScene() {
    var viewportCenter = window.innerHeight / 2;
    var closest = null;
    var closestDist = Infinity;

    scenes.forEach(function (scene) {
      var rect = scene.getBoundingClientRect();
      var sceneCenter = rect.top + rect.height / 2;
      var dist = Math.abs(sceneCenter - viewportCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closest = scene;
      }
    });

    return closest;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;

      // Panel position tracks scroll every frame
      updatePanelPosition();

      // Detect active scene
      var scene = getActiveScene();
      if (!scene) return;
      var sceneId = scene.getAttribute('data-scene');

      // Reveal text immediately
      revealSceneText(sceneId);

      // Fire scene change immediately — no debounce
      if (sceneId !== activeScene) {
        onSceneChange(sceneId);
      }

      // Continuous progress update for feature scenes
      if (activeScene !== 'intro' && currentRenderedSteps && activeSceneEl) {
        var progress = getSceneProgress(activeSceneEl);
        window.showcaseDemos.updateDemoProgress(currentRenderedSteps, progress);
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ── E. Scene change handler ──
  function onSceneChange(sceneId) {
    activeScene = sceneId;

    if (sceneId === 'intro') {
      // Cancel any running demo
      if (window.showcaseDemos) window.showcaseDemos.cancelDemo();

      // Clear scroll-driven state
      currentRenderedSteps = null;
      activeSceneEl = null;

      // Restore interactive state
      if (window.chatDemoEngine) {
        window.chatDemoEngine.isInteractive = true;
        if (hasSaved) {
          window.chatDemoEngine.restore();
        }
      }

      // Show suggestions + input
      if (suggestionsEl) suggestionsEl.style.display = '';
      if (chatInputArea) chatInputArea.style.display = '';

    } else {
      // Feature scene — scroll-driven mode

      // Null out rendered steps immediately (prevents stale updates during fade)
      currentRenderedSteps = null;

      // Save interactive state (only the first time we leave intro)
      if (window.chatDemoEngine) {
        if (window.chatDemoEngine.isInteractive) {
          window.chatDemoEngine.save();
          hasSaved = true;
        }
        window.chatDemoEngine.isInteractive = false;
      }

      // Cancel any previous demo
      if (window.showcaseDemos) window.showcaseDemos.cancelDemo();

      // Hide suggestions + input
      if (suggestionsEl) suggestionsEl.style.display = 'none';
      if (chatInputArea) chatInputArea.style.display = 'none';

      // Find the scene DOM element
      var sceneEl = null;
      scenes.forEach(function (s) {
        if (s.getAttribute('data-scene') === sceneId) sceneEl = s;
      });
      activeSceneEl = sceneEl;

      // Fade out, clear, prepare new demo, fade back in
      if (chatMessages) {
        chatMessages.style.transition = 'opacity 0.2s ease';
        chatMessages.style.opacity = '0';
        setTimeout(function () {
          chatMessages.innerHTML = '';

          // Reset reveal tracking
          if (window.showcaseDemos) window.showcaseDemos.resetRevealIndex();

          // Prepare all steps hidden
          if (window.showcaseDemos) {
            currentRenderedSteps = window.showcaseDemos.prepareDemoScene(sceneId);
          }

          chatMessages.style.opacity = '1';

          // Immediately update with current progress (handles fast-scroll case)
          if (currentRenderedSteps && activeSceneEl) {
            var progress = getSceneProgress(activeSceneEl);
            window.showcaseDemos.updateDemoProgress(currentRenderedSteps, progress);
          }
        }, 200);
      }
    }
  }

  // ── F. Scene text reveal ──
  function revealSceneText(sceneId) {
    scenes.forEach(function (scene) {
      var content = scene.querySelector('.demo-scene-content');
      if (!content) return;
      if (scene.getAttribute('data-scene') === sceneId) {
        content.classList.add('visible');
      } else {
        content.classList.remove('visible');
      }
    });
  }

  // ── Initial state ──
  activeScene = 'intro';
  var introContent = document.querySelector('.demo-scene--intro .demo-scene-content');
  if (introContent) introContent.classList.add('visible');

  // Run initial scroll check after a short delay to handle page loads mid-scroll
  setTimeout(function () {
    onScroll();
  }, 100);
})();
