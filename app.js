'use strict';

const pitches = Array.from(document.querySelectorAll('.pitch'));
const controls = document.querySelector('.replay-controls');
const replay = document.querySelector('.replay');
const next = document.getElementById('next-pitch');
let current = 0;

function selectPitch(index, announce = true) {
  if (!Number.isInteger(index) || index < 0 || index >= pitches.length) return;
  current = index;
  const pitch = pitches[index];
  const winning = index === pitches.length - 1;
  pitches.forEach((button, buttonIndex) => {
    const selected = buttonIndex === index;
    button.classList.toggle('selected', selected);
    if (selected) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  document.getElementById('pitch-number').textContent = `Pitch ${index + 1} of ${pitches.length}`;
  document.getElementById('pitch-count').textContent = `Count: ${pitch.dataset.count}`;
  document.getElementById('velocity').textContent = pitch.dataset.speed;
  document.getElementById('pitch-type').textContent = pitch.dataset.type;
  document.getElementById('pitch-description').textContent = pitch.dataset.description;
  document.getElementById('mil-score').textContent = winning ? '4' : '2';
  document.getElementById('stage-state').textContent = winning ? 'Final · Brewers win' : '2 outs · Bases loaded';
  document.getElementById('replay-hint').textContent = winning ? 'Two runs. One hit.' : 'Step through the finish';
  next.firstChild.textContent = winning ? 'Replay the at-bat ' : 'Next pitch ';
  replay.classList.toggle('is-winning', winning);
  if (announce) {
    document.getElementById('replay-announcement').textContent = `Pitch ${index + 1}: ${pitch.dataset.speed} miles per hour. ${pitch.dataset.type}. ${pitch.dataset.description} ${winning ? 'Final score: San Diego 3, Milwaukee 4.' : `Count ${pitch.dataset.count}.`}`;
  }
}

if (pitches.length === 6 && next && controls) {
  pitches.forEach((button, index) => button.addEventListener('click', () => selectPitch(index)));
  next.addEventListener('click', () => selectPitch((current + 1) % pitches.length));
  controls.hidden = false;
}
