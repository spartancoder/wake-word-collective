const BASE_URL =
  location.hostname === "localhost"
    ? "https://services.dev.nearlyrandombytes.dev/assist/wake_word/training_data/upload"
    : "https://services.wwc.nearlyrandombytes.dev/assist/wake_word/training_data/upload";

// const BASE_URL = "http://127.0.0.1:20080/assist/wake_word/training_data/upload";
// const BASE_URL =
//   "https://services.dev.nearlyrandombytes.dev/assist/wake_word/training_data/upload";
export class Recorder {
  public expectWakeWord = false;
  public stopped = false;
  private _listeners: Record<string, () => void> = {};

  constructor(
    public wakeWord: string,
    public description: string,
    public stream: MediaStream,
    public recorder: MediaRecorder,
    public vad: any,
  ) {
    recorder.addEventListener("dataavailable", this.dataAvailable);
  }

  addEventListener(event: "data" | "stop", cb: () => void) {
    this._listeners[event] = cb;
  }

  dataAvailable = (e: { data: Blob }) => {
    if (!e.data || this.stopped) {
      return;
    }

    let mime = this.recorder.mimeType;

    if (
      !["audio/webm", "audio/ogg", "audio/mp4"].includes(mime.split(";")[0])
    ) {
      alert(`Microphone mimetype not supported: ${mime}`);
      this.stop();
      return;
    }

    if (this._listeners.data) {
      this._listeners.data();
    }

    // Parse demographics from description JSON
    let demographics: any = {};
    try {
      demographics = JSON.parse(this.description);
    } catch (error) {
      // If parsing fails, use description as-is (backward compatibility)
      demographics = { user_content: this.description };
    }

    const params = new URLSearchParams({
      wake_word: this.wakeWord,
      language: demographics.language || "",
      accent: demographics.accent || "",
      age: demographics.age || "",
      gender: demographics.gender || "",
    }).toString();

    fetch(`${BASE_URL}?${params}`, {
      method: "PUT",
      body: e.data,
      headers: {
        "Content-Type": mime,
      },
    });
  };

  start() {
    this.recorder.start();
    this.vad.start();
  }

  stop() {
    this.expectWakeWord = false;
    this.stopped = true;
    this.recorder.stop();

    // Destroy vad
    this.vad.pause();
    this.vad.stream.getTracks().forEach((track: any) => track.stop());
    this.vad.sourceNode.disconnect();
    delete this.vad.audioNodeVAD;
    this.vad.audioContext.close();
    delete this.vad;

    if (this._listeners.stop) {
      this._listeners.stop();
    }
  }
}

export const createRecorder = async (
  wakeWord: string,
  description: string,
): Promise<Recorder | undefined> => {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: false,
        autoGainControl: true,
        noiseSuppression: false,
      },
    });
  } catch (e) {
    console.error("Microphone declined", e);
    return undefined;
  }
  const mediaRecorder = new MediaRecorder(stream);

  // @ts-ignore-next-line
  const myvad = await vad.MicVAD.new({
    stream,
    // onSpeechStart: () => {
    //     console.log("Speech start detected")
    // },
    onSpeechEnd: (audio: any) => {
      if (!recorder.expectWakeWord || recorder.stopped) {
        return;
      }
      mediaRecorder.stop();
      mediaRecorder.start();
    },
  });

  const recorder = new Recorder(
    wakeWord,
    description,
    stream,
    mediaRecorder,
    myvad,
  );

  return recorder;
};
