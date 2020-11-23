const { TONClient } = require("ton-client-node-js");
const fs = require("fs");
const { multisig } = require("./multisig");

const loadPackage = (name) => {
  const package = {};
  package.abi = JSON.parse(fs.readFileSync("./packages/" + name + ".abi.json", "utf8"));
  package.imageBase64 = fs.readFileSync("./packages/" + name + ".tvc").toString("base64");
  return package;
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

async function deployAcrossMultisig(client, multisig, deploy) {
  const futureAddress = (
    await client.contracts.createDeployMessage({
      package: deploy.package,
      constructorParams: deploy.options,
      keyPair: deploy.keys,
    })
  ).address;

  await client.contracts.run({
    address: multisig.address,
    abi: multisigPackage.abi,
    functionName: "sendTransaction",
    input: {
      dest: futureAddress,
      value: 3_000_000_000,
      bounce: false,
      flags: 3,
      payload: "",
    },
    keyPair: multisig.keys,
  });

  const tx = await client.contracts.deploy({
    package: deploy.package,
    constructorParams: deploy.options,
    keyPair: deploy.keys,
  });

  return tx;
}

const multisigPackage = loadPackage("multisig");

const clockPackage = loadPackage("clock");
const pointPackage = loadPackage("point");
const clientPackage = loadPackage("client");

describe("basic timer example usage", function () {
  this.timeout(570000);

  let tonClient;

  let pointAddress;
  let pointKeypair;
  let clockAddress;
  let clockKeypair;

  let clientAddress;
  let clientKeypair;

  const seconds = 60;

  before(async function () {
    const config = {
      servers: ["net.ton.dev"],
    };
    tonClient = await TONClient.create(config);
    console.log("ton client has been inited");

    pointKeypair = await tonClient.crypto.ed25519Keypair();
    clockKeypair = await tonClient.crypto.ed25519Keypair();
    clientKeypair = await tonClient.crypto.ed25519Keypair();
  });

  it("deploy basic timer contracts", async () => {
    console.log(`deploy point, clock and client`);
    const [deployTxPoint, deployTxClock, deployTxClient] = await Promise.all([
      deployAcrossMultisig(tonClient, multisig, {
        package: pointPackage,
        options: {},
        keys: pointKeypair,
      }),
      deployAcrossMultisig(tonClient, multisig, {
        package: clockPackage,
        options: {},
        keys: clockKeypair,
      }),
      deployAcrossMultisig(tonClient, multisig, {
        package: clientPackage,
        options: {},
        keys: clientKeypair,
      }),
    ]);
    pointAddress = deployTxPoint.address;
    console.log(`point has been deployed to: ${pointAddress}`);
    clockAddress = deployTxClock.address;
    console.log(`clock has been deployed to: ${clockAddress}`);
    clientAddress = deployTxClient.address;
    console.log(`client has been deployed to: ${clientAddress}`);
  });

  it("setup timer", async () => {
    console.log(`set clock address to client`);
    console.log(`set point address to clock`);
    try {
      const result = await Promise.all([
        tonClient.contracts.run({
          address: clientAddress,
          abi: clientPackage.abi,
          functionName: "setTimerAddress",
          input: {
            addr: clockAddress,
          },
          keyPair: clientKeypair,
        }),
        tonClient.contracts.run({
          address: clockAddress,
          abi: clockPackage.abi,
          functionName: "setPoint",
          input: {
            addr: pointAddress,
          },
          keyPair: clockKeypair,
        }),
      ]);
      console.log(`clock address has been set to client`);
      console.log(`point address has been set to clock`);
      console.log("timer has been fully set up");
    } catch (err) {
      console.error({ err });
    }
  });

  it(`call first ${seconds} seconds timer`, async () => {
    console.log(`call ${seconds} seconds timer`);
    try {
      const result = await tonClient.contracts.run({
        address: clientAddress,
        abi: clientPackage.abi,
        functionName: "callTimer",
        input: {
          nSeconds: seconds,
        },
        keyPair: clientKeypair,
      });
    } catch (err) {
      console.log({ err });
    }
    console.log(`${seconds} seconds timer has been called`);
  });

  it("check that first timer is set", async () => {
    const response = await tonClient.contracts.runLocal({
      address: clientAddress,
      abi: clientPackage.abi,
      functionName: "getInfo",
      input: {},
    });
    console.log("client getInfo: ", { response: JSON.stringify(response.output) });
  });

  it(`sleep ${seconds + 30} sec and check for first timer result`, async () => {
    let secs = seconds + 30;
    const interval = setInterval(() => {
      secs -= 10;
      console.log(`sleeping, ${secs} seconds left`);
      if (secs <= 10) {
        clearInterval(interval);
      }
    }, 10000);
    await sleep(1000 * 70);
    const response = await tonClient.contracts.runLocal({
      address: clientAddress,
      abi: clientPackage.abi,
      functionName: "getInfo",
      input: {},
    });
    console.log("client getInfo: ", { response: JSON.stringify(response.output) });
  });

  it(`call second ${seconds} seconds timer`, async () => {
    console.log(`call ${seconds} seconds timer`);
    await tonClient.contracts.run({
      address: clientAddress,
      abi: clientPackage.abi,
      functionName: "callTimer",
      input: {
        nSeconds: seconds,
      },
      keyPair: clientKeypair,
    });
    console.log(`${seconds} seconds timer has been called`);
  });

  it("check that second timer is set", async () => {
    const response = await tonClient.contracts.runLocal({
      address: clientAddress,
      abi: clientPackage.abi,
      functionName: "getInfo",
      input: {},
    });
    console.log("client getInfo: ", { response: JSON.stringify(response.output) });
  });

  it(`sleep ${seconds + 30} sec and check for second timer result`, async () => {
    let secs = seconds + 30;
    const interval = setInterval(() => {
      secs -= 10;
      console.log(`sleeping, ${secs} seconds left`);
      if (secs <= 10) {
        clearInterval(interval);
      }
    }, 10000);
    await sleep(1000 * 70);
    const response = await tonClient.contracts.runLocal({
      address: clientAddress,
      abi: clientPackage.abi,
      functionName: "getInfo",
      input: {},
    });
    console.log("client getInfo: ", { response: JSON.stringify(response.output) });
  });
});
