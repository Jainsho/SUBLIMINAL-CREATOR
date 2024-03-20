const createSubliminalButton = document.getElementById('create-subliminal-button');
const progressBarContainer = document.getElementById('progress-bar-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

createSubliminalButton.addEventListener('click', () => {
  if (!audioBuffer || !carrierFrequency) {
    alert('Please select an affirmation audio file and set the carrier frequency.');
    return;
  }

  progressBarContainer.style.display = 'block';

  const worker = new Worker('audioWorker.js');
  worker.postMessage({
    cmd: 'init',
    audioBuffer: audioBuffer,
    carrierFrequency: carrierFrequency
  });

  worker.onmessage = function(e) {
    const subliminalBlob = new Blob([e.data.samples], { type: 'audio/wav' });
    const url = URL.createObjectURL(subliminalBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'subliminal.wav';
    link.click();

    progressBarContainer.style.display = 'none';
  };
});

function createSubliminalAudioBuffer(audioBuffer, affirmations) {
  const sampleRate = audioBuffer.sampleRate;
  const channelCount = audioBuffer.numberOfChannels;
  const totalSamples = Math.ceil(audioBuffer.duration * sampleRate);
  const subliminalSamples = new Float32Array(totalSamples * channelCount);

  for (let i = 0; i < totalSamples; i++) {
    const sample = Math.sin(2 * Math.PI * carrierFrequency * i / sampleRate);
    for (let j = 0; j < channelCount; j++) {
      subliminalSamples[i * channelCount + j] = audioBuffer.getChannelData(j)[i] + sample;
    }
  }

  for (let i = 0; i < affirmations.length; i++) {
    const affirmation = affirmations[i];
    const affirmationBuffer = new AudioContext().createBuffer(channelCount, affirmation.length, sampleRate);
    const affirmationData = affirmationBuffer.getChannelData(0);

    for (let j = 0; j < affirmationData.length; j++) {
      affirmationData[j] = Math.sin(2 * Math.PI * carrierFrequency * j / sampleRate);
    }

    const affirmationStart = Math.floor(Math.random() * (totalSamples - affirmationData.length));

    for (let j = 0; j < affirmationData.length; j++) {
      subliminalSamples[affirmationStart + j] += affirmationData[j];
    }
  }

  const subliminalBuffer = audioContext.createBuffer(channelCount, totalSamples, sampleRate);
  for (let i = 0; i < channelCount; i++) {
    subliminalBuffer.copyToChannel(subliminalSamples.subarray(i), i);
  }

  return subliminalBuffer;
}