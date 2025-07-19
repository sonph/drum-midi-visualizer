var timerID = null;
var interval = 100;
self.onmessage = function (e) {
    if (e.data == "start") {
        console.log("Metronome worker starting");
        timerID = setInterval(function () { postMessage("tick"); }, interval);
    }
    else if (e.data.interval) {
        interval = e.data.interval;
        console.log("interval=" + interval);
        if (timerID) {
            clearInterval(timerID);
            timerID = setInterval(function () { postMessage("tick"); }, interval);
        }
    }
    else if (e.data == "stop") {
        console.log("Metronome worker stopping");
        clearInterval(timerID);
        timerID = null;
    }
};
//# sourceMappingURL=worker.js.map