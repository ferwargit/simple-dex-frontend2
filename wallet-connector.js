// Importamos ethers desde CDN
// import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";
const { ethers } = window;

// Constantes para mensajes y estados
const WALLET_STATES = {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
    PENDING: 'pending'
};

const MESSAGES = {
    METAMASK_NOT_FOUND: 'Por favor instala MetaMask para continuar',
    USER_REJECTED: 'El usuario rechazó la conexión',
    GENERIC_ERROR: 'Ocurrió un error al conectar la wallet',
    CONNECTION_SUCCESS: (address) => `Conectado: ${address}`,
    DISCONNECTION_SUCCESS: 'Wallet desconectada',
    PENDING_REQUEST: 'Solicitud pendiente...'
};

// Clase principal para manejar la conexión de la wallet
class WalletConnector {
    constructor(statusElementId = 'status', buttonElementId = 'connectButton', headerElementId = 'header', footerElementId = 'footer', networkElementId = 'network', connectionStatusElementId = 'connectionStatus') {
        console.log('Constructor llamado');
        this.statusElement = document.getElementById(statusElementId);
        console.log('statusElement:', this.statusElement);
        this.buttonElement = document.getElementById(buttonElementId);
        console.log('buttonElement:', this.buttonElement);
        this.headerElement = document.getElementById(headerElementId);
        console.log('headerElement:', this.headerElement);
        this.footerElement = document.getElementById(footerElementId);
        console.log('footerElement:', this.footerElement);
        this.networkElement = document.getElementById(networkElementId);
        console.log('networkElement:', this.networkElement);
        this.connectionStatusElement = document.getElementById(connectionStatusElementId);
        console.log('connectionStatusElement:', this.connectionStatusElement);
        this.provider = null;
        this.signer = null;
        this.state = WALLET_STATES.DISCONNECTED;
        this.requestPending = false;

        // Primero definimos los métodos de manejo de eventos
        this.handleAccountsChanged = async (accounts) => {
            console.log('Cuentas cambiadas:', accounts);
            if (accounts.length === 0) {
                this.state = WALLET_STATES.DISCONNECTED;
                this.updateStatus(MESSAGES.DISCONNECTION_SUCCESS, this.state);
            } else {
                this.state = WALLET_STATES.CONNECTED;
                this.updateStatus(MESSAGES.CONNECTION_SUCCESS(accounts[0]), this.state);
            }
            this.updateButton(this.state);
        };

        this.handleChainChanged = async (chainId) => {
            console.log('Red cambiada:', chainId);
            await this.updateNetworkInfo();
        };

        // Inicializamos el estado de la conexión
        this.updateUI(this.state);
    }

    /**
     * Actualiza el estado visual en la UI
     * @param {string} message - Mensaje a mostrar
     * @param {string} state - Estado de la conexión
     */
    updateStatus(message, state) {
        console.log(`Actualizando estado a: ${state} con mensaje: ${message}`);
        if (this.statusElement) {
            this.statusElement.innerText = message;
            this.statusElement.setAttribute('data-state', state);
        }
        this.updateUI(state);
    }

    /**
     * Actualiza el botón según el estado de la conexión
     * @param {string} state - Estado de la conexión
     */
    updateButton(state) {
        console.log(`Actualizando botón a estado: ${state}`);
        if (this.buttonElement) {
            if (state === WALLET_STATES.CONNECTED) {
                this.buttonElement.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                this.buttonElement.classList.add('bg-red-500', 'hover:bg-red-600');
                this.buttonElement.querySelector('span').innerText = 'Desconectar Wallet';
            } else {
                this.buttonElement.classList.remove('bg-red-500', 'hover:bg-red-600');
                this.buttonElement.classList.add('bg-blue-500', 'hover:bg-blue-600');
                this.buttonElement.querySelector('span').innerText = 'Conectar Wallet';
            }
        }
    }

    /**
     * Actualiza la UI según el estado de la conexión
     * @param {string} state - Estado de la conexión
     */
    updateUI(state) {
        console.log(`Actualizando UI a estado: ${state}`);
        if (this.headerElement && this.footerElement && this.networkElement && this.connectionStatusElement) {
            if (state === WALLET_STATES.CONNECTED) {
                this.headerElement.style.display = 'none';
                this.footerElement.style.display = 'none';
                this.networkElement.style.display = 'block';
                this.connectionStatusElement.innerText = 'Wallet conectada';
                console.log('connectionStatusElement innerText:', this.connectionStatusElement.innerText);
                this.updateNetworkInfo();
            } else {
                this.headerElement.style.display = 'block';
                this.footerElement.style.display = 'block';
                this.networkElement.style.display = 'none';
                this.connectionStatusElement.innerText = 'Wallet desconectada';
                console.log('connectionStatusElement innerText:', this.connectionStatusElement.innerText);
            }
        }
    }

