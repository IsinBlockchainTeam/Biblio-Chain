# Decentralized Library System

A decentralized library management platform built with Solidity and Hardhat.  
The system enables NFT-based book rental and sale, user reputation tracking, and owner-governed operations.

## Getting Started

### Prerequisites

- Node.js: v23.7.0 (Note: Hardhat officially supports Node.js v18 or v20)
- npm: v9+

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd blockchain
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
PRIVATE_KEY=your_wallet_private_key
INFURA_API_KEY=your_infura_project_id
```

Make sure not to commit `.env` to version control.

## Project Structure

- `contracts/` – Solidity smart contracts
- `scripts/` – Deployment and utility scripts
- `test/` – Automated tests using Mocha/Chai
- `docs/` – Generated documentation (if used)

## Compile

```bash
npx hardhat compile
```

## Run Tests

```bash
npx hardhat test
```

Tests are written using Mocha and Chai, with Ethers.js for contract interactions.

## Deployment

The project is configured for the Sepolia Testnet using Infura.

To deploy:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

## Tooling & Features

- Hardhat Toolbox – streamlined development
- Solidity v0.8.20 – with optimizer enabled
- OpenZeppelin Contracts – for ERC721 logic
- Contract Sizer – to verify byte size of contracts
- Solidity Coverage – to measure test coverage
- Surya – for contract structure analysis (optional)

To run coverage:

```bash
npx hardhat coverage
```

## Key Features

- ERC721-based NFT Books
- Rentable and Sellable book functionality
- Trust and reputation system for users
- Governance mechanism for owner proposals
- Emergency pausable controller

## License

MIT © Group 12 — University Project
