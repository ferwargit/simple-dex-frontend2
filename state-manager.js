import { Observable } from './observable.js';

class StateManager {
    
    constructor(observable) {
        this.state = 'disconnected'; // Estado inicial
        // this.observable = new Observable(); // Creación del observable
        this.observable = observable; // Recibe el observable externo
    }

    // Método para cambiar el estado y notificar
    setState(newState, message) {
        this.state = newState;
        this.notify({ state: this.state, message });
    }

    // Método para obtener el estado actual
    getState() {
        return this.state;
    }

    // Método para suscribir observadores
    subscribe(observer) {
        this.observable.subscribe(observer);
    }

    // Método para notificar a los observadores
    notify(data) {
        this.observable.notify(data);
    }
}

export default StateManager;
