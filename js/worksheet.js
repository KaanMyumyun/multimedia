/*
 * Printable worksheet: an exercise's questions in order, each with a picture of the array or
 * graph at that moment and room to answer, then an answer key on a page of its own.
 */
(function () {
  'use strict';

  const MAX = 24; // questions per sheet

  // Prompts are written for clicking; these rewrite them for pen and paper.
  BTA.paperPrompt = (html) =>
    html
      .replace(/Select them all, or none, then press Check\./g, 'List them all, or write “none”.')
      .replace(/Select every (.+?), then press Check\./g, 'List every $1.')
      .replace(/ and click it\./g, ' and write it down.')
      .replace(/\bClick\b/g, 'Write down')
      .replace(/\bclick\b/g, 'write down');

  /*
   *   algo, input  – the exercise
   *   kit.esc      – HTML escaping
   *   kit.back     – the link back to the exercise
   */
  BTA.worksheetPage = function (root, algo, input, kit) {
    const run = algo.build(input);
    const all = run.steps;
    const questions = all.filter((s) => s.ask.type !== 'info');
    const shown = [];
    let count = 0;
    for (const st of all) {
      if (count >= MAX) break;
      if (st.ask.type !== 'info') count++;
      shown.push(st);
    }
    const noun = algo.graph ? 'graph' : algo.input && algo.input.text ? 'text' : 'array';

    const answerArea = (st) => {
      const a = st.ask;
      if (a.type === 'choice') {
        return `<ul class="ws-choices">${a.options.map((o) => `<li><span class="ws-box" aria-hidden="true"></span>${kit.esc(o.label)}</li>`).join('')}</ul>`;
      }
      return `<p class="ws-line">Answer: <span class="ws-blank"></span></p>`;
    };

    let n = 0;
    const items = shown
      .map((st) => {
        if (st.ask.type === 'info') return `<li class="ws-note"><p>${st.prompt}</p></li>`;
        n++;
        return `
          <li class="ws-q" data-n="${n}">
            <div class="ws-pic stage" data-step="${all.indexOf(st)}"></div>
            <p class="ws-prompt"><b class="ws-num">${n}.</b> ${BTA.paperPrompt(st.prompt)}</p>
            ${answerArea(st)}
          </li>`;
      })
      .join('');

    // The list numbers the answers, so each line is just "answer. why".
    const key = shown
      .filter((st) => st.ask.type !== 'info')
      .map((st) => `<li><b>${BTA.answerLabel(st)}</b>. ${st.correct.replace(/^(Correct|Right|Yes|Exactly)[.!]?\s*/, '')}</li>`)
      .join('');

    root.innerHTML = `
      <div class="worksheet">
        <div class="ws-tools">
          <a class="btn quiet" href="${kit.back}">← Back to the exercise</a>
          <label class="ws-keytoggle"><input type="checkbox" id="ws-key" checked /> Include the answer key</label>
          <button class="btn primary" id="ws-print" type="button">Print</button>
        </div>

        <header class="ws-head">
          <p class="ws-brand">Be the Algorithm · Worksheet</p>
          <h1>${algo.name}</h1>
          <p class="ws-fill"><span>Name <span class="ws-blank"></span></span><span>Date <span class="ws-blank short"></span></span></p>
          <p class="ws-intro">${algo.blurb} Answer the questions in order: each picture shows the ${noun} at that moment.
            ${questions.length > MAX ? `This sheet has the first ${MAX} of the ${questions.length} questions.` : ''}</p>
        </header>

        <ol class="ws-qs">${items}</ol>

        <section class="ws-key" id="ws-keysec">
          <h2>Answer key: ${algo.name}</h2>
          <ol>${key}</ol>
        </section>
      </div>`;

    // Draw each picture as a still, always in the wide layout.
    root.querySelectorAll('.ws-pic').forEach((pic) => {
      const st = all[Number(pic.dataset.step)];
      if (st.view) BTA.render(pic, st.view, { animate: false, narrow: false });
    });
    root.querySelector('#ws-print').addEventListener('click', () => window.print());
    root.querySelector('#ws-key').addEventListener('change', (e) => {
      root.querySelector('#ws-keysec').hidden = !e.target.checked;
    });
  };
})();
