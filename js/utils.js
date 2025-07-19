function checkState(bool, message) {
    if (!bool) {
        throw new Error(message);
    }
}
// TODO: implement a linked list queue.
// For now, since the number of notes is small, a list should be sufficient.
// Notes are sorted in timestamp order. New notes should be appended at the end.
class NoteQueue {
    constructor() {
        this.notesArr = [];
        this.firstAvailableNoteIndex = -1;
    }
    add(note) {
        if (this.notesArr.length === 0) {
            this.firstAvailableNoteIndex = 0;
        }
        this.notesArr.push(note);
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
            }
            else {
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
const noteNameToPiece = {};
for (const pieceName in appConfig.noteMapping) {
    // console.log(`Found ${appConfig.noteMapping[pieceName].notes}`);
    appConfig.noteMapping[pieceName].notes.forEach(note => {
        // console.log(`Associate ${note} with ${pieceName}: ${appConfig.noteMapping[pieceName]}`);
        noteNameToPiece[note] = appConfig.noteMapping[pieceName];
    });
}
class Note {
    constructor(midiNote, startTime, endTime, visible = true) {
        // Event.Note
        // note.identifier consists of note name + optional accidental (#) + octave.
        this.midiNote = midiNote;
        this.piece = noteNameToPiece[midiNote.identifier];
        this.startTime = startTime;
        this.endTime = endTime;
        this.visible = visible;
    }
    get bottomY() {
        const canvasPaddingTop = appConfig.style.grid.paddingTop;
        const laneHeight = appConfig.style.lane.height;
        const laneBottomPadding = appConfig.style.lane.bottomPadding;
        if (this.piece === undefined) {
            return canvasPaddingTop + laneHeight - laneBottomPadding;
        }
        const position = this.piece.position;
        return appConfig.style.grid.paddingTop + position * laneHeight - laneBottomPadding;
    }
    get color() {
        if (this.piece === undefined) {
            return appConfig.style.note.defaultColor;
        }
        return this.piece.color;
    }
}
// https://webmidijs.org/api/classes/Note
class WebMidiNote {
}
class VolumeCanvas {
    constructor(id) {
        this.id = id;
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext("2d");
        this.onVolumeChangeCallback;
        const yOffset = this.canvas.height * 0.1;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2 + yOffset;
        this.min = Math.PI * -1.2;
        this.max = Math.PI * 0.2;
        const defaultVolume = 0.75; // 0.0 to 1.0
        this.currentRads = this.min + defaultVolume * (this.max - this.min);
        this.mouseDown = false;
        this.startX;
        this.startY;
        this.animationRef;
        document.addEventListener("mousedown", (event) => {
            if (event.target.id != this.id) {
                return;
            }
            // console.log("mouse down");
            this.startX = event.clientX;
            this.startY = event.clientY;
            this.mouseDown = true;
        });
        document.addEventListener("mouseup", (event) => {
            if (!this.mouseDown) {
                return;
            }
            // console.log("mouse up");
            this.mouseDown = false;
            this.handlePointerPosition(event.clientX, event.clientY);
            if (this.animationRef !== undefined) {
                window.cancelAnimationFrame(this.animationRef);
            }
        });
        document.addEventListener("mousemove", (event) => {
            if (!this.mouseDown) {
                if (this.animationRef !== undefined) {
                    window.cancelAnimationFrame(this.animationRef);
                }
                return;
            }
            if (this.mouseDown) {
                this.handlePointerPosition(event.clientX, event.clientY);
            }
        });
        this.draw();
    }
    handlePointerPosition(clientX, clientY) {
        const xDiff = clientX - this.startX;
        const yDiff = clientY - this.startY;
        var rads = Math.atan2(yDiff, xDiff);
        if (xDiff <= 0 && yDiff >= 0) {
            // It's between -180 and -90 in the 9-12 quarter,
            // but 180 and 90 in the 6-9 quarter.
            // We want it to be between -180 and -270.
            rads = rads - 2 * Math.PI;
        }
        rads = Math.min(this.max, Math.max(this.min, rads));
        this.currentRads = rads;
        // const degrees = Math.floor(rads * 180 / Math.PI);
        // console.log(`Offset ${xDiff} ${yDiff}, ${degrees}`);
        this.animationRef = window.requestAnimationFrame(this.draw.bind(this));
        const volume = (this.currentRads - this.min) / (this.max - this.min);
        this.onVolumeChangeCallback(volume);
    }
    draw() {
        // Background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = "white";
        const radius = this.canvas.width / 2 * 0.9;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, radius, this.min, this.max);
        this.ctx.stroke();
        // Draw current volume value
        this.ctx.strokeStyle = "#00eff7";
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, radius, this.min, this.currentRads);
        this.ctx.stroke();
        // Draw indicator
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.currentRads);
        this.ctx.strokeStyle = "gray";
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(radius + 3 / 2, 0);
        this.ctx.stroke();
        this.ctx.restore();
    }
    onVolumeChange(callback) {
        this.onVolumeChangeCallback = callback;
    }
}
class Utils {
    // Determine the number of lanes from the largest piece position.
    // This will be used for drawing alternating background for lanes.
    static getLanesCount() {
        var maxPosition = 0;
        for (const pieceName in appConfig.noteMapping) {
            const position = appConfig.noteMapping[pieceName].position;
            if (maxPosition < position) {
                maxPosition = position;
            }
        }
        return maxPosition;
    }
}
//# sourceMappingURL=utils.js.map