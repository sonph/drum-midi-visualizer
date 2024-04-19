const appConfig = {
  defaultTempo: 90,
  style: {
    background: "#333",
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
      paddingTop: 40,
    },
    note: {
      height: 20,
      width: 100, // millis
      spacing: 10, // vertical spacing
      defaultColor: "#ddd",
    },
  },
  noteMapping: {
    splash: {
      notes: ["F1"],
      position: 1,
      color: "#7EB234",
    },
    crash: {
      notes: ["F5"],
      position: 1,
      color: "#7EB234",
    },
    ride: {
      notes: [],
      position: 1,
      color: "#7EB234",
    },
    hats: {
      notes: ["C3", "C#3", "D3", "D#3", "E3", "F#3", "G3"],
      position: 2,
      color: "#F8CC42",
    },
    tom1: {
      notes: ["A4", "B4", "C5"],
      position: 3,
      color: "#42C0F7",
    },
    snare: {
      notes: ["C#2", "D2", "D#2", "E2", "F#2"],
      position: 4,
      color: "#F74242",
    },
    tom2: {
      notes: [],
      position: 5,
      color: "#42C0F7",
    },
    bass: {
      notes: ["C2"],
      position: 6,
      color: "#8823D3",
    },
  }
}