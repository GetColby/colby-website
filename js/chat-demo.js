// Interactive chat demo — user clicks suggestion pills to trigger scenario chains
(function () {
  // SVG icons matching extension's lucide icons
  var SPINNER_SVG = '<svg class="tool-icon spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>';
  var CHECK_SVG = '<svg class="tool-icon check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>';

  // ── Scenario map (keyed by ID) with chained follow-up prompts ──
  var scenarios = {
    // ── Chain 1: Starting my day → Campaign check → Add to campaign ──
    'starting-my-day': {
      userPrompt: "Help me prepare for my day.",
      intro: "Let me look into your day and see what you have coming up.",
      introDelay: 1500,
      actions: [
        { type: 'tool', name: 'pull_calendar_events', duration: 2400, preText: 'Pulling your calendar events from Salesforce' },
        { type: 'text', delay: 1200, content: "Today you are meeting with the Williams Group at Morgan Stanley at 11:00 over Zoom and the Alpha Wealth Management Group at RBC. Let me do some research on the advisors on these teams." },
        { type: 'tool', name: 'get_williams_contacts', duration: 1800, preText: 'Pulling Williams Group contacts from Salesforce' },
        { type: 'tool', name: 'get_williams_account', duration: 1600, preText: 'Retrieving Williams Group account information' },
        { type: 'tool', name: 'get_williams_opportunities', duration: 2000, preText: 'Checking opportunities with Williams Group' },
        { type: 'tool', name: 'get_williams_meeting_notes', duration: 1400, preText: 'Pulling meeting note history for Williams Group' },
        { type: 'tool', name: 'read_williams_group_website', duration: 5400, preText: 'Reading the Williams Group website' },
        { type: 'tool', name: 'parse_williams_linkedin', duration: 4800, preText: 'Parsing Williams Group Linkedin' },
        { type: 'tool', name: 'check_williams_finra', duration: 6000, preText: 'Checking Williams Group FINRA profiles' },
        { type: 'text', delay: 2400, content: "Some key pieces to think about:\n\n- Williams Group Meeting (Morgan Stanley)\n    - The Williams group is made up of:\n        - Robert J. Williams, CFP\u00ae - Senior Vice President, Senior Portfolio Management Director\n        - Jennifer Williams-Chen, CFA - Vice President, Wealth Advisor\n        - Michael Torres - Financial Advisor Associate\n    - Robert founded the practice 28 years ago and recently brought his daughter Jennifer onto the team after she started her career at Goldman Sachs Private Wealth Management.\n    - The Williams Group has historically favored low cost ETFs and index strategies, but recent LinkedIn activity from Michael suggests they may be researching tactical allocation strategies for their high-net-worth clients\n    - **From Salesforce:** You last met with Robert 3 weeks ago. In your notes, he mentioned they are looking to implement tactical risk management but are concerned about volatility for their older clients.\n    - **Pipeline:** There is an open opportunity for $8M in Apollo Debt Solutions (ADS) currently in the Proposal stage." },
        { type: 'tool', name: 'get_alpha_contacts', duration: 1800, preText: 'Pulling Alpha Wealth Management Group contacts from Salesforce' },
        { type: 'tool', name: 'get_alpha_account', duration: 1600, preText: 'Retrieving Alpha Wealth Management Group account information' },
        { type: 'tool', name: 'get_alpha_opportunities', duration: 2000, preText: 'Checking opportunities with Alpha Wealth Management Group' },
        { type: 'tool', name: 'get_alpha_meeting_notes', duration: 1400, preText: 'Pulling meeting note history for Alpha Wealth Management Group' },
        { type: 'tool', name: 'read_alpha_group_website', duration: 5400, preText: "Reading the Alpha Group's website" },
        { type: 'tool', name: 'parse_alpha_linkedin', duration: 4800, preText: 'Parsing Alpha Group Linkedin' },
        { type: 'tool', name: 'check_alpha_finra', duration: 6000, preText: 'Checking Alpha Group FINRA profiles' },
        { type: 'text', delay: 1500, content: "I've completed my research. Details on the teams are below:\n\n**Williams Group Meeting (Morgan Stanley) - 11:00 AM**\n- The Williams group is made up of:\n    - Robert J. Williams, CFP\u00ae - Senior Vice President, Senior Portfolio Management Director\n    - Jennifer Williams-Chen, CFA - Vice President, Wealth Advisor\n    - Michael Torres - Financial Advisor Associate\n- Robert founded the practice 28 years ago and recently brought his daughter Jennifer onto the team after she started her career at Goldman Sachs Asset Management.\n- The Williams Group has historically favored low cost ETFs and index strategies, but recent LinkedIn activity from Michael suggests they may be researching tactical allocation strategies for high-net-worth clients\n- **From Salesforce:** You last met with Robert 3 weeks ago. In your notes, he mentioned they are looking to implement tactical risk management but are concerned about volatility for their older clients.\n- **Pipeline:** There is an open opportunity for $8M in Apollo Debt Solutions (ADS) currently in the Proposal stage.\n- **Opportunity:** Position Apollo Debt Solutions (ADS) as a data-driven approach to managing market volatility\u2014emphasize that data beats feelings when it comes to risk management.\n\n**Alpha Wealth Management Group Meeting (RBC) - 2:00 PM**\n- The Alpha Wealth Management Group is made up of:\n    - David Chen, CFA, CFP\u00ae - Managing Director, Senior Portfolio Manager\n    - Patricia Morrison, CIMA\u00ae - Vice President, Wealth Strategist\n    - James Rodriguez - Associate Wealth Advisor\n- David and Patricia have partnered for 18 years and were recently named to Barron's Top 100 Financial Advisors list. They manage over $2.1B in client assets.\n- The team specializes in ultra-high-net-worth families and institutional endowments.\n- **From Salesforce:** Last meeting was 6 weeks ago with David. He expressed interest in Apollo Debt Solutions (ADS) but wanted to wait for Q4 performance data before committing.\n- **Pipeline:** There is an open opportunity for $15M in Apollo Debt Solutions (ADS) currently in the Qualification stage.\n- **Opportunity**: The Alpha team is already invested in a diversified allocation but is seeking capital preservation. Emphasize Apollo Debt Solutions (ADS)\u2019s risk-managed approach\u2014let the data drive decisions, not emotions." }
      ],
      suggestedPrompts: [
        { label: 'Check campaign membership', scenarioId: 'campaign-check' }
      ]
    },
    'campaign-check': {
      userPrompt: "Have any of these advisors opened our recent The Daily Spark campaign?",
      intro: "",
      introDelay: 600,
      actions: [
        { type: 'tool', name: 'search_salesforce_campaign', duration: 2100, preText: 'Search Salesforce for The Daily Spark campaign' },
        { type: 'tool', name: 'check_campaign_members', duration: 600, preText: 'Checking campaign members for Advisors' },
        { type: 'text', delay: 300, content: "None of these advisors are signed up for the current The Daily Spark campaign. Would you like me to add them?" }
      ],
      suggestedPrompts: [
        { label: 'Yes, add them', scenarioId: 'add-to-campaign' }
      ]
    },
    'add-to-campaign': {
      userPrompt: "Yes, add them to the campaign",
      intro: "",
      introDelay: 200,
      actions: [
        { type: 'tool', name: 'add_robert_williams', duration: 500, preText: 'Adding Robert J. Williams' },
        { type: 'tool', name: 'add_jennifer_williams_chen', duration: 500, preText: 'Adding Jennifer Williams-Chen' },
        { type: 'tool', name: 'add_michael_torres', duration: 500, preText: 'Adding Michael Torres' },
        { type: 'tool', name: 'add_david_chen', duration: 500, preText: 'Adding David Chen' },
        { type: 'tool', name: 'add_patricia_morrison', duration: 500, preText: 'Adding Patricia Morrison' },
        { type: 'text', delay: 400, content: "I've added Robert J. Williams, Jennifer Williams-Chen, and Michael Torres from the Williams Group and David Chen and Patricia Morrison from the Alpha Wealth Management Group.\n\nI did not add James Rodriguez from the Alpha Wealth Management Group because he has opted out of marketing emails. You will need confirmation from him before you are able to add him to email communication." }
      ],
      suggestedPrompts: []
    },

    // ── Chain 2: Finding and updating records → Pending opportunities ──
    'finding-and-updating-records': {
      userPrompt: "The advisor Maddie from last week has decided to move forward with a $5M transaction, can you move the opportunity with her to closed?",
      intro: "",
      introDelay: 300,
      actions: [
        { type: 'tool', name: 'look_for_contacts_last_week', duration: 700, preText: 'Looking for Contacts you met with last week' },
        { type: 'tool', name: 'look_at_madison_opportunities', duration: 600, preText: 'Looking at Opportunities associated with Madison' },
        { type: 'tool', name: 'update_madison_opportunity', duration: 800, preText: 'Updating Opportunity' },
        { type: 'text', delay: 400, content: "I've updated the opportunity with Madison to Closed - Pending Onboarding. Would you like me to look at other opportunities that have been pending onboarding for more than two weeks?" }
      ],
      suggestedPrompts: [
        { label: 'Yes, check pending', scenarioId: 'pending-opportunities' }
      ]
    },
    'pending-opportunities': {
      userPrompt: "Yes, look at other opportunities that are pending",
      intro: "I'll pull those now.",
      introDelay: 300,
      actions: [
        { type: 'tool', name: 'pull_pending_opportunities', duration: 900, preText: 'Pulling Opportunities' },
        { type: 'text', delay: 400, content: "It looks like the below opportunities are having some issues.\n\n- Generational Wealth - Apollo Debt Solutions (ADS) - $100M\n- Creative Planning - Apollo Debt Solutions (ADS) - $16M\n\nI'll look at trades that aren't in good order." },
        { type: 'tool', name: 'read_nigo_cases', duration: 800, preText: 'Reading NIGO Cases' },
        { type: 'text', delay: 500, content: "It looks like Generational Wealth is missing it's subscription doc. Creative Planning's NIGO issues appear to be resolved this morning. You should see that trade come in shortly.\n\nI've drafted the below email to help you get back to George at Generational.\n\n---\n\nHi George,\n\nI hope that your daughter's gymnastics championship went well last weekend!\n\nI noticed that there's an error with the subscription document that was submitted last week. Do you mind re-submitting that now so we can get you into the fund?\n\nBest,\n\nLiam\n\n---\n\nPlease let me know if there is anything else that I can do to help!" }
      ],
      suggestedPrompts: []
    },

    // ── Chain 3: Pipeline chart → West region analysis ──
    'pipeline-chart': {
      userPrompt: "Total Pipeline chart by region for the Wirehouse Team",
      intro: "Starting!",
      introDelay: 400,
      actions: [
        { type: 'tool', name: 'pull_opportunity_data', duration: 1000, preText: 'Pulling Opportunity data' },
        {
          type: 'chart',
          chartTitle: 'Total Pipeline by Region for Wirehouse Team',
          months: ['Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026'],
          regions: [
            { name: 'Northeast', color: 'hsl(210, 60%, 65%)', data: [450, 520, 480, 420, 510, 420] },
            { name: 'Southeast', color: 'hsl(160, 45%, 55%)', data: [380, 450, 410, 360, 430, 370] },
            { name: 'Midwest', color: 'hsl(240, 40%, 65%)', data: [300, 350, 320, 280, 340, 310] },
            { name: 'West', color: 'hsl(30, 50%, 65%)', data: [180, 220, 200, 170, 230, 200] }
          ]
        },
        { type: 'text', delay: 500, content: "Here is a chart of your current opportunities by region, amount, and close month!" }
      ],
      suggestedPrompts: [
        { label: 'Why is West region low?', scenarioId: 'west-region-analysis' }
      ]
    },
    'west-region-analysis': {
      userPrompt: "The West region is looking low, what has changed since last week?",
      intro: "",
      introDelay: 300,
      actions: [
        { type: 'tool', name: 'pull_opportunity_history', duration: 900, preText: 'Pulling Opportunity History' },
        { type: 'text', delay: 500, content: "It looks like three big opportunities were marked as closed last week. All three cited competitor strategies with more aggressive yield profiles as the leading reason that our Apollo Debt Solutions (ADS) wasn\u2019t selected.\n\nIt also looks there have been no activities against these opportunities for 5 months. It\u2019s possible that they were lost last quarter, and Pat waited to update his opportunities until this week. Remember: data beats feelings\u2014let\u2019s analyze the patterns and adjust our approach." }
      ],
      suggestedPrompts: []
    }
  };

  // ── 3 initial entry-point pills ──
  var initialPills = [
    { label: 'Prepare for my day', scenarioId: 'starting-my-day' },
    { label: 'Update a record', scenarioId: 'finding-and-updating-records' },
    { label: 'Pull a chart', scenarioId: 'pipeline-chart' }
  ];

  // ── DOM references ──
  var chatMessages = document.getElementById('chatMessages');
  var chatInput = document.getElementById('chatInput');
  var suggestionsEl = document.getElementById('suggestions');

  // ── Helpers ──
  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatTime() {
    var d = new Date();
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  function parseMarkdown(text) {
    var lines = text.split('\n');
    var out = [];
    var depthStack = []; // tracks open <ul> nesting depths

    function applyInline(str) {
      var s = escapeHtml(str);
      s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
      return s;
    }

    function closeListsTo(targetDepth) {
      while (depthStack.length > 0 && depthStack[depthStack.length - 1] >= targetDepth) {
        depthStack.pop();
        out.push('</ul>');
      }
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var match = line.match(/^(\s*)- (.+)$/);
      if (match) {
        var spaces = match[1].length;
        var depth = Math.floor(spaces / 4);
        var content = match[2];

        // Open new <ul> levels as needed
        while (depthStack.length <= depth) {
          out.push('<ul>');
          depthStack.push(depthStack.length);
        }
        // Close deeper levels if we moved back up
        closeListsTo(depth + 1);

        out.push('<li>' + applyInline(content) + '</li>');
      } else {
        // Non-list line: close all open lists
        closeListsTo(0);
        if (line.match(/^---$/)) {
          out.push('<hr>');
        } else {
          out.push(applyInline(line));
        }
      }
    }
    // Close any remaining open lists
    closeListsTo(0);

    return out.join('<br>').replace(/<\/li><br>/g, '</li>').replace(/<br><li>/g, '<li>').replace(/<br><\/ul>/g, '</ul>').replace(/<ul><br>/g, '<ul>').replace(/<br><ul>/g, '<ul>').replace(/<\/ul><br><ul>/g, '</ul><ul>');
  }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function scrollChat() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ── Message rendering (extension-style) ──
  function addUserMessage(text) {
    var msg = document.createElement('div');
    msg.className = 'message user';
    msg.innerHTML =
      '<div class="msg-label">' +
        '<span class="msg-label-name">You</span>' +
        '<span>\u2022</span>' +
        '<span>' + formatTime() + '</span>' +
      '</div>' +
      '<div class="msg-bubble">' + escapeHtml(text) + '</div>';
    chatMessages.appendChild(msg);
    scrollChat();
  }

  function createAIMessage() {
    var msg = document.createElement('div');
    msg.className = 'message ai';
    msg.innerHTML =
      '<div class="msg-label">' +
        '<span class="msg-label-name">Colby</span>' +
        '<span>\u2022</span>' +
        '<span>' + formatTime() + '</span>' +
      '</div>';
    var bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    msg.appendChild(bubble);
    chatMessages.appendChild(msg);
    scrollChat();
    return bubble;
  }

  // ── Text streaming ──
  function findNthWordEnd(text, n) {
    var count = 0;
    var inWord = false;
    for (var i = 0; i < text.length; i++) {
      var isSpace = /\s/.test(text[i]);
      if (!isSpace && !inWord) {
        inWord = true;
      } else if (isSpace && inWord) {
        count++;
        inWord = false;
        if (count >= n) return i;
      }
    }
    if (inWord) count++;
    if (count >= n) return text.length;
    return text.length;
  }

  async function streamText(container, text, speed) {
    var html = parseMarkdown(text);
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    var textContent = wrapper.textContent || '';
    var words = textContent.split(/\s+/);

    var el = document.createElement('div');
    container.appendChild(el);

    for (var i = 0; i < words.length; i++) {
      el.innerHTML = parseMarkdown(text.substring(0, findNthWordEnd(text, i + 1)));
      scrollChat();
      await sleep(speed || 25);
    }
    el.innerHTML = html;
    scrollChat();
  }

  // ── Tool call pills ──
  function addToolCall(container, name, requestType, preText) {
    var el = document.createElement('div');
    el.className = 'tool-call';
    var displayName = preText || name;
    el.innerHTML =
      SPINNER_SVG +
      '<span class="tool-name">' + escapeHtml(displayName) + '</span>';
    container.appendChild(el);
    scrollChat();
    return el;
  }

  function completeToolCall(el) {
    el.querySelector('.tool-icon').outerHTML = CHECK_SVG;
  }

  // ── Chart rendering ──
  function addChart(container, chartData) {
    var chart = document.createElement('div');
    chart.className = 'chat-chart';

    var title = document.createElement('div');
    title.className = 'chat-chart-title';
    title.textContent = chartData.chartTitle;
    chart.appendChild(title);

    var monthCount = chartData.months.length;
    var totals = [];
    for (var m = 0; m < monthCount; m++) {
      var total = 0;
      chartData.regions.forEach(function (r) { total += r.data[m]; });
      totals.push(total);
    }
    var maxTotal = Math.max.apply(null, totals);

    var barsContainer = document.createElement('div');
    barsContainer.className = 'chart-bars';
    chart.appendChild(barsContainer);

    for (var m = 0; m < monthCount; m++) {
      var group = document.createElement('div');
      group.className = 'chart-bar-group';

      var stack = document.createElement('div');
      stack.className = 'chart-bar-stack';
      stack.style.height = '0px';

      chartData.regions.forEach(function (region) {
        var seg = document.createElement('div');
        seg.className = 'chart-bar-segment';
        seg.style.backgroundColor = region.color;
        seg.style.height = '0px';
        stack.appendChild(seg);
      });

      group.appendChild(stack);

      var label = document.createElement('div');
      label.className = 'chart-bar-label';
      label.textContent = chartData.months[m];
      group.appendChild(label);

      barsContainer.appendChild(group);
    }

    var legend = document.createElement('div');
    legend.className = 'chart-legend';
    chartData.regions.forEach(function (region) {
      var item = document.createElement('div');
      item.className = 'chart-legend-item';
      item.innerHTML = '<div class="chart-legend-dot" style="background:' + region.color + '"></div>' + escapeHtml(region.name);
      legend.appendChild(item);
    });
    chart.appendChild(legend);

    container.appendChild(chart);
    scrollChat();

    // Animate bars
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var stacks = chart.querySelectorAll('.chart-bar-stack');
        stacks.forEach(function (stack, m) {
          var totalHeight = (totals[m] / maxTotal) * 130;
          stack.style.height = totalHeight + 'px';
          var segments = stack.querySelectorAll('.chart-bar-segment');
          segments.forEach(function (seg, r) {
            var val = chartData.regions[r].data[m];
            var segHeight = (val / totals[m]) * totalHeight;
            seg.style.height = segHeight + 'px';
          });
        });
      });
    });
  }

  // ── Expose shared renderer for scroll-showcase ──
  window.chatRenderer = {
    SPINNER_SVG: SPINNER_SVG,
    CHECK_SVG: CHECK_SVG,
    escapeHtml: escapeHtml,
    parseMarkdown: parseMarkdown,
    formatTime: formatTime,
    sleep: sleep,
    scrollChat: scrollChat,
    addUserMessage: addUserMessage,
    createAIMessage: createAIMessage,
    streamText: streamText,
    addToolCall: addToolCall,
    completeToolCall: completeToolCall,
    addChart: addChart
  };

  // ── Simulate typing into the input field ──
  async function simulateTyping(text) {
    chatInput.value = '';
    for (var i = 0; i < text.length; i++) {
      chatInput.value += text[i];
      // Scroll textarea if needed
      chatInput.scrollTop = chatInput.scrollHeight;
      await sleep(18 + Math.random() * 22);
    }
    await sleep(400);
    chatInput.value = '';
  }

  // ── Run a single scenario ──
  async function runScenario(scenario) {
    var bubble = createAIMessage();

    // Show intro text if present
    if (scenario.intro) {
      await streamText(bubble, scenario.intro, 25);
      if (scenario.introDelay) await sleep(scenario.introDelay);
    }

    for (var i = 0; i < scenario.actions.length; i++) {
      var action = scenario.actions[i];
      if (action.type === 'text') {
        if (action.delay) await sleep(action.delay);
        await streamText(bubble, action.content, 20);
      } else if (action.type === 'tool') {
        var toolEl = addToolCall(bubble, action.name, action.requestType, action.preText);
        await sleep(action.duration);
        completeToolCall(toolEl);
      } else if (action.type === 'chart') {
        addChart(bubble, action);
        await sleep(800);
      }
    }
  }

  // ── Interactive demo engine ──
  var isRunning = false;

  function showPills(pills) {
    suggestionsEl.innerHTML = '';
    suggestionsEl.style.display = '';
    for (var i = 0; i < pills.length; i++) {
      (function (pill) {
        var btn = document.createElement('button');
        btn.className = 'suggestion-chip';
        btn.textContent = pill.label;
        btn.addEventListener('click', function () {
          onPillClick(pill);
        });
        suggestionsEl.appendChild(btn);
      })(pills[i]);
    }
    scrollChat();
  }

  function hidePills() {
    suggestionsEl.innerHTML = '';
    suggestionsEl.style.display = 'none';
  }

  async function onPillClick(pill) {
    // Block clicks during auto-play mode
    if (isRunning || (window.chatDemoEngine && !window.chatDemoEngine.isInteractive)) return;
    isRunning = true;

    var scenario = scenarios[pill.scenarioId];
    if (!scenario) { isRunning = false; return; }

    // Hide current pills
    hidePills();

    // Simulate typing the user prompt
    await simulateTyping(scenario.userPrompt);

    // Show user message
    addUserMessage(scenario.userPrompt);

    // Brief pause before AI responds
    await sleep(600);

    // Run the AI response
    await runScenario(scenario);

    // Determine next pills
    await sleep(800);
    var nextPills = scenario.suggestedPrompts && scenario.suggestedPrompts.length > 0
      ? scenario.suggestedPrompts
      : initialPills;
    showPills(nextPills);

    isRunning = false;
  }

  async function startDemo() {
    // Initial greeting
    await sleep(600);
    var greeting = createAIMessage();
    await streamText(greeting, "Hey \u2014 I\u2019m Colby, your distribution copilot. I can prep your day, log CRM notes by voice, draft follow-ups, and surface pipeline insights. What do you need?", 25);

    await sleep(500);
    showPills(initialPills);
  }

  // ── Save / Restore engine for scroll-showcase ──
  var savedState = null;

  window.chatDemoEngine = {
    isInteractive: true,
    save: function () {
      savedState = {
        messagesHTML: chatMessages.innerHTML,
        suggestionsHTML: suggestionsEl.innerHTML,
        suggestionsDisplay: suggestionsEl.style.display
      };
    },
    restore: function () {
      if (!savedState) return;
      chatMessages.innerHTML = savedState.messagesHTML;
      suggestionsEl.innerHTML = savedState.suggestionsHTML;
      suggestionsEl.style.display = savedState.suggestionsDisplay;
      // Re-bind pill click handlers
      var chips = suggestionsEl.querySelectorAll('.suggestion-chip');
      chips.forEach(function (chip) {
        var label = chip.textContent;
        // Find matching pill by label in scenarios or initialPills
        var matchedPill = null;
        initialPills.forEach(function (p) { if (p.label === label) matchedPill = p; });
        if (!matchedPill) {
          // Search through scenario suggestedPrompts
          Object.keys(scenarios).forEach(function (key) {
            var sc = scenarios[key];
            if (sc.suggestedPrompts) {
              sc.suggestedPrompts.forEach(function (p) { if (p.label === label) matchedPill = p; });
            }
          });
        }
        if (matchedPill) {
          var newChip = chip.cloneNode(true);
          chip.parentNode.replaceChild(newChip, chip);
          newChip.addEventListener('click', function () { onPillClick(matchedPill); });
        }
      });
      scrollChat();
    },
    showPills: showPills,
    hidePills: hidePills,
    initialPills: initialPills
  };

  // Start the interactive demo
  startDemo();
})();
