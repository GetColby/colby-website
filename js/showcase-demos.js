// Scroll-driven demo engine for showcase sections — renders into the main chat container
(function () {
  var chatMessages = document.getElementById('chatMessages');

  // ── Demo scenario definitions ──
  var demoScenarios = {
    // Showcase 01: Granular Reports in Seconds
    showcaseDemo1: [
      { type: 'tool', name: 'Pulling opportunity data', requestType: 'salesforce_query', duration: 1000 },
      { type: 'tool', name: 'Aggregating pipeline by region', requestType: 'salesforce_query', duration: 1200 },
      {
        type: 'chart',
        chartTitle: 'Revenue by Region',
        months: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
        regions: [
          { name: 'Wirehouses', color: 'hsl(210, 60%, 65%)', data: [450, 520, 580, 620, 710, 680] },
          { name: 'RIAs', color: 'hsl(160, 45%, 55%)', data: [280, 350, 310, 460, 430, 520] },
          { name: 'Banks', color: 'hsl(240, 40%, 65%)', data: [200, 250, 320, 280, 340, 380] }
        ]
      },
      { type: 'text', delay: 600, content: '**25%** average revenue growth across all channels.' },
      { type: 'text', delay: 300, content: 'Wirehouse pipeline up **$2.4M** since Q1.' }
    ],

    // Showcase 02: Automated Data Entry
    showcaseDemo2: [
      { type: 'user', text: "I met with Sarah Chen at Fidelity about a $12M allocation" },
      { type: 'pause', duration: 500 },
      { type: 'tool', name: 'Parsing meeting notes', requestType: 'salesforce_query', duration: 800 },
      { type: 'tool', name: 'Matching contact: Sarah Chen', requestType: 'salesforce_query', duration: 700 },
      { type: 'tool', name: 'Creating new Opportunity', requestType: 'salesforce_create', duration: 900 },
      { type: 'tool', name: 'Logging activity to Salesforce', requestType: 'salesforce_update', duration: 600 },
      { type: 'text', delay: 400, content: "Done! Created a new **$12M opportunity** for Sarah Chen at Fidelity." },
      { type: 'text', delay: 200, content: 'Meeting activity has been logged and linked to the contact record.' }
    ],

    // Showcase 03: Key Information at the Right Time
    showcaseDemo3: [
      { type: 'tool', name: 'Pulling calendar events', requestType: 'salesforce_query', duration: 1200 },
      { type: 'tool', name: 'Researching Williams Group', requestType: 'external_search', duration: 1000 },
      { type: 'tool', name: 'Checking FINRA records', requestType: 'external_search', duration: 1400 },
      { type: 'tool', name: 'Pulling CRM history', requestType: 'salesforce_query', duration: 1600 },
      { type: 'text', delay: 600, content: '**Williams Group Meeting Brief**' },
      { type: 'text', delay: 200, content: 'Robert J. Williams, CFP\u00ae \u2014 Senior VP at Morgan Stanley. AUA: **$12M+**' },
      { type: 'text', delay: 200, content: '**Pipeline:** $8M in Apollo Debt Solutions (Proposal stage)' },
      { type: 'text', delay: 200, content: '**Recommendation:** Position ADS as data-driven risk management for volatility concerns.' }
    ]
  };

  // ── Running state with generation counter for clean cancellation ──
  var currentGeneration = 0;

  // ── A. Compute thresholds — distributes step thresholds across 0→1 range ──
  function computeThresholds(steps) {
    // Filter out pauses
    var filtered = [];
    for (var i = 0; i < steps.length; i++) {
      if (steps[i].type !== 'pause') filtered.push(steps[i]);
    }

    // Assign weights
    var weights = { tool: 2, text: 1, chart: 2, user: 1 };
    var totalWeight = 0;
    for (var i = 0; i < filtered.length; i++) {
      totalWeight += (weights[filtered[i].type] || 1);
    }

    // 5% padding on each end
    var padStart = 0.05;
    var padEnd = 0.05;
    var usable = 1 - padStart - padEnd;

    var result = [];
    var cumulative = 0;

    for (var i = 0; i < filtered.length; i++) {
      var step = filtered[i];
      var w = weights[step.type] || 1;
      var showAt = padStart + (cumulative / totalWeight) * usable;

      if (step.type === 'tool' || step.type === 'chart') {
        // Two thresholds: appear at showAt, complete at midpoint of this step's range
        var completeAt = padStart + ((cumulative + w * 0.6) / totalWeight) * usable;
        result.push({ step: step, showAt: showAt, completeAt: completeAt });
      } else {
        result.push({ step: step, showAt: showAt, completeAt: null });
      }

      cumulative += w;
    }

    return result;
  }

  // ── B. Prepare a demo scene — pre-renders all steps hidden ──
  function prepareDemoScene(sceneId) {
    var steps = demoScenarios[sceneId];
    if (!steps || !window.chatRenderer) return null;

    var r = window.chatRenderer;
    var thresholds = computeThresholds(steps);
    var renderedSteps = [];
    var currentBubble = null;
    var needNewBubble = true; // start needing a bubble

    for (var i = 0; i < thresholds.length; i++) {
      var t = thresholds[i];
      var step = t.step;

      if (step.type === 'user') {
        // User message — creates its own message element
        r.addUserMessage(step.text);
        var userEl = chatMessages.lastElementChild;
        userEl.classList.add('scroll-controlled');
        userEl.classList.add('scroll-step');
        userEl.style.opacity = '0';

        renderedSteps.push({
          type: 'user',
          showAt: t.showAt,
          completeAt: null,
          el: userEl
        });

        // Next step needs a new AI bubble
        needNewBubble = true;

      } else {
        // Ensure we have an AI bubble
        if (needNewBubble || !currentBubble) {
          currentBubble = r.createAIMessage();
          // Mark the parent .message as scroll-controlled to disable animation
          currentBubble.parentElement.classList.add('scroll-controlled');
          needNewBubble = false;
        }

        if (step.type === 'tool') {
          // Create tool call pill with spinner
          var toolEl = r.addToolCall(currentBubble, step.name, step.requestType || 'query', step.name);
          toolEl.classList.add('scroll-step');
          toolEl.style.opacity = '0';

          // Replace the single icon with dual spinner/check wrappers for reversible toggling
          var existingIcon = toolEl.querySelector('.tool-icon');
          if (existingIcon) {
            // Create spinner wrapper
            var spinnerWrapper = document.createElement('span');
            spinnerWrapper.className = 'scroll-spinner-icon';
            spinnerWrapper.innerHTML = r.SPINNER_SVG;

            // Create check wrapper (hidden initially)
            var checkWrapper = document.createElement('span');
            checkWrapper.className = 'scroll-check-icon';
            checkWrapper.style.display = 'none';
            checkWrapper.innerHTML = r.CHECK_SVG;

            existingIcon.parentNode.replaceChild(spinnerWrapper, existingIcon);
            spinnerWrapper.parentNode.insertBefore(checkWrapper, spinnerWrapper.nextSibling);
          }

          renderedSteps.push({
            type: 'tool',
            showAt: t.showAt,
            completeAt: t.completeAt,
            el: toolEl,
            spinnerWrapper: toolEl.querySelector('.scroll-spinner-icon'),
            checkWrapper: toolEl.querySelector('.scroll-check-icon'),
            completed: false
          });

        } else if (step.type === 'text') {
          var textDiv = document.createElement('div');
          textDiv.innerHTML = r.parseMarkdown(step.content);
          textDiv.classList.add('scroll-step');
          textDiv.style.opacity = '0';
          currentBubble.appendChild(textDiv);

          renderedSteps.push({
            type: 'text',
            showAt: t.showAt,
            completeAt: null,
            el: textDiv
          });

        } else if (step.type === 'chart') {
          // Build chart DOM manually (no double-rAF animation trigger)
          var chartData = step;
          var chart = document.createElement('div');
          chart.className = 'chat-chart scroll-step';
          chart.style.opacity = '0';

          var title = document.createElement('div');
          title.className = 'chat-chart-title';
          title.textContent = chartData.chartTitle;
          chart.appendChild(title);

          var monthCount = chartData.months.length;
          var totals = [];
          for (var m = 0; m < monthCount; m++) {
            var total = 0;
            chartData.regions.forEach(function (reg) { total += reg.data[m]; });
            totals.push(total);
          }
          var maxTotal = Math.max.apply(null, totals);

          var barsContainer = document.createElement('div');
          barsContainer.className = 'chart-bars';
          chart.appendChild(barsContainer);

          var barRefs = []; // store references for animation

          for (var m = 0; m < monthCount; m++) {
            var group = document.createElement('div');
            group.className = 'chart-bar-group';

            var stack = document.createElement('div');
            stack.className = 'chart-bar-stack';
            stack.style.height = '0px';

            var segRefs = [];
            var totalHeight = (totals[m] / maxTotal) * 130;

            for (var regionIdx = 0; regionIdx < chartData.regions.length; regionIdx++) {
              var seg = document.createElement('div');
              seg.className = 'chart-bar-segment';
              seg.style.backgroundColor = chartData.regions[regionIdx].color;
              seg.style.height = '0px';
              stack.appendChild(seg);

              var val = chartData.regions[regionIdx].data[m];
              segRefs.push({
                el: seg,
                targetHeight: (val / totals[m]) * totalHeight
              });
            }

            group.appendChild(stack);

            var label = document.createElement('div');
            label.className = 'chart-bar-label';
            label.textContent = chartData.months[m];
            group.appendChild(label);

            barsContainer.appendChild(group);

            barRefs.push({
              stack: stack,
              targetHeight: totalHeight,
              segments: segRefs
            });
          }

          var legend = document.createElement('div');
          legend.className = 'chart-legend';
          chartData.regions.forEach(function (region) {
            var item = document.createElement('div');
            item.className = 'chart-legend-item';
            item.innerHTML = '<div class="chart-legend-dot" style="background:' + region.color + '"></div>' + r.escapeHtml(region.name);
            legend.appendChild(item);
          });
          chart.appendChild(legend);

          currentBubble.appendChild(chart);

          renderedSteps.push({
            type: 'chart',
            showAt: t.showAt,
            completeAt: t.completeAt,
            el: chart,
            barRefs: barRefs,
            animated: false
          });
        }
      }
    }

    return renderedSteps;
  }

  // ── C. Update demo progress — toggles visibility per frame ──
  var lastRevealedIndex = -1;

  function updateDemoProgress(renderedSteps, progress) {
    if (!renderedSteps) return;

    var newRevealedIndex = -1;

    for (var i = 0; i < renderedSteps.length; i++) {
      var rs = renderedSteps[i];
      var visible = progress >= rs.showAt;

      if (rs.type === 'user' || rs.type === 'text') {
        rs.el.style.opacity = visible ? '1' : '0';
      } else if (rs.type === 'tool') {
        rs.el.style.opacity = visible ? '1' : '0';

        var complete = rs.completeAt !== null && progress >= rs.completeAt;
        if (complete && !rs.completed) {
          // Show check, hide spinner
          if (rs.spinnerWrapper) rs.spinnerWrapper.style.display = 'none';
          if (rs.checkWrapper) rs.checkWrapper.style.display = '';
          rs.completed = true;
        } else if (!complete && rs.completed) {
          // Reverse: show spinner, hide check
          if (rs.spinnerWrapper) rs.spinnerWrapper.style.display = '';
          if (rs.checkWrapper) rs.checkWrapper.style.display = 'none';
          rs.completed = false;
        }
      } else if (rs.type === 'chart') {
        rs.el.style.opacity = visible ? '1' : '0';

        var complete = rs.completeAt !== null && progress >= rs.completeAt;
        if (complete && !rs.animated) {
          // Animate bars to target heights
          for (var b = 0; b < rs.barRefs.length; b++) {
            var bar = rs.barRefs[b];
            bar.stack.style.height = bar.targetHeight + 'px';
            for (var s = 0; s < bar.segments.length; s++) {
              bar.segments[s].el.style.height = bar.segments[s].targetHeight + 'px';
            }
          }
          rs.animated = true;
        } else if (!complete && rs.animated) {
          // Collapse bars
          for (var b = 0; b < rs.barRefs.length; b++) {
            var bar = rs.barRefs[b];
            bar.stack.style.height = '0px';
            for (var s = 0; s < bar.segments.length; s++) {
              bar.segments[s].el.style.height = '0px';
            }
          }
          rs.animated = false;
        }
      }

      if (visible) newRevealedIndex = i;
    }

    // Auto-scroll chat to latest revealed step (only when a new step crosses threshold)
    if (newRevealedIndex > lastRevealedIndex && newRevealedIndex >= 0) {
      var targetEl = renderedSteps[newRevealedIndex].el;
      if (targetEl && chatMessages) {
        targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
    lastRevealedIndex = newRevealedIndex;
  }

  // ── Public API ──
  window.showcaseDemos = {
    prepareDemoScene: prepareDemoScene,
    updateDemoProgress: updateDemoProgress,
    resetRevealIndex: function () { lastRevealedIndex = -1; },
    cancelDemo: function () { currentGeneration++; }
  };
})();
