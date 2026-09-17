// High-Fidelity Greek Audio Synthesizer (Studio Quality DSP Voice Engine)
// Supports Deep/Male (Baritone DSP), Light/Female (Crisp), and Warm/Female (Melodic Radio) profiles.

export type VoiceProfile = 'deep_male' | 'light_female' | 'warm_female';

export interface SpeechOptions {
  voiceProfile?: VoiceProfile;
  rate?: number;
  pitch?: number;
}

let activeAudioCtx: AudioContext | null = null;
let fallbackAudioElem: HTMLAudioElement | null = null;
const audioCache = new Map<string, string>();
const decodedBufferCache = new Map<string, AudioBuffer>();

function getAudioContext(): AudioContext {
  if (!activeAudioCtx || activeAudioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    activeAudioCtx = new AudioContextClass();
  }
  return activeAudioCtx;
}

export function createDeepMaleAudioChain(audioCtx: AudioContext, destination: AudioNode): AudioNode {
  // 1. Deep Chest Bass Resonance Filter (140Hz, +7.5dB)
  const bassFilter = audioCtx.createBiquadFilter();
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.value = 140;
  bassFilter.gain.value = 7.5;

  // 2. Vocal Warmth / Body Filter (450Hz, +2.0dB)
  const midFilter = audioCtx.createBiquadFilter();
  midFilter.type = 'peaking';
  midFilter.frequency.value = 450;
  midFilter.Q.value = 1.2;
  midFilter.gain.value = 2.0;

  // 3. High Timbre Darkener (3600Hz, -3.0dB)
  const highFilter = audioCtx.createBiquadFilter();
  highFilter.type = 'highshelf';
  highFilter.frequency.value = 3600;
  highFilter.gain.value = -3.0;

  // 4. Dynamics / Soft Saturation Gain
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 1.15;

  bassFilter.connect(midFilter);
  midFilter.connect(highFilter);
  highFilter.connect(gainNode);
  gainNode.connect(destination);

  return bassFilter;
}

export function createLightFemaleAudioChain(audioCtx: AudioContext, destination: AudioNode): AudioNode {
  // 1. Sub-bass cleanup to remove rumble (140Hz, -4.0dB)
  const lowCut = audioCtx.createBiquadFilter();
  lowCut.type = 'highpass';
  lowCut.frequency.value = 140;

  // 2. Vocal Presence & Crisp Enunciation (3000Hz, +3.5dB)
  const presenceFilter = audioCtx.createBiquadFilter();
  presenceFilter.type = 'peaking';
  presenceFilter.frequency.value = 3000;
  presenceFilter.Q.value = 1.1;
  presenceFilter.gain.value = 3.5;

  // 3. Air & Light Shimmer (8000Hz, +4.0dB)
  const airFilter = audioCtx.createBiquadFilter();
  airFilter.type = 'highshelf';
  airFilter.frequency.value = 8000;
  airFilter.gain.value = 4.0;

  // 4. Gain Node
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 1.12;

  lowCut.connect(presenceFilter);
  presenceFilter.connect(airFilter);
  airFilter.connect(gainNode);
  gainNode.connect(destination);

  return lowCut;
}

export function createWarmFemaleAudioChain(audioCtx: AudioContext, destination: AudioNode): AudioNode {
  // 1. Warm Vocal Lower-Mids (240Hz, +3.0dB) - velvety acoustic feel
  const lowMid = audioCtx.createBiquadFilter();
  lowMid.type = 'peaking';
  lowMid.frequency.value = 240;
  lowMid.Q.value = 1.0;
  lowMid.gain.value = 3.0;

  // 2. Sweet vocal sweet-spot (1800Hz, +2.0dB)
  const sweetMid = audioCtx.createBiquadFilter();
  sweetMid.type = 'peaking';
  sweetMid.frequency.value = 1800;
  sweetMid.Q.value = 1.3;
  sweetMid.gain.value = 2.0;

  // 3. Smooth high-end roll-off (6000Hz, +1.5dB)
  const smoothHigh = audioCtx.createBiquadFilter();
  smoothHigh.type = 'highshelf';
  smoothHigh.frequency.value = 6000;
  smoothHigh.gain.value = 1.5;

  // 4. Gain Node
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 1.15;

  lowMid.connect(sweetMid);
  sweetMid.connect(smoothHigh);
  smoothHigh.connect(gainNode);
  gainNode.connect(destination);

  return lowMid;
}

