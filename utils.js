// TODO: implement a linked list queue.
// For now, since the number of notes is small, a list should be sufficient.
// Notes are sorted in timestamp order. New notes should be appended at the end.
class NoteQueue {
  constructor() {
    this.notesArr = [];
    this.firstAvailableNoteIndex = -1;
  }

  add(note, startTime) {
    if (this.notesArr.length === 0) {
      this.firstAvailableNoteIndex = 0;
    }
    this.notesArr.push({
      note: note,
      startTime: startTime,
      endTime: startTime + appConfig.style.note.width, // millis
      visible: true
    });
  }

  reset() {
    this.notesArr = [];
    this.firstAvailableNoteIndex = -1;
  }

  isEmpty() {
    return this.notesArr.length === 0 || this.firstAvailableNoteIndex === -1
      || this.firstAvailableNoteIndex >= this.notesArr.length;
  }

  get notes() {
    // Returning an iterator while the list is copied/truncated may cause a
    // problem. Thus we return a new sublist.
    if (this.isEmpty()) {
      return [];
    }
    return this.notesArr.slice(this.firstAvailableNoteIndex);
  }

  removeNotesBeforeTime(currentTime, canvasTotalTime) {
    // Internally, hide notes first. Once they've accumulated above a certain
    // threshold, copy the new notes to a new list.
    if (this.isEmpty()) {
      return;
    }

    const horizon = currentTime - canvasTotalTime;
    for (let i = this.firstAvailableNoteIndex; i < this.notesArr.length; i++) {
      const note = this.notesArr[i];
      if (note.visible && note.endTime <= horizon) {
        note.visible = false;
        this.firstAvailableNoteIndex += 1;
        if (this.firstAvailableNoteIndex >= this.notesArr.length) {
          this.firstAvailableNoteIndex = -1;
        }
      } else {
        break;
      }
    }
    // All notes are hidden.
    if (this.firstAvailableNoteIndex === -1) {
      this.notesArr = [];
    }
    // Copy new visible notes.
    if (this.firstAvailableNoteIndex >= 100) {
      this.notesArr = this.notesArr.slice(this.firstAvailableNoteIndex);
      this.firstAvailableNoteIndex = 0;
    }
  }
}

const noteNameToPiece = {}
for (const pieceName in appConfig.noteMapping) {
  // console.log(`Found ${appConfig.noteMapping[pieceName].notes}`);
  appConfig.noteMapping[pieceName].notes.forEach(note => {
    // console.log(`Associate ${note} with ${pieceName}: ${appConfig.noteMapping[pieceName]}`);
    noteNameToPiece[note] = appConfig.noteMapping[pieceName];
  });
}

class Note {
  constructor(note) {
    // Event.Note
    this.note = note;
    if (note.accidental === undefined) {
      this.noteNameWithOctave = note.name + note.octave;
    } else {
      this.noteNameWithOctave = note.name + "#" + note.octave;
    }
    this.piece = noteNameToPiece[this.noteNameWithOctave];
  }

  get y() {
    if (this.piece === undefined) {
      return appConfig.style.grid.paddingTop;
    }
    const position = this.piece.position;
    const spacing = appConfig.style.note.spacing;
    const noteHeight = appConfig.style.note.height;
    return appConfig.style.grid.paddingTop + (position - 1) * (noteHeight + spacing);
  }

  get color() {
    if (this.piece === undefined) {
      return appConfig.style.note.defaultColor;
    }
    return this.piece.color;
  }
}

function checkState(bool, message) {
  if (!bool) {
    console.log(message);
  }
}

function checkNumber(x) {
  if (isNaN(x)) {
    console.log(`${typeof x} ${x} is not a number`);
  }
}
