# PizzaTracker-dApp 🍕

> Decentralized pizza tracking without gas fees – sign, verify, and manage orders using only your wallet.

## What It Does
PizzaTracker lets customers place pizza orders, and stores update progress by signing each stage of the process — without smart contracts or gas fees. Everything is verified via digital wallet signatures.

## How It Works
- Customers sign their order details using MetaMask
- Store verifies and updates order stages (Ordered → Baked → Delivered) with wallet-based signatures
- All updates are stored locally and can be optionally uploaded to IPFS
- No on-chain gas required

## Tech Stack
| Layer        | Tooling                  |
|--------------|--------------------------|
| Frontend     | HTML, Vanilla JS, CSS    |
| Web3 Auth    | MetaMask + Ethers.js     |
| Storage      | localStorage + IPFS      |
| Signatures   | `signMessage()` / `verifyMessage()` |

## Features
- Wallet-based order signing
- Stage-by-stage tracking with signature verification
- IPFS export/import (optional)
- MVP-ready for future on-chain or DeFi integration

## Configuration
To define the authorized store wallet for signature verification, edit the `config.js` file:

```js
// config.js
// Replace with the wallet address that signs stage updates
const STORE_WALLET = "0xYourWalletAddressHere";
```

## Ideas for Next Steps
- On-chain proof-of-service using smart contracts
- Multi-party role support (customer, store, delivery)
- Real-time IPFS pub/sub or database sync

## License
MIT — free to fork, adapt, and build on.
