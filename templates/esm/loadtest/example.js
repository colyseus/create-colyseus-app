export function requestJoinOptions (i) {
    return { requestNumber: i };
}

export function onJoin () {
    console.log(this.sessionId, "joined.");

    this.onMessage("*", (type, message) => {
        console.log(this.sessionId, "received:", type, message);
    });
}

export function onLeave () {
    console.log(this.sessionId, "left.");
}

export function onError (err) {
    console.log(this.sessionId, "!! ERROR !!", err.message);
}

export function onStateChange (state) {
    console.log(this.sessionId, "new state:", state);
}
