// QWERTY layout rows
const rows = [
  ['Esc', 'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','Del'],
  ['`','1','2','3','4','5','6','7','8','9','0','-','=','Backspace'],
  ['Tab','Q','W','E','R','T','Y','U','I','O','P','[',']','\\'],
  ['Caps','A','S','D','F','G','H','J','K','L',';','\'','Enter'],
  ['Shift','Z','X','C','V','B','N','M',',','.','/','↑'],
  ['Ctrl','Win','Alt','Space','Menu','←', '↓', '→',]
];

const keyWidths = {
  'Esc': 2,
  'Del': 2,
  'Backspace': 4,
  'Tab': 3,
  'Caps': 4,
  'Enter': 5,
  'Shift': 5,
  'Ctrl': 3,
  'Alt': 3,
  'Win': 2,
  'Menu': 2,
  '\\': 2,
  'Space': 9,
  '↑': 2,
  '↓': 2,
  '←': 2,
  '→': 2
};

const arrowPositions = {
  '↑': { gridColumnStart: 15, gridColumnSpan: 2, gridRowStart: 5 },
  '←': { gridColumnStart: 14, gridColumnSpan: 2, gridRowStart: 6 },
  '↓': { gridColumnStart: 15, gridColumnSpan: 2, gridRowStart: 6 },
  '→': { gridColumnStart: 16, gridColumnSpan: 2, gridRowStart: 6 }
  };

const keyMap = new Map();

function createKeyboard() {
  const keyboard = document.getElementById('keyboard-visual');
  
  keyboard.innerHTML = '';

  let rowIndex = 1;
  rows.forEach(row => {
    let colIndex = 1;
    row.forEach(key => {
      if (key === '') {
        colIndex++;
        return;
      }
      // Skip arrow keys completely here
      if (['↑', '←', '↓', '→', 'Del'].includes(key)) {
        return;
      }
      const keyDiv = document.createElement('div');
      keyDiv.classList.add('key');
      keyDiv.textContent = key;
      const width = keyWidths[key] || 2;
      keyDiv.style.gridColumnStart = colIndex;
      keyDiv.style.gridColumnEnd = `span ${width}`;
      keyDiv.style.gridRowStart = rowIndex;
      keyboard.appendChild(keyDiv);
      colIndex += width;

      let code = key.toLowerCase();
      if (key === '←') code = 'arrowleft';
      if (key === '→') code = 'arrowright';
      if (key === '↑') code = 'arrowup';
      if (key === '↓') code = 'arrowdown';
      if (key === 'Backspace') code = 'backspace';
      if (key === 'Caps') code = 'capslock';
      if (key === 'Del') code = 'delete';
      if (key === 'Win') code = 'meta';
      if (key === 'Ctrl') code = 'control';
      if (key === 'Alt') code = 'alt';
      if (key === 'Tab') code = 'tab';
      if (key === 'Enter') code = 'enter';
      if (key === 'Shift') code = 'shift';
      if (key === 'Space') code = ' ';
      if (key === 'Menu') code = 'contextmenu';

      keyMap.set(code, keyDiv);
    });
    rowIndex++;
  });

  // Arrow keys container positions:
  const arrowKeys = [
    { key: '↑', colStart: 26, rowStart: 5, colSpan: 2 },
    { key: '←', colStart: 24, rowStart: 6, colSpan: 2 },
    { key: '↓', colStart: 26, rowStart: 6, colSpan: 2 },
    { key: '→', colStart: 28, rowStart: 6, colSpan: 2 },
    { key: "Del", colStart: 30, rowStart: 3, colSpan: 2}
  ];

  arrowKeys.forEach(({ key, colStart, rowStart, colSpan }) => {
    const keyDiv = document.createElement('div');
    keyDiv.classList.add('key');
    keyDiv.textContent = key;
    keyDiv.style.gridColumnStart = colStart;
    keyDiv.style.gridColumnEnd = `span ${colSpan}`;
    keyDiv.style.gridRowStart = rowStart;
    keyboard.appendChild(keyDiv);

    let code = '';
    if (key === '↑') code = 'arrowup';
    if (key === '←') code = 'arrowleft';
    if (key === '↓') code = 'arrowdown';
    if (key === '→') code = 'arrowright';

    keyMap.set(code, keyDiv);
  });
}

createKeyboard();

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (keyMap.has(key)) {
    keyMap.get(key).classList.add('active');
  }
});

document.getElementById('reset-keys').addEventListener('click', () => {
  keyMap.forEach(div => div.classList.remove('active'));
});


// Camera tester
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    document.getElementById('camera-preview').srcObject = stream;
  })
  .catch(err => {
    document.getElementById('camera').innerText = 'Camera access denied or camera is broken';
  });

// Microphone tester
const recordBtn = document.getElementById('record-btn');
const playback = document.getElementById('mic-playback');
const canvas = document.getElementById('mic-waveform');
const ctx = canvas.getContext('2d');

let mediaRecorder;
let audioChunks = [];
let recording = false;

let analyser, dataArray, source, audioContext, drawId;

recordBtn.addEventListener('click', async () => {
  if (!recording) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Setup media recorder
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(blob);
      playback.src = audioUrl;
      playback.style.display = 'block';
      audioChunks = [];
    };

    // Setup waveform visualizer
    canvas.style.display = 'block';
    audioContext = new AudioContext();
    source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    dataArray = new Uint8Array(analyser.fftSize);

    function drawWaveform() {
      drawId = requestAnimationFrame(drawWaveform);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'lime';

      const sliceWidth = canvas.width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }

    drawWaveform();
    mediaRecorder.start();
    recordBtn.textContent = 'Stop Recording';
    recording = true;

  } else {
    mediaRecorder.stop();
    audioContext.close();
    cancelAnimationFrame(drawId);
    recordBtn.textContent = 'Start Recording';
    recording = false;
  }
});

// Speaker tester
document.getElementById('play-sound').addEventListener('click', () => {
  const audio = new Audio('test-audio.mp3');
  audio.play();
});

const darkToggle = document.getElementById('dark-toggle');

darkToggle.addEventListener('change', () => {
	document.body.classList.toggle('dark-mode', darkToggle.checked);
});
