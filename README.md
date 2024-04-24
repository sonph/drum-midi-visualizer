# Drum Midi Visualizer

A light weight practice tool to visualize live MIDI notes coming from an
electronic drum kit against a grid, with a built-in sync'ed metronome.

This tool allows you to see exactly how your hits align with the grid, and
whether they were early or late relative to the pocket. This provides visual
feedback in addition to audible feedback from the metronome.

## TODO

- [x] Connect to MIDI device and log notes
- [x] Draw canvas and real time moving indicator
- [x] Draw notes on a canvas
- [x] Map notes to drum piece
- [x] Add keyboard shortcuts (Space to start/stop, hjkl to adjust tempo)
- [x] Make canvas subdivisions configurable (quarter, 8th, 8th triplets, 16th)
- [x] Make metronome subdivisions configurable
- [x] Make number of measures and number of beats configurable
- [x] Make canvas resizable
- [x] Vary note height to reflect dynamic
- [ ] Draw notes to reflect variations (open hats, bell, cross-stick)
- [ ] "Mapping" or "learning" mode to register MIDI notes against a particular drum piece
- [ ] Automate metronome (silence, increase/decrease tempo)
- [ ] Sync tempo with external MIDI device

## References

- [MDN Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
- https://github.com/scottwhudson/metronome
