declare global {
  interface Window {
    MIDIInput: {
    };

    WebMidi: {
      inputs: MIDIInput[];
      enable: () => Promise<void>;
    }
  }
}

export {};