export function getAudioChainForProfile(
  profile: VoiceProfile,
  audioCtx: AudioContext,
  destination: AudioNode
): AudioNode {
  if (profile === 'light_female') {
    return createLightFemaleAudioChain(audioCtx, destination);
  }
  if (profile === 'warm_female') {
    return createWarmFemaleAudioChain(audioCtx, destination);
  }
  return createDeepMaleAudioChain(audioCtx, destination);
}

// Two TTS backends, tried in order:
// 1. public/tts-edge.php — Microsoft Edge's free neural "Read Aloud" voices (real WebSocket
//    protocol, hand-implemented in PHP), noticeably more natural than #2. Unofficial/
//    reverse-engineered, so it can break if Microsoft changes something server-side.
// 2. public/tts-greek.php — Google Translate's TTS endpoint. Lower quality but has been
//    stable for years; kept purely as an automatic fallback if #1 ever fails.
// (/api/tts/greek, a Node/Express route in server.ts, is NOT used — it only runs in local
// dev; production is static PHP hosting with no live Node server, so that route 404s there.)
export async function fetchGreekAudioUrl(rawText: string, timeoutMs = 4000): Promise<string | null> {
  if (!rawText || !rawText.trim()) return null;
  const trimmed = rawText.trim();

  if (audioCache.has(trimmed)) {
    return audioCache.get(trimmed)!;
  }

  const url = await resolveGreekTtsUrl(trimmed, timeoutMs);
  if (url) {
    audioCache.set(trimmed, url);
  }
  return url;
}

