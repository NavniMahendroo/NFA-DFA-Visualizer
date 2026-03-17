// Minimal subset-construction visualizer (no external libs)
(function(){
  const sample = `States: q0,q1,q2
Alphabet: a,b
Start: q0
Accepting: q2
Transitions:
q0,a->q0,q1
q0,eps->q2
q1,b->q2`;

  const els = {
    nfaInput: document.getElementById('nfaInput'),
    parseBtn: document.getElementById('parseBtn'),
    stepBtn: document.getElementById('stepBtn'),
    runAllBtn: document.getElementById('runAllBtn'),
    resetBtn: document.getElementById('resetBtn'),
    stepsList: document.getElementById('stepsList'),
    nfaSvg: document.getElementById('nfaSvg'),
    dfaSvg: document.getElementById('dfaSvg'),
    nfaTableContainer: document.getElementById('nfaTableContainer'),
    dfaTableContainer: document.getElementById('dfaTableContainer')
  };

  let nfa = null, dfa = null, steps = [], stepIndex = 0;

  function normalizeStateSet(states){
    return Array.from(new Set(states.filter(Boolean))).sort();
  }

  function subsetLabel(states){
    return states.length ? `{${states.join(',')}}` : '{}';
  }

  function clearSvg(svgEl){
    while(svgEl.firstChild) {
      svgEl.removeChild(svgEl.firstChild);
    }
  }

  function resetOutput(){
    dfa = null;
    steps = [];
    stepIndex = 0;
    els.stepBtn.disabled = true;
    els.runAllBtn.disabled = true;
    els.stepsList.innerHTML = '';
    els.nfaTableContainer.innerHTML = '';
    els.dfaTableContainer.innerHTML = '';
    clearSvg(els.nfaSvg);
    clearSvg(els.dfaSvg);
  }

  function validateNFA(obj){
    if (!obj.states.length) {
      throw new Error('Add at least one state.');
    }
    if (!obj.alphabet.length) {
      throw new Error('Add at least one input symbol in Alphabet.');
    }
    if (!obj.start) {
      throw new Error('Start state is required.');
    }
    if (!obj.states.includes(obj.start)) {
      throw new Error(`Start state '${obj.start}' is not listed in States.`);
    }
    for (const state of obj.accepting) {
      if (state && !obj.states.includes(state)) {
        throw new Error(`Accepting state '${state}' is not listed in States.`);
      }
    }
    for (const transition of obj.transitions) {
      if (!obj.states.includes(transition.from)) {
        throw new Error(`Transition source '${transition.from}' is not listed in States.`);
      }
      if (!(transition.symbol === 'eps' || transition.symbol === 'ε' || obj.alphabet.includes(transition.symbol))) {
        throw new Error(`Transition symbol '${transition.symbol}' is not listed in Alphabet.`);
      }
      for (const target of transition.to) {
        if (!obj.states.includes(target)) {
          throw new Error(`Transition target '${target}' is not listed in States.`);
        }
      }
    }
  }

  function parseNFA(text){
    const lines = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const obj = {states:[],alphabet:[],start:null,accepting:[],transitions:[]};
    let inTrans = false;
    for(const line of lines){
      if(/^Transitions?:/i.test(line)){ inTrans = true; continue }
      if(!inTrans){
        const m = line.split(':'); if(m.length<2) continue;
        const key = m[0].trim().toLowerCase();
        const val = m.slice(1).join(':').trim();
        if(key==='states') obj.states = normalizeStateSet(val.split(',').map(s=>s.trim()));
        if(key==='alphabet') obj.alphabet = normalizeStateSet(val.split(',').map(s=>s.trim()).filter(s=>s!=='' && s!=='eps' && s!=='ε'));
        if(key==='start') obj.start = val.trim();
        if(key==='accepting') obj.accepting = normalizeStateSet(val.split(',').map(s=>s.trim()));
      } else {
        // transition line: q,a->q1,q2
        const parts = line.split('->');
        if(parts.length!==2) continue;
        const left = parts[0].trim();
        const right = parts[1].trim();
        const [from,sym] = left.split(',').map(s=>s.trim());
        const to = normalizeStateSet(right.split(',').map(s=>s.trim()));
        obj.transitions.push({from, symbol: sym, to});
      }
    }
    validateNFA(obj);
    return obj;
  }

  function epsilonClosure(states){
    const eps = new Set(normalizeStateSet(states));
    let added = true;
    while(added){
      added = false;
      for(const t of nfa.transitions){
        if((t.symbol==='eps' || t.symbol==='ε') && eps.has(t.from)){
          for(const tt of t.to) if(!eps.has(tt)){ eps.add(tt); added=true }
        }
      }
    }
    return normalizeStateSet(Array.from(eps));
  }

  function move(states, symbol){
    const res = new Set();
    for(const t of nfa.transitions){
      if(t.symbol===symbol && states.includes(t.from)){
        t.to.forEach(s=>res.add(s));
      }
    }
    return normalizeStateSet(Array.from(res));
  }

  function subsetConstruction(){
    const alph = nfa.alphabet;
    const start = epsilonClosure([nfa.start]);
    const dStates = [];
    const dmap = {};
    const dtrans = [];
    const queue = [];
    const isAccept = sArr => sArr.some(s=>nfa.accepting.includes(s));

    dStates.push(start);
    dmap[subsetLabel(start)] = 0;
    queue.push(start);
    steps = [];

    while(queue.length){
      const S = queue.shift();
      const Slabel = subsetLabel(S);
      steps.push({type:'process', subset:S.slice(), info:`Processing ${Slabel}`});
      for(const a of alph){
        const M = move(S,a);
        const C = epsilonClosure(M);
        const Clabel = subsetLabel(C);
        steps.push({type:'move', subset:S.slice(), symbol:a, result:C.slice(), info:`From ${Slabel} on '${a}' -> ${Clabel}`});
        if(dmap[Clabel]===undefined){
          dmap[Clabel]=dStates.length;
          dStates.push(C);
          queue.push(C);
          steps.push({type:'new', subset:C.slice(), info:`New DFA state ${Clabel}`});
        }
        dtrans.push({from:Slabel,symbol:a,to:Clabel});
      }
    }

    // build dfa representation
    const nodes = dStates.map(s=>({id:subsetLabel(s), states:s, accept:isAccept(s)}));
    const edges = dtrans.map(t=>({from:t.from,to:t.to,label:t.symbol}));
    dfa = {nodes, edges, alphabet: alph.slice(), start: subsetLabel(start)};
    stepIndex = 0;
  }

  // Simple circular layout and SVG drawing
  function drawGraph(svgEl, nodes, edges, startId, opts = {}){
    clearSvg(svgEl);
    const n = nodes.length || 1;

    // Keep NFA/DFA box size fixed (from HTML/CSS), do not resize dynamically.
    const W = svgEl.clientWidth || +svgEl.getAttribute('width') || 560;
    const H = svgEl.clientHeight || +svgEl.getAttribute('height') || 300;
    // Shrink base radius as both node count and max label length grow so the diagram stays compact.
    const maxLabelLen = Math.max(...nodes.map(nd => nd.id.length));
    const baseNodeRadius = Math.max(14, Math.min(22, 22 - Math.max(0, n - 3) * 1.2 - Math.max(0, maxLabelLen - 6) * 0.4));
    const nodeRadii = {};
    for (const nd of nodes) {
      // Fit label text inside circle; cap tightly so loops don't blow up.
      const estTextWidth = 8 + nd.id.length * 5.4;
      nodeRadii[nd.id] = Math.max(baseNodeRadius, Math.min(32, Math.ceil(estTextWidth / 2 + 4)));
    }
    const maxNodeRadius = Math.max(baseNodeRadius, ...Object.values(nodeRadii));
    const cx = W / 2 + (opts.centerXOffset || 0);
    const cy = H / 2 + (opts.centerYOffset || 0);
    // Use available canvas space directly so long labels do not collapse all nodes into the center.
    const radialSpaceX = W / 2 - maxNodeRadius - 30;
    const radialSpaceY = H / 2 - maxNodeRadius - 30;
    const radiusScale = typeof opts.radiusScale === 'number' ? opts.radiusScale : 1;
    const r = Math.max(54, Math.min(radialSpaceX, radialSpaceY) * radiusScale);
    const positions = {};
    const svgNs = 'http://www.w3.org/2000/svg';

    const defs = document.createElementNS(svgNs, 'defs');
    const marker = document.createElementNS(svgNs, 'marker');
    const markerId = `${svgEl.id}-arrowhead`;
    marker.setAttribute('id', markerId);
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '7');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('orient', 'auto-start-reverse');
    const arrowPath = document.createElementNS(svgNs, 'path');
    arrowPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    arrowPath.setAttribute('fill', '#333');
    marker.appendChild(arrowPath);
    defs.appendChild(marker);
    svgEl.appendChild(defs);

    nodes.forEach((nd,i)=>{
      const ang = (i/n) * Math.PI*2 - Math.PI/2;
      const x = cx + r*Math.cos(ang);
      const y = cy + r*Math.sin(ang);
      positions[nd.id]=[x,y];
    });

    // Merge self-loops per node AND parallel edges between same pair into comma-separated labels
    const mergedSelfLoops = {};
    const mergedPairLabels = {}; // key: "from->to"
    for (const edge of edges) {
      if (edge.from === edge.to) {
        if (!mergedSelfLoops[edge.from]) mergedSelfLoops[edge.from] = [];
        mergedSelfLoops[edge.from].push(edge.label);
      } else {
        const key = edge.from + '->' + edge.to;
        if (!mergedPairLabels[key]) mergedPairLabels[key] = [];
        mergedPairLabels[key].push(edge.label);
      }
    }
    // Build deduplicated edge list
    const drawnSelfLoops = new Set();
    const drawnPairs = new Set();
    const mergedEdges = [];
    for (const edge of edges) {
      if (edge.from === edge.to) {
        if (!drawnSelfLoops.has(edge.from)) {
          drawnSelfLoops.add(edge.from);
          mergedEdges.push({ from: edge.from, to: edge.to, label: mergedSelfLoops[edge.from].join(',') });
        }
      } else {
        const key = edge.from + '->' + edge.to;
        if (!drawnPairs.has(key)) {
          drawnPairs.add(key);
          mergedEdges.push({ from: edge.from, to: edge.to, label: mergedPairLabels[key].join(',') });
        }
      }
    }
    // Count parallel pairs (for curve offset) using merged edges
    const edgePairCounts = {};
    const directedPairs = new Set();
    for (const edge of mergedEdges) {
      if (edge.from !== edge.to) {
        const pairKey = [edge.from, edge.to].sort().join('|');
        edgePairCounts[pairKey] = (edgePairCounts[pairKey] || 0) + 1;
        directedPairs.add(edge.from + '->' + edge.to);
      }
    }

    // ── Auto-fit viewBox ──────────────────────────────────────────────────────
    // Compute the bounding box of every drawn element (nodes, self-loops, start
    // arrow) and set viewBox so the SVG always scales to show them all.
    const selfLoopSet = new Set(mergedEdges.filter(e => e.from === e.to).map(e => e.from));
    let bbMinX = Infinity, bbMinY = Infinity, bbMaxX = -Infinity, bbMaxY = -Infinity;
    for (const nd of nodes) {
      const [px, py] = positions[nd.id];
      const nr = nodeRadii[nd.id];
      // Outward unit vector for this node (direction self-loop extends toward)
      const odx = px - cx, ody = py - cy;
      const olen = Math.hypot(odx, ody) || 1;
      const [oux, ouy] = [odx / olen, ody / olen];
      // Self-loop extends ~3.4 radii outward and ~1.5 radii sideways
      const loopOutExt = selfLoopSet.has(nd.id) ? nr * 3.4 : 0;
      const loopSideExt = selfLoopSet.has(nd.id) ? nr * 1.6 : 0;
      bbMinX = Math.min(bbMinX, px - nr - Math.abs(oux) * loopOutExt - loopSideExt);
      bbMaxX = Math.max(bbMaxX, px + nr + Math.abs(oux) * loopOutExt + loopSideExt);
      bbMinY = Math.min(bbMinY, py - nr - Math.abs(ouy) * loopOutExt - loopSideExt);
      bbMaxY = Math.max(bbMaxY, py + nr + Math.abs(ouy) * loopOutExt + loopSideExt);
    }
    // Start arrow stretches ~90px to the left of the start node
    if (startId && positions[startId]) {
      const [sax, say] = positions[startId];
      bbMinX = Math.min(bbMinX, sax - 92);
      bbMinY = Math.min(bbMinY, say);
    }
    const bbPad = 18;
    svgEl.setAttribute('viewBox',
      `${bbMinX - bbPad} ${bbMinY - bbPad} ${(bbMaxX - bbMinX) + bbPad * 2} ${(bbMaxY - bbMinY) + bbPad * 2}`);
    svgEl.setAttribute('preserveAspectRatio', opts.preserveAspectRatio || 'xMidYMid meet');
    // ─────────────────────────────────────────────────────────────────────────

    function shortenPoint(from, to, distance){
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const len = Math.hypot(dx, dy) || 1;
      return [from[0] + (dx / len) * distance, from[1] + (dy / len) * distance];
    }

    function normalVector(from, to) {
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const len = Math.hypot(dx, dy) || 1;
      return [-dy / len, dx / len];
    }

    function outwardUnit(point) {
      const dx = point[0] - cx;
      const dy = point[1] - cy;
      const len = Math.hypot(dx, dy) || 1;
      return [dx / len, dy / len];
    }

    if (startId && positions[startId]) {
      const [sx, sy] = positions[startId];
      const startRadius = nodeRadii[startId] || baseNodeRadius;
      const startArrow = document.createElementNS(svgNs, 'line');
      startArrow.setAttribute('x1', String(Math.max(20, sx - 90)));
      startArrow.setAttribute('y1', String(sy));
      startArrow.setAttribute('x2', String(sx - startRadius - 6));
      startArrow.setAttribute('y2', String(sy));
      startArrow.setAttribute('class', 'start-arrow');
      startArrow.setAttribute('marker-end', `url(#${markerId})`);
      svgEl.appendChild(startArrow);
    }

    // edges
    for(const e of mergedEdges){
      const p1 = positions[e.from] || [cx,cy];
      const p2 = positions[e.to] || [cx,cy];
      const fromRadius = nodeRadii[e.from] || baseNodeRadius;
      const toRadius = nodeRadii[e.to] || baseNodeRadius;
      const path = document.createElementNS(svgNs,'path');
      let qx;
      let qy;
      let d;

      if (e.from === e.to) {
        // Single loop per node with comma-separated label
        const [ox, oy] = outwardUnit(p1);
        const [tx, ty] = [-oy, ox];
        const anchorDistance = fromRadius * 0.95;
        const loopHeight = fromRadius * 2.2;
        const loopWidth = fromRadius * 1.05;
        const startLoop = [
          p1[0] + tx * loopWidth + ox * anchorDistance,
          p1[1] + ty * loopWidth + oy * anchorDistance
        ];
        const endLoop = [
          p1[0] - tx * loopWidth + ox * anchorDistance,
          p1[1] - ty * loopWidth + oy * anchorDistance
        ];
        const c1x = startLoop[0] + ox * loopHeight + tx * 10;
        const c1y = startLoop[1] + oy * loopHeight + ty * 10;
        const c2x = endLoop[0] + ox * loopHeight - tx * 10;
        const c2y = endLoop[1] + oy * loopHeight - ty * 10;
        qx = p1[0] + ox * (loopHeight + fromRadius * 0.8);
        qy = p1[1] + oy * (loopHeight + fromRadius * 0.8) + 16; // shift label lower
        d = `M ${startLoop[0]} ${startLoop[1]} C ${c1x} ${c1y} ${c2x} ${c2y} ${endLoop[0]} ${endLoop[1]}`;
      } else {
        const startPoint = shortenPoint(p1, p2, fromRadius);
        const endPoint = shortenPoint(p2, p1, toRadius);
        const mx = (startPoint[0]+endPoint[0])/2;
        const my = (startPoint[1]+endPoint[1])/2;
        const pairKey = [e.from, e.to].sort().join('|');
        const pairCount = edgePairCounts[pairKey] || 1;
        const [nx, ny] = normalVector(startPoint, endPoint);

        let offsetScale = 0;
        if (pairCount > 1) {
          // If both directions exist (A->B and B->A), force opposite bend signs.
          // This avoids the two arrows collapsing onto the same curve.
          const reverseKey = e.to + '->' + e.from;
          const hasReverse = directedPairs.has(reverseKey);
          if (hasReverse) {
            const lexicalSign = e.from < e.to ? 1 : -1;
            offsetScale = 30 * lexicalSign;
          } else {
            // Parallel same-direction edges (rare after label merge): keep away from center.
            const midToCenterX = cx - mx;
            const midToCenterY = cy - my;
            const dot = nx * midToCenterX + ny * midToCenterY;
            const sign = dot > 0 ? -1 : 1;
            offsetScale = 26 * sign;
          }
        } else {
          // Single edge: slight bow away from center for clarity on dense graphs
          const midToCenterX = cx - mx;
          const midToCenterY = cy - my;
          const dot = nx * midToCenterX + ny * midToCenterY;
          offsetScale = n > 4 ? (dot > 0 ? -10 : 10) : 0;
        }

        // Move text off the stroke so labels don't sit directly on arrows
        const labelLift = pairCount > 1 ? 18 : 14;
        qx = mx + nx * (offsetScale + labelLift);
        qy = my + ny * (offsetScale + labelLift);
        d = `M ${startPoint[0]} ${startPoint[1]} Q ${qx} ${qy} ${endPoint[0]} ${endPoint[1]}`;
      }

      path.setAttribute('d',d);
      path.setAttribute('class','edge');
      path.setAttribute('marker-end', `url(#${markerId})`);
      svgEl.appendChild(path);
      const label = document.createElementNS(svgNs,'text');
      label.setAttribute('x',qx);
      label.setAttribute('y',qy-6);
      label.setAttribute('class','edge-label');
      label.textContent = e.label; svgEl.appendChild(label);
    }
    // nodes
    for(const nd of nodes){
      const [x,y] = positions[nd.id] || [cx,cy];
      const stateRadius = nodeRadii[nd.id] || baseNodeRadius;
      const g = document.createElementNS(svgNs,'g');
      const circle = document.createElementNS(svgNs,'circle');
      circle.setAttribute('cx',x); circle.setAttribute('cy',y); circle.setAttribute('r',stateRadius);
      circle.setAttribute('class','node'+(nd.accept?' accept':'')); g.appendChild(circle);
      if(nd.accept){
        const inner = document.createElementNS(svgNs,'circle');
        inner.setAttribute('cx',x); inner.setAttribute('cy',y); inner.setAttribute('r',Math.max(10, stateRadius - 4)); inner.setAttribute('class','node');
        inner.setAttribute('fill','none'); inner.setAttribute('stroke','#333'); inner.setAttribute('stroke-width','1.2'); g.appendChild(inner);
      }
      const text = document.createElementNS(svgNs,'text');
      text.setAttribute('x',x); text.setAttribute('class','node-label');
      // Scale label font down for larger node counts or long DFA state names
      const labelLen = nd.id.length;
      const fontSize = labelLen > 8 ? Math.max(8, 11 - Math.floor((labelLen - 8) * 0.35)) : (n > 6 ? 10 : 12);
      text.setAttribute('y', y + fontSize * 0.35);
      text.setAttribute('font-size', fontSize + 'px');
      text.textContent = nd.id;
      g.appendChild(text);
      svgEl.appendChild(g);
    }
  }

  function renderTable(){
    // Render DFA table into its dedicated container
    const dfaCont = els.dfaTableContainer; dfaCont.innerHTML='';
    if(dfa){
      const table = document.createElement('table');
      const thead = document.createElement('thead'); const tr = document.createElement('tr');
      tr.appendChild(th('State'));
      for(const a of nfa.alphabet) tr.appendChild(th(a)); thead.appendChild(tr); table.appendChild(thead);
      const tbody = document.createElement('tbody');
      for(const node of dfa.nodes){
        const row = document.createElement('tr'); row.appendChild(td(node.id));
        for(const a of nfa.alphabet){
          const e = dfa.edges.find(x=>x.from===node.id && x.label===a);
          row.appendChild(td(e?e.to:'∅'));
        }
        tbody.appendChild(row);
      }
      table.appendChild(tbody); dfaCont.appendChild(table);
    }

    function th(t){ const e=document.createElement('th'); e.textContent=t; return e }
    function td(t){ const e=document.createElement('td'); e.textContent=t; return e }
  }

  function renderNFATable(){
    const cont = els.nfaTableContainer; cont.innerHTML='';
    if(!nfa) return;
    const hasEpsilon = nfa.transitions.some(t => t.symbol === 'eps' || t.symbol === 'ε');
    const cols = ['State', ...nfa.alphabet, ...(hasEpsilon ? ['eps'] : [])];
    const table = document.createElement('table');
    const thead = document.createElement('thead'); const tr = document.createElement('tr');
    for(const c of cols) tr.appendChild(th(c)); thead.appendChild(tr); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for(const s of nfa.states){
      const row = document.createElement('tr'); row.appendChild(td(s));
      for(const a of nfa.alphabet){
        const targets = normalizeStateSet(nfa.transitions.filter(t=>t.from===s && t.symbol===a).flatMap(t=>t.to));
        row.appendChild(td(targets.length?targets.join(','):'∅'));
      }
      if (hasEpsilon) {
        const epsTargets = normalizeStateSet(nfa.transitions.filter(t=>t.from===s && (t.symbol==='eps' || t.symbol==='ε')).flatMap(t=>t.to));
        row.appendChild(td(epsTargets.length?epsTargets.join(','):'∅'));
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody); cont.appendChild(table);

    function th(t){ const e=document.createElement('th'); e.textContent=t; return e }
    function td(t){ const e=document.createElement('td'); e.textContent=t; return e }
  }

  function renderAll(){
    if (!nfa) {
      resetOutput();
      return;
    }
    // draw NFA
    const nNodes = nfa.states.map(s=>({id:s, accept:nfa.accepting.includes(s)}));
    const nEdges = nfa.transitions.flatMap(t => t.to.map(target => ({from:t.from,to:target,label:t.symbol})));
    // Keep NFA centred vertically in the box.
    // xMidYMin snaps diagram to top of SVG so it aligns with the state table.
    drawGraph(els.nfaSvg, nNodes, nEdges, nfa.start, { centerYOffset: -30, radiusScale: 0.9, preserveAspectRatio: 'xMidYMin meet' });
    if(dfa) {
      // Keep DFA higher/tighter so both top and bottom self-loops stay inside the box.
      drawGraph(els.dfaSvg, dfa.nodes, dfa.edges, dfa.start, { centerYOffset: -8, radiusScale: 0.8 });
    } else {
      clearSvg(els.dfaSvg);
    }
    renderNFATable();
    renderTable();
  }

  function pushStepHtml(step, idx){
    const li = document.createElement('li'); li.textContent = step.info; li.id = 'step-'+idx; return li;
  }

  function showStep(i){
    els.stepsList.innerHTML='';
    for(let k=0;k<=i && k<steps.length;k++) els.stepsList.appendChild(pushStepHtml(steps[k],k));
    renderAll();
  }

  function showAllSteps(){
    els.stepsList.innerHTML='';
    steps.forEach((step, idx) => {
      els.stepsList.appendChild(pushStepHtml(step, idx));
    });
  }

  // UI handlers
  els.parseBtn.addEventListener('click',()=>{
    try{
      nfa = parseNFA(els.nfaInput.value);
      subsetConstruction();
      els.stepBtn.disabled = false;
      els.runAllBtn.disabled = false;
      els.stepsList.innerHTML = '';
      renderAll();
    }catch(e){ alert('Parse error: '+e.message) }
  });

  els.stepBtn.addEventListener('click',()=>{
    if(stepIndex < steps.length){ stepIndex++; showStep(stepIndex-1); }
  });
  els.runAllBtn.addEventListener('click',()=>{
    stepIndex = steps.length;
    showAllSteps();
    renderAll();
  });
  els.resetBtn.addEventListener('click',()=>{
    els.nfaInput.value = sample;
    nfa = parseNFA(sample);
    resetOutput();
    renderAll();
  });

  // init sample
  els.nfaInput.value = sample;
  nfa = parseNFA(sample);
  renderAll();
})();
