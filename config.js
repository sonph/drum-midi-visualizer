const appConfig = {
  defaultTempo: 90,
  style: {
    background: "#333",
    oddLaneBackground: "#333",
    evenLaneBackground: "#555",
    grid: {
      beat: {
        width: 1,
        color: "#ccc",
      },
      measure: {
        width: 2,
        color: "#eee",
      },
      indicator: {
        width: 2,
        color: "#ede637",
      },
      spacing: 20, // between vertical lines
      paddingTop: 100,
    },
    note: {
      height: 20,
      spacing: 40, // vertical spacing
      defaultColor: "#ddd",
    },
  },
  noteMapping: {
    // Lane/position 1 for unknown notes.
    splash: {
      notes: ["F1"],
      position: 2,
      color: "#7EB234",
    },
    crash: {
      notes: ["F5"],
      position: 2,
      color: "#7EB234",
    },
    ride: {
      notes: [],
      position: 3,
      color: "#7EB234",
    },
    hats: {
      notes: ["C3", "C#3", "D3", "D#3", "E3", "F#3", "G3"],
      position: 3,
      color: "#F8CC42",
    },
    tom1: {
      notes: ["A4", "B4", "C5"],
      position: 4,
      color: "#93d6f2",
    },
    snare: {
      notes: ["C#2", "D2", "D#2", "E2", "F#2"],
      position: 5,
      color: "#f66b6b",
    },
    tom2: {
      notes: [],
      position: 6,
      color: "#93d6f2",
    },
    bass: {
      notes: ["C2"],
      position: 7,
      color: "#cf92fc",
    },
  }
}