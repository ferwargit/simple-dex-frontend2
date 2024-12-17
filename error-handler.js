class ErrorHandler {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    handle(error) {
        const message = this.getErrorMessage(error);
        console.error('Error en la conexión:', {
            error,
            message,
            code: error.code,
            timestamp: new Date().toISOString()
        });
        this.stateManager.setState('error', message);
    }

    getErrorMessage(error) {
        // Mapa de códigos de error comunes
        const errorMappings = {
            '4001': 'El usuario rechazó la conexión',
            '-32002': 'Solicitud de conexión pendiente. Verifica tu wallet.',
            '-32603': 'Error interno de la wallet',
            '-32601': 'Método no soportado por la wallet',
            '-32700': 'Datos inválidos recibidos'
        };

        // Si tenemos un código de error conocido, usamos su mensaje
        if (error.code && errorMappings[error.code]) {
            return errorMappings[error.code];
        }

        // Verificar mensajes de error específicos
        if (error.message) {
            if (error.message.includes('user rejected')) {
                return 'El usuario rechazó la operación';
            }
            if (error.message.includes('network')) {
                return 'Error de conexión con la red blockchain';
            }
            if (error.message.includes('MetaMask')) {
                return 'Error en MetaMask: ' + error.message;
            }
            return error.message;
        }

        // Mensaje por defecto
        return 'Ocurrió un error al conectar la wallet';
    }
}

export default ErrorHandler;
