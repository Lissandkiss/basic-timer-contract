# basic-timer-contract

Basic on-chain Free TON timer.

## How does it works?

There are two contracts: `Clock` and `Point`.

`Clock` receives `Point` address, waits for `setTimer` and starts "playing ping-pong" with `Point` until the set time expires. When it stops, `Clock` sends message to `onTimer` client function.

```
contract Clock {

    # set Point address
    function setPoint(address addr) external checkOwnerAndAccept { }

    # function which gets message from Point checks if it is time to send message to client. If not, send message back to Point
    function mail() external { }

    # run timer
    function setTimer(uint nSeconds) external { }

    # refund tokens
    function sendTransaction(address dest, uint128 value, bool bounce) public view checkOwnerAndAccept { }

}
```

```
contract Point {

    # function which gets message from Clock and sends message back to Clock
    function mail() external pure { }

    # refund tokens
    function sendTransaction(address dest, uint128 value, bool bounce) public view checkOwnerAndAccept { }

}
```

## Usage

You need to prepare a callback in your contract to receive a notification from the timer:

```
contract Client {
    function onTimer() external { }
}
```

> You can see the example of Client in ./src/Client.sol

After you have prepared your contract, follow the instructions:

1. Deploy `Clock` contract.
2. Deploy `Pointer` contract.
3. Externally call `setPoint` function on `Clock` and input `{ addr: <POINTER_ADDRESS> }` to set up timer.
4. Now you can call `setTimer` function on `Clock` with `"inputs": [{ "name": "nSeconds", "type": "uint256" }],` from your contract to run timer.
5. Timer will respond to your contract invoking a function `onTimer` after `nSeconds` +- 30 seconds.

## Example

An example of usage is located in _./test/_ folder.

In this example, setcode multisig is used to supply tokens for contracts. If you want to run the example, create a file _multisig.js_ with keys and an address in the _./test/_ folder so the test passes successfully.

File example:

```
const multisig = {
  address: "<MULTISIG_ADDRESS>",
  keys: {
    public: "<MULTISIG_PUBKEY>",
    secret: "<MULTISIG_SECRET>",
  },
};

module.exports = {
  multisig,
};
```

> Please use only test multisig in test net. Be careful!

To run example:

```
cd ./test
npm i
npm run test
```

Example will:

- Init `TonClient`
- Deploy Point, Clock and Client contracts
- Set Point address to Clock
- Set Clock address to Client (see Client `setTimerAddress` function)
- Call first 60 seconds timer
- Check that timer has been called (see Client `getInfo` function)
- Wait for 90 seconds
- Check that timer has responded (see Client `getInfo` function)
- Repeat previous 4 steps one more time to doublecheck

## License

Apache License Version 2.0
