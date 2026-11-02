import {trackMonophonicNotes, trackRecordedNotes} from './live-pitch.mjs';

self.onmessage = event => {
  const {type, requestId, sessionId, payload} = event.data || {};
  if (!Number.isInteger(requestId) || !Number.isInteger(sessionId) || !['transcribe', 'transcribe-recorded'].includes(type)) return;
  try {
    const started = performance.now();
    const result = type === 'transcribe-recorded'
      ? trackRecordedNotes(payload?.pcm, payload?.sampleRate)
      : trackMonophonicNotes(payload?.pcm, payload?.sampleRate,
        {windowStartSeconds: payload?.windowStartSeconds ?? 0});
    self.postMessage({type: 'result', requestId, sessionId, payload: {
      ...result, rawNoteCount: result.rawNoteCount ?? result.notes.length,
      retainedNoteCount: result.notes.length,
      timings: {inferenceMs: Math.round(performance.now() - started)},
    }});
  } catch (error) {
    self.postMessage({type: 'error', requestId, sessionId,
      payload: {message: error.message || String(error)}});
  }
};
