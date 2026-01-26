# Trade Signal - Smart Contracts 📜

Smart contracts em Solidity para o marketplace descentralizado de sinais de trading Trade Signal.

![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)
![Hardhat](https://img.shields.io/badge/Hardhat-2.19-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Sobre

Conjunto de smart contracts que implementam um marketplace descentralizado onde traders podem:

- 📝 Criar sinais de mercado (Bullish/Bearish)
- 💰 Monetizar suas análises
- 🏆 Construir reputação on-chain
- 🔮 Resolução automática via Chainlink Oracle

## ✨ Features

- **Criação de Sinais** - Traders criam sinais pagando uma listing fee
- **Sistema de Compra** - Usuários compram acesso às análises
- **Protocol Fee** - 5% vai para o protocolo, 95% para o trader
- **Resolução Automática** - Chainlink Price Feeds verificam predições
- **Reputação On-chain** - Track record imutável de accuracy
- **Gerenciamento** - Owner pode retirar protocol fees

## 🛠️ Stack Tecnológica

- **Linguagem**: Solidity 0.8.20
- **Framework**: Hardhat
- **Bibliotecas**:
  - OpenZeppelin Contracts (Ownable)
  - Chainlink Contracts (Price Feeds)
- **Ferramentas**:
  - Ethers.js (interação)
  - Hardhat Etherscan (verificação)
  - Dotenv (variáveis de ambiente)

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Wallet com ETH Sepolia

### Passos

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/tradesignal-contracts.git
cd tradesignal-contracts

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

Edite o arquivo `.env`:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/sua-api-key
PRIVATE_KEY=sua_private_key_aqui
ETHERSCAN_API_KEY=sua_etherscan_api_key
```

## 🏗️ Estrutura do Contrato

### SignalMarket.sol

```solidity
struct Signal {
    address trader;          // Endereço do criador
    Direction direction;     // Bullish (0) ou Bearish (1)
    SignalStatus status;     // Active, Resolved, Expired, Cancelled
    bool isCorrect;          // Predição correta?
    uint256 id;             // ID único
    uint256 targetPrice;    // Preço alvo (USD)
    uint256 deadline;       // Timestamp do deadline
    uint256 fee;            // Fee para acessar análise
    string asset;           // Asset (ETH, BTC, etc)
    string analysis;        // Análise privada
}
```

### Funções Principais

#### Públicas

```solidity
// Criar um novo signal
function createSignal(
    string memory _asset,
    uint256 _targetPrice,
    uint256 _deadline,
    Direction _direction,
    uint256 _fee,
    string memory _analysis
) public payable

// Comprar acesso a um signal
function purchaseSignal(uint256 signalId) public payable

// Ver análise (somente se comprou)
function getSignalAnalysis(uint256 signalId) public view returns (string memory)

// Resolver signal (após deadline)
function resolveSignal(uint256 signalId) public

// Cancelar signal (somente criador)
function cancelSignal(uint256 signalId) public
```

#### Owner Only

```solidity
// Retirar protocol fees
function withdrawProtocolFees() public onlyOwner
```

### Eventos

```solidity
event SignalCreated(uint256 indexed signalId, address indexed trader, string asset, uint256 targetPrice, uint256 deadline);
event SignalPurchased(uint256 indexed signalId, address indexed buyer, uint256 amount);
event SignalResolved(uint256 indexed signalId, bool isCorrect, uint256 finalPrice);
event SignalCancelled(uint256 indexed signalId, address indexed trader);
event ProtocolFeesWithdrawn(address indexed owner, uint256 amount);
```

## 🚀 Deploy

### Testnet (Sepolia)

```bash
# Compile os contratos
npx hardhat compile

# Deploy na Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verificar no Etherscan
npx hardhat verify --network sepolia ENDERECO_DO_CONTRATO ENDERECO_PRICE_FEED
```

### Mainnet

⚠️ **ATENÇÃO**: Audite o contrato antes de fazer deploy na mainnet!

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## 🧪 Testes

```bash
# Rodar todos os testes
npx hardhat test

# Rodar com coverage
npx hardhat coverage

# Rodar testes específicos
npx hardhat test test/SignalMarket.test.js
```

## 📝 Scripts Disponíveis

### Deploy Script

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Interagir com Contrato

```bash
# Criar signal
npx hardhat run scripts/createSignal.js --network sepolia

# Comprar signal
npx hardhat run scripts/purchaseSignal.js --network sepolia

# Resolver signal
npx hardhat run scripts/resolveSignal.js --network sepolia
```

## 🔧 Configuração

### Chainlink Price Feeds

O contrato usa Chainlink Price Feeds para resolução automática.

**Sepolia Testnet:**

- ETH/USD: `0x694AA1769357215DE4FAC081bf1f309aDC325306`

**Mainnet:**

- Veja endereços em: https://docs.chain.link/data-feeds/price-feeds/addresses

### Fees

```solidity
uint256 public listingFee = 0.001 ether;      // Fee para criar signal
uint256 public protocolFeePercent = 5;         // 5% do valor de compra
```

Para alterar:

```solidity
// Adicione funções no contrato:
function setListingFee(uint256 _fee) public onlyOwner {
    listingFee = _fee;
}

function setProtocolFeePercent(uint256 _percent) public onlyOwner {
    protocolFeePercent = _percent;
}
```

## 🔐 Segurança

### Boas Práticas Implementadas

- ✅ **Reentrancy Protection** - Checks-Effects-Interactions pattern
- ✅ **Access Control** - OpenZeppelin Ownable
- ✅ **Input Validation** - Requires em todas as funções críticas
- ✅ **Integer Overflow** - Solidity 0.8.x built-in protection
- ✅ **External Calls** - Mínimo de calls externos

### Auditorias

⚠️ **Este contrato NÃO foi auditado profissionalmente**

Para produção, recomenda-se:

- Auditoria por empresa especializada (OpenZeppelin, Trail of Bits, etc)
- Bug bounty program
- Testes extensivos
- Deploy gradual com limits

## 📊 Gas Optimization

| Função         | Gas Estimado (Sepolia) |
| -------------- | ---------------------- |
| createSignal   | ~150,000 gas           |
| purchaseSignal | ~80,000 gas            |
| resolveSignal  | ~100,000 gas           |
| cancelSignal   | ~50,000 gas            |

## 🌐 Deployments

### Sepolia Testnet

- **Contrato**: `0x23ae9ee257069cCcDa0157e2941D5D8ba4394B47`
- **Etherscan**: https://sepolia.etherscan.io/address/0x23ae9ee257069cCcDa0157e2941D5D8ba4394B47
- **Chainlink Price Feed**: `0x694AA1769357215DE4FAC081bf1f309aDC325306`

### Mainnet

_Ainda não deployado_

## 📖 Documentação Técnica

### Fluxo de Uso

1. **Trader cria signal**:

   ```
   createSignal() → paga 0.001 ETH → signal ativo
   ```

2. **Usuário compra**:

   ```
   purchaseSignal() → paga fee → acesso liberado
   95% vai para trader, 5% para protocolo
   ```

3. **Após deadline**:

   ```
   resolveSignal() → Chainlink verifica preço → marca como correto/incorreto
   ```

4. **Reputação atualizada**:
   ```
   traderStats[trader].totalSignals++
   Se correto: traderStats[trader].correctSignals++
   ```

### Estados do Signal

```solidity
enum SignalStatus {
    Active,     // 0 - Signal ativo, pode ser comprado
    Resolved,   // 1 - Resolvido após deadline
    Expired,    // 2 - Expirado (não implementado ainda)
    Cancelled   // 3 - Cancelado pelo criador
}
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🔗 Links

- **Interface Web**: [tradesignal-ui](https://github.com/seu-usuario/tradesignal-ui)
- **Chainlink Docs**: https://docs.chain.link/
- **OpenZeppelin**: https://docs.openzeppelin.com/
- **Hardhat**: https://hardhat.org/

## 📞 Suporte

Tem dúvidas? Abra uma [issue](https://github.com/seu-usuario/tradesignal-contracts/issues) ou entre em contato!

---

**Desenvolvido com ❤️ como projeto final do Web3 Bootcamp**