    /**
     * Actualiza la información de la red
     */
    async updateNetworkInfo() {
        console.log('Actualizando información de la red');
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            console.log('chainId:', chainId);
            const chainIdDecimal = parseInt(chainId, 16); // Convertimos de hexadecimal a decimal
            console.log('chainIdDecimal:', chainIdDecimal);
            let networkName = 'Desconocida';

            // Mapeo de chainId a nombre de red (puedes ajustar según tus necesidades)
            switch (chainIdDecimal) {
                case 1:
                    networkName = 'Ethereum Mainnet';
                    break;
                case 3:
                    networkName = 'Ropsten';
                    break;
                case 4:
                    networkName = 'Rinkeby';
                    break;
                case 5:
                    networkName = 'Goerli';
                    break;
                case 42:
                    networkName = 'Kovan';
                    break;
                case 137:
                    networkName = 'Polygon';
                    break;
                case 534351: // Identificador de cadena para Scroll Sepolia
                    networkName = 'Scroll Sepolia';
                    break;
                case 11155111: // Identificador de cadena para Sepolia
                    networkName = 'Sepolia';
                    break;
                // Añade más redes según sea necesario
                default:
                    networkName = 'Desconocida';
            }

            this.networkElement.innerText = `Red: ${networkName}`;
            console.log('networkElement innerText:', this.networkElement.innerText);
        } catch (error) {
            console.error('Error al obtener la información de la red:', error);
            this.networkElement.innerText = 'Red: Desconocida';
        }
    }

    /**
     * Verifica si MetaMask está instalado
     * @returns {boolean}
     */
    isMetaMaskInstalled() {
        return typeof window.ethereum !== 'undefined';
    }

    /**
     * Maneja los errores de conexión
     * @param {Error} error - Error capturado
     */
    handleError(error) {
        console.error('Error en la conexión:', error);

        const message = error.code === 4001
            ? MESSAGES.USER_REJECTED
            : MESSAGES.GENERIC_ERROR;

        this.updateStatus(message, WALLET_STATES.ERROR);
        this.state = WALLET_STATES.ERROR;
        this.requestPending = false;

        return null;
    }

    /**
     * Inicializa los eventos de cambio de cuenta y red
     */
    initListeners() {
        console.log('Inicializando listeners');
        window.ethereum.on('accountsChanged', async (accounts) => {
            console.log('Cuentas cambiadas:', accounts);
            if (accounts.length === 0) {
                this.updateStatus(MESSAGES.DISCONNECTION_SUCCESS, WALLET_STATES.DISCONNECTED);
                this.state = WALLET_STATES.DISCONNECTED;
                this.updateButton(this.state);
            } else {
                this.updateStatus(MESSAGES.CONNECTION_SUCCESS(accounts[0]), WALLET_STATES.CONNECTED);
                this.updateButton(this.state);
            }
        });

        window.ethereum.on('chainChanged', async (chainId) => {
            console.log('Red cambiada:', chainId);
            await this.updateNetworkInfo();
        });
    }

    /**
     * Conecta la wallet
     * @returns {Promise<{provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner} | null>}
     */
    async connect() {
        console.log('Conectando wallet');
        if (!this.isMetaMaskInstalled()) {
            this.updateStatus(MESSAGES.METAMASK_NOT_FOUND, WALLET_STATES.ERROR);
            return null;
        }

        if (this.requestPending) {
            this.updateStatus(MESSAGES.PENDING_REQUEST, WALLET_STATES.PENDING);
            return null;
        }

        this.requestPending = true;

        try {
            // Inicializamos el provider
            this.provider = new ethers.BrowserProvider(window.ethereum);

            // Solicitamos acceso a las cuentas
            await this.provider.send("eth_requestAccounts", []);

            // Obtenemos el signer
            this.signer = await this.provider.getSigner();

            // Obtenemos la dirección
            const address = await this.signer.getAddress();

            // Actualizamos el estado
            this.state = WALLET_STATES.CONNECTED;
            this.updateStatus(MESSAGES.CONNECTION_SUCCESS(address), this.state);
            this.updateButton(this.state);

            // Inicializamos los listeners de cambio de cuenta y red
            this.initListeners();

            // Log de versión (útil para debugging)
            console.log("Versión de Ethers.js:", ethers.version);

            // Actualizamos la información de la red
            await this.updateNetworkInfo();

            this.requestPending = false;

            return {
                provider: this.provider,
                signer: this.signer
            };

        } catch (error) {
            this.requestPending = false;
            return this.handleError(error);
        }
    }

    /**
     * Desconecta la wallet
     */
    async disconnect() {
        console.log('Desconectando wallet');
        if (this.provider) {
            try {
                this.state = WALLET_STATES.DISCONNECTED;
                this.updateStatus(this.state);
                this.updateButton(this.state);

                // Limpiamos los listeners para evitar memory leaks
                if (window.ethereum) {
                    window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
                    window.ethereum.removeListener('chainChanged', this.handleChainChanged);
                }

                this.provider = null;
                this.signer = null;
            } catch (error) {
                console.error('Error al desconectar la wallet:', error);
                this.handleError(error);
            }
        }
    }

    /**
     * Maneja el clic del botón
     */
    handleButtonClick() {
        console.log('Botón clicado');
        if (this.state === WALLET_STATES.CONNECTED) {
            this.disconnect();
        } else {
            this.connect();
        }
    }

    handleAccountsChanged(accounts) {
        console.log('Cuentas cambiadas:', accounts);
        if (accounts.length === 0) {
            this.state = WALLET_STATES.DISCONNECTED;
            this.updateStatus(MESSAGES.DISCONNECTION_SUCCESS, this.state);
        } else {
            this.state = WALLET_STATES.CONNECTED;
            this.updateStatus(MESSAGES.CONNECTION_SUCCESS(accounts[0]), this.state);
        }
        this.updateButton(this.state);
    }

    initListeners() {
        console.log('Inicializando listeners');
        window.ethereum.on('accountsChanged', this.handleAccountsChanged);
        window.ethereum.on('chainChanged', this.handleChainChanged);
    }
}

// Inicialización y exportación
const walletConnector = new WalletConnector('status', 'connectButton', 'header', 'footer', 'network', 'connectionStatus');

// Event listener para el botón de conexión/desconexión
walletConnector.buttonElement.addEventListener('click', () => walletConnector.handleButtonClick());

export default walletConnector;