// Edge TTS sounds noticeably better but its WebSocket round trip is unpredictable from this
// host (measured 2-12+ seconds, 2026-09-04) — too slow for a button someone expects to react
// instantly. Race it against a short timeout so a slow response falls back to the fast,
// lower-quality Google engine instead of leaving the user staring at a spinner.
async function resolveGreekTtsUrl(trimmed: string, timeoutMs = 4000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const edgeRes = await fetch(`/tts-edge.php?text=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
    clearTimeout(timer);
    if (edgeRes.ok && (edgeRes.headers.get('content-type') || '').startsWith('audio')) {
      const blob = await edgeRes.blob();
      if (blob.size > 0) {
        return URL.createObjectURL(blob);
      }
    }
  } catch (e) {
    console.warn('Edge TTS unavailable/too slow, falling back to Google TTS:', e);
  }

  return `/tts-greek.php?text=${encodeURIComponent(trimmed)}`;
}

export async function fetchAndDecodeGreekAudio(
  rawText: string,
  audioCtx: AudioContext
): Promise<AudioBuffer | null> {
  const audioUrl = await fetchGreekAudioUrl(rawText);
  if (!audioUrl) return null;

  const cacheKey = rawText.trim();
  if (decodedBufferCache.has(cacheKey)) {
    return decodedBufferCache.get(cacheKey)!;
  }

  try {
    const resp = await fetch(audioUrl);
    const arrayBuf = await resp.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(arrayBuf);
    decodedBufferCache.set(cacheKey, decoded);
    return decoded;
  } catch (err) {
    console.warn('Failed to decode Greek audio buffer:', err);
    return null;
  }
}

/**
 * Bumped by every stop. A chunk whose fetch or playback finishes after the reader pressed
 * stop checks this and does nothing, instead of starting the next chunk over the silence.
 */
let speechSession = 0;

export function stopWebSpeech(): void {
  speechSession++;
  if (fallbackAudioElem) {
    try {
      fallbackAudioElem.pause();
      fallbackAudioElem.currentTime = 0;
    } catch {
      // ignore
    }
    fallbackAudioElem = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

function speakWithNativeVoice(
  rawText: string,
  onEnd: (() => void) | undefined,
  rate: number,
  pitch: number,
  voiceProfile: VoiceProfile
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return false;
  }

  const utterance = new SpeechSynthesisUtterance(rawText);
  utterance.lang = 'el-GR';

  if (voiceProfile === 'deep_male') {
    utterance.rate = 0.92 * rate;
    utterance.pitch = 0.80 * pitch;
  } else if (voiceProfile === 'light_female') {
    utterance.rate = 1.04 * rate;
    utterance.pitch = 1.20 * pitch;
  } else {
    utterance.rate = 0.98 * rate;
    utterance.pitch = 1.08 * pitch;
  }

  const voices = window.speechSynthesis.getVoices();
  const greekVoice = voices.find((v) => {
    const l = (v.lang || '').toLowerCase();
    const n = (v.name || '').toLowerCase();
    if (!l.startsWith('el')) return false;
    if (voiceProfile === 'deep_male') {
      return n.includes('male') || n.includes('man') || n.includes('nikos') || n.includes('george') || n.includes('stefanos');
    } else {
      return n.includes('female') || n.includes('woman') || n.includes('eleni') || n.includes('athina') || n.includes('maria') || n.includes('eva');
    }
  }) || voices.find((v) => (v.lang || '').toLowerCase().startsWith('el'));

  // No Greek voice on this device means the utterance would be read by whatever default
  // voice exists — an English one spelling its way through Greek. Better to make no sound
  // and let the caller use the server voice.
  if (!greekVoice) {
    if (onEnd) onEnd();
    return false;
  }
  utterance.voice = greekVoice;
  utterance.onend = () => onEnd && onEnd();
  utterance.onerror = () => onEnd && onEnd();
  window.speechSynthesis.speak(utterance);
  return true;
}

// Speaks Greek text using selectable Voice Profiles (Deep/Male, Light/Female, Warm/Female) and Speed.
// Speed is applied via HTMLMediaElement.playbackRate + preservesPitch=true (a real browser feature,
// time-stretches rather than resamples) instead of AudioBufferSourceNode.playbackRate — the latter
// is a naive resample, so speeding it up also raises the pitch ("chipmunk" effect / thinner voice).
// preservesPitch keeps the same voice and tone at higher speed (2026-09-04 fix).
/**
 * Split for narration.
 *
 * The whole article goes to the TTS endpoint as one request otherwise: Edge renders the
 * entire thing before answering — minutes for 7,000 characters, well past the 4s race that
 * falls back to Google — and Google's engine is capped at 180 characters per call, so the
 * server would make forty sequential requests before the first sound. Sentence-sized blocks
 * start almost immediately and the next one is fetched while the current plays.
 */
/**
 * How long to wait for the better voice.
 *
 * tts-edge.php answers in 6-7 seconds from this host and sounds like a person;
 * tts-greek.php answers in under one and does not. Waiting applies to every block,
 * including the first: a voice that changes partway through an article is worse than a
 * few seconds before it starts.
 */
/**
 * The device's own Greek voice, if it has one.
 *
 * A real Greek system voice sounds considerably better than the fallback engine, so it is
 * preferred when present — but getVoices() is populated asynchronously, and asking too
 * early returns an empty list and wrongly concludes there is none.
 */
let greekVoiceKnown: boolean | null = null;

async function deviceHasGreekVoice(): Promise<boolean> {
  if (greekVoiceKnown !== null) return greekVoiceKnown;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    greekVoiceKnown = false;
    return false;
  }
  const look = () => window.speechSynthesis.getVoices().some((v) => (v.lang || '').toLowerCase().startsWith('el'));
  if (look()) { greekVoiceKnown = true; return true; }
  await new Promise<void>((resolve) => {
    const done = () => resolve();
    window.speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1200);
  });
  greekVoiceKnown = look();
  return greekVoiceKnown;
}

const EDGE_TIMEOUT_MS = 12000;

function chunkForSpeech(text: string, max = 600): string[] {
  const sentences = text.split(/(?<=[.!;?])\s+/u);
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    const candidate = current ? current + ' ' + sentence : sentence;
    if (candidate.length > max && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  // A single sentence longer than the limit still has to go somewhere.
  return chunks.flatMap((c) => (c.length <= max * 2 ? [c] : c.match(new RegExp(`.{1,${max}}(\s|$)`, 'g')) || [c]));
}

export function speakGreekTextWithWebSpeech(
  rawText: string,
  onEnd?: () => void,
  rate = 1.0,
  pitch = 1.0,
  voiceProfile: VoiceProfile = 'deep_male'
): boolean {
  if (typeof window === 'undefined') return false;

  stopWebSpeech();
  const session = speechSession;

  if (!rawText || !rawText.trim()) {
    if (onEnd) onEnd();
    return false;
  }

  const audioCtx = getAudioContext();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  // Calculate DSP playbackRate multiplier
  let baseRate = 1.0;
  if (voiceProfile === 'deep_male') baseRate = 0.89;
  else if (voiceProfile === 'light_female') baseRate = 1.06;
  else if (voiceProfile === 'warm_female') baseRate = 0.98;

  const effectiveRate = baseRate * rate;
  const chunks = chunkForSpeech(rawText.trim());
  let index = 0;
  // If the very first block never makes a sound — no network, endpoints down — the whole
  // text is handed to the browser's own voice instead. Decided before anything plays, so it
  // cannot become the mid-article voice change it used to be.
  let playedAnything = false;

  const finish = () => {
    if (session !== speechSession) return;
    if (onEnd) onEnd();
  };

  /**
   * Play one block, then advance exactly once.
   *
   * Three things used to be able to call `next` for the same block — onended, onerror and a
   * rejected play() — and the last two also started the browser's built-in Greek voice on
   * text that was already playing. That is what made the narration change voice partway
   * through and then re-read the paragraph from somewhere in the middle. A block that fails
   * is now skipped in silence rather than read a second time by something else.
   */
  const playChunk = (text: string, next: () => void) => {
    if (session !== speechSession) return;

    let advanced = false;
    const advance = () => {
      if (advanced || session !== speechSession) return;
      advanced = true;
      next();
    };

    fetchGreekAudioUrl(text, EDGE_TIMEOUT_MS)
      .then((audioUrl) => {
        if (session !== speechSession) return;
        if (!audioUrl) {
          advance();
          return;
        }
        try {
          const audio = new Audio(audioUrl);
          audio.crossOrigin = 'anonymous';
          audio.playbackRate = effectiveRate;
          // Cross-browser preservesPitch flags (Chrome/Edge, Firefox, Safari respectively).
          (audio as any).preservesPitch = true;
          (audio as any).mozPreservesPitch = true;
          (audio as any).webkitPreservesPitch = true;

          // Route through the same character EQ filter chain as before, just fed by a
          // pitch-preserving <audio> element instead of a raw resampled AudioBufferSourceNode.
          const source = audioCtx.createMediaElementSource(audio);
          const chainInput = getAudioChainForProfile(voiceProfile, audioCtx, audioCtx.destination);
          source.connect(chainInput);

          fallbackAudioElem = audio;
          audio.onplaying = () => { playedAnything = true; };
          audio.onended = () => { fallbackAudioElem = null; advance(); };
          audio.onerror = () => { fallbackAudioElem = null; advance(); };
          audio.play().catch(() => { fallbackAudioElem = null; advance(); });
        } catch {
          advance();
        }
      })
      .catch(() => advance());
  };

  /** The device's own Greek voice, reading the same blocks in the same order. */
  const playNative = () => {
    if (session !== speechSession) return;
    if (index >= chunks.length) { finish(); return; }
    const text = chunks[index++];
    const ok = speakWithNativeVoice(text, playNative, rate, pitch, voiceProfile);
    if (!ok) useServerVoice();
  };

  const useServerVoice = () => {
    index = 0;
    playNext();
  };

  const playNext = () => {
    if (session !== speechSession) return;
    if (index === 1 && !playedAnything) {
      // The first block made no sound at all — no network, or the endpoints are down.
      finish();
      return;
    }
    if (index >= chunks.length) {
      finish();
      return;
    }
    const text = chunks[index++];
    // Fetch the following block while this one plays, so the gap between them is silence
    // the reader does not hear — and so Edge has time to answer for it too.
    if (index < chunks.length) fetchGreekAudioUrl(chunks[index], EDGE_TIMEOUT_MS).catch(() => {});
    playChunk(text, playNext);
  };

  // Decided once, before a word is spoken, so the voice never changes partway through an
  // article. A real Greek system voice sounds better than the fallback engine; a device
  // without one gets the server's, which at least speaks Greek.
  deviceHasGreekVoice().then((hasGreek) => {
    if (session !== speechSession) return;
    if (hasGreek) playNative();
    else playNext();
  });

  return true;
}
