require('../js/config.js');
require('../js/utils.js');

const NOTE_CS2 = { identifier: "C#2", name: "C#", octave: 2 };

describe('NoteQueue', () => {
  beforeEach(() => {
    queue = new NoteQueue();
  });

  test('is empty', () => {
    expect(queue.isEmpty()).toBe(true);
  });

  test('adding notes', () => {
    queue.add(new Note(NOTE_CS2, 1, 2));
    queue.add(new Note(NOTE_CS2, 2, 3));
    expect(queue.isEmpty()).toBe(false);
    expect(queue.notes).toEqual([
      new Note(NOTE_CS2, 1, 2),
      new Note(NOTE_CS2, 2, 3),
    ]);
  });

  test('reset', () => {
    queue.add(new Note(NOTE_CS2, 1, 2));
    queue.reset();
    expect(queue.isEmpty()).toBe(true);
    expect(queue.notes).toEqual([]);
  });

  test('operations on empty queue', () => {
    queue.removeNotesBeforeTime(1, 2);
    queue.notes;
    queue.reset();
    expect(queue.notes).toEqual([]);
    expect(queue.isEmpty()).toBe(true);
  });

  test('remove notes before time', () => {
    queue.add(new Note(NOTE_CS2, 1, 2));
    queue.add(new Note(NOTE_CS2, 3, 4));

    queue.removeNotesBeforeTime(3);
    expect(queue.isEmpty()).toBe(false);
    expect(queue.notes).toEqual([new Note(NOTE_CS2, 3, 4)]);

    queue.removeNotesBeforeTime(4);
    expect(queue.isEmpty()).toBe(true);
    expect(queue.notes).toEqual([]);
  });
});

describe('Note', () => {
  beforeEach(() => {
    queue = new NoteQueue();
  });

  test('bottomY', () => {
  });
});