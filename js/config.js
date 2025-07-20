const appConfig = {
    defaultTempo: 90,
    style: {
        background: "#333",
        grid: {
            measure: {
                width: 4,
                color: "#939CF2",
            },
            beat: {
                width: 2,
                color: "#ccc",
            },
            subdivision: {
                width: 1,
                color: "#888",
            },
            indicator: {
                width: 2,
                color: "#ede637",
            },
            spacing: 20, // between vertical lines
            paddingTop: 100,
        },
        note: {
            defaultColor: "#ddd",
            minHeight: 5,
            maxHeight: 50, // Higher velocity = more height.
        },
        lane: {
            height: 60,
            bottomPadding: 10,
            oddLaneBackground: "#333",
            evenLaneBackground: "#555",
        },
        // Lane height of 60px with bottom padding of 10px.
        // For a note with attack 0.5 = height 27.5px, draw from 22.5px to 50px
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
            notes: ["C4", "C#4"],
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
            notes: ["F4"],
            position: 6,
            color: "#93d6f2",
        },
        bass: {
            notes: ["C2"],
            position: 7,
            color: "#cf92fc",
        },
    }
};
if (typeof global !== 'undefined') {
    global.appConfig = appConfig;
}
//# sourceMappingURL=config.js.map