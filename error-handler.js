class ErrorHandler {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    handle(error) {
        const message = this.getErrorMessage(error);
        console.error('Error en la conexión:', error);
        this.stateManager.setState('error', message);
    }

    getErrorMessage(error) {
        if (error.code === 4001) {
            return 'El usuario rechazó la conexión';
        }
        if (error.code === -32002) {
            return 'Solicitud de conexión pendiente. Verifica tu wallet.';
        }
        return 'Ocurrió un error al conectar la wallet';
    }
}

export default ErrorHandler;
