export class Observer {
    constructor(updateCallback) {
        this.updateCallback = updateCallback;
    }

    update(data) {
        this.updateCallback(data);
    }
}