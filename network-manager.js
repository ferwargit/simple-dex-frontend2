class NetworkManager {
    constructor(networkElement) {
        this.networkElement = networkElement;
    }

    async updateNetworkInfo() {
        if (!this.networkElement) {
            console.error('Elemento de red no encontrado');
            return;
        }
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const chainIdDecimal = parseInt(chainId, 16);
            const networkName = this.getNetworkName(chainIdDecimal);
            this.networkElement.innerText = `Red: ${networkName}`;
        } catch (error) {
            console.error('Error al obtener la información de la red:', error);
            this.networkElement.innerText = 'Red: Desconocida';
        }
    }

    getNetworkName(chainId) {
        switch (chainId) {
            case 1:
                return 'Ethereum Mainnet';
            case 3:
                return 'Ropsten';
            case 4:
                return 'Rinkeby';
            case 5:
                return 'Goerli';
            case 42:
                return 'Kovan';
            case 137:
                return 'Polygon';
            case 534351:
                return 'Scroll Sepolia';
            case 11155111:
                return 'Sepolia';
            default:
                return 'Desconocida';
        }
    }
}

export default NetworkManager;
