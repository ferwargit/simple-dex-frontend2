import { Observable } from './observable.js';
import { Observer } from './observer.js';

class WalletConnector {
    constructor(statusElementId, buttonElementId, headerElementId, footerElementId, networkElementId, connectionStatusElementId) {
        this.statusElement = document.getElementById(statusElementId);
        this.buttonElement = document.getElementById(buttonElementId);
        this.headerElement = document.getElementById(headerElementId);
        this.footerElement = document.getElementById(footerElementId);
        this.networkElement = document.getElementById(networkElementId);
        this.connectionStatusElement = document.getElementById(connectionStatusElementId);
        this.provider = null;
        this.signer = null;
        this.state = 'disconnected';
        this.requestPending = false;

        // Crear un observable para el estado de la conexión
        this.stateObservable = new Observable();

        // Suscribir los elementos de la UI al observable
        this.stateObservable.subscribe(new Observer(this.updateStatus.bind(this)));
        this.stateObservable.subscribe(new Observer(this.updateButton.bind(this)));
        this.stateObservable.subscribe(new Observer(this.updateUI.bind(this)));
    }

    // Métodos de actualización de la UI
    updateStatus(data) {
        const { message, state } = data;
        if (this.statusElement) {
            this.statusElement.innerText = message;
            this.statusElement.setAttribute('data-state', state);
        }
    }

    updateButton(data) {
        const { state } = data;
        if (this.buttonElement) {
            if (state === 'connected') {
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

    updateUI(data) {
        const { state } = data;
        if (this.headerElement && this.footerElement && this.networkElement && this.connectionStatusElement && this.statusElement) {
            if (state === 'connected') {
                this.headerElement.style.display = 'none';
                this.footerElement.style.display = 'none';
                this.networkElement.style.display = 'block';
                this.connectionStatusElement.innerText = 'Wallet conectada';
                this.connectionStatusElement.style.display = 'block';
                this.statusElement.style.display = 'block';
                this.statusElement.setAttribute('data-state', state);
                this.statusElement.innerText = this.signer && this.signer.address
                    ? `Conectado: ${this.signer.address}`
                    : 'Wallet conectada';
            } else {
                this.headerElement.style.display = 'block';
                this.footerElement.style.display = 'block';
                this.networkElement.style.display = 'none';
                this.connectionStatusElement.innerText = 'Wallet desconectada';
                this.connectionStatusElement.style.display = 'block';
                this.statusElement.style.display = 'none';
                this.statusElement.setAttribute('data-state', state);
                this.statusElement.innerText = '';
            }
        } else {
            console.error('Algunos elementos no están disponibles para actualizar la UI');
        }
    }

    // Métodos de conexión y desconexión
    async connect() {
        if (!this.isMetaMaskInstalled()) {
            this.stateObservable.notify({ message: 'Por favor instala MetaMask para continuar', state: 'error' });
            return null;
        }

        if (this.requestPending) {
            this.stateObservable.notify({ message: 'Solicitud pendiente...', state: 'pending' });
            return null;
        }

        this.requestPending = true;

        try {
            this.provider = new ethers.BrowserProvider(window.ethereum);
            await this.provider.send("eth_requestAccounts", []);
            this.signer = await this.provider.getSigner();
            const address = await this.signer.getAddress();
            this.state = 'connected';
            this.stateObservable.notify({ message: `Conectado: ${address}`, state: 'connected' });
            this.initListeners();
            await this.updateNetworkInfo();
            this.requestPending = false;
            return { provider: this.provider, signer: this.signer };
        } catch (error) {
            this.requestPending = false;
            this.handleError(error);
            return null;
        }
    }

    async disconnect() {
        if (this.provider) {
            try {
                this.state = 'disconnected';
                this.stateObservable.notify({ message: 'Wallet desconectada', state: 'disconnected' });
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

    handleButtonClick() {
        if (this.state === 'connected') {
            this.disconnect();
        } else {
            this.connect();
        }
    }

    handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
            this.state = 'disconnected';
            this.stateObservable.notify({ message: 'Wallet desconectada', state: 'disconnected' });
        } else {
            this.state = 'connected';
            this.stateObservable.notify({ message: `Conectado: ${accounts[0]}`, state: 'connected' });
        }
    };

    handleChainChanged = async (chainId) => {
        await this.updateNetworkInfo();
    };

    async updateNetworkInfo() {
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const chainIdDecimal = parseInt(chainId, 16);
            let networkName = 'Desconocida';
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
                case 534351:
                    networkName = 'Scroll Sepolia';
                    break;
                case 11155111:
                    networkName = 'Sepolia';
                    break;
                default:
                    networkName = 'Desconocida';
            }
            this.networkElement.innerText = `Red: ${networkName}`;
        } catch (error) {
            console.error('Error al obtener la información de la red:', error);
            this.networkElement.innerText = 'Red: Desconocida';
        }
    }

    isMetaMaskInstalled() {
        return typeof window.ethereum !== 'undefined';
    }

    handleError(error) {
        console.error('Error en la conexión:', error);
        const message = error.code === 4001
            ? 'El usuario rechazó la conexión'
            : 'Ocurrió un error al conectar la wallet';
        this.stateObservable.notify({ message, state: 'error' });
        this.state = 'error';
        this.requestPending = false;
    }

    initListeners() {
        window.ethereum.on('accountsChanged', this.handleAccountsChanged);
        window.ethereum.on('chainChanged', this.handleChainChanged);
    }
}

// Inicialización y exportación
const walletConnector = new WalletConnector('status', 'connectButton', 'header', 'footer', 'network', 'connectionStatus');

// Event listener para el botón de conexión/desconexión
walletConnector.buttonElement.addEventListener('click', () => walletConnector.handleButtonClick());

export default walletConnector;
