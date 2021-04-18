const cosmosJS = require('@cosmostation/cosmosjs');
const axios = require('axios');

async function main() {
  const lcdUrl = 'https://cosmosapi-mainnet.tokenlon.im';
  const chainId = 'cosmoshub-4';
  const fromAddress = ''; // cosmos1*******
  const seedPhrase = ''; //sky apple ****
  const toAddress = ''; // cosmos1*******

  let cosmos = cosmosJS.network(lcdUrl, chainId);
  const ecpairPriv = cosmos.getECPairPriv(seedPhrase);
  const fee = 50000;
  const gas = 2000000;
  let availableAmount = 0;
  let isSent = false;

  while(1) {
    try {
      if (isSent) {
        break;
      }
      const response = await axios.get(`${ lcdUrl }/bank/balances/${fromAddress}`);
      if (response.data && response.data.length) {
        response.data.forEach((item) => {
          if (item.denom === 'uatom') {
            availableAmount = item.amount;
          }
        });
      }
      if (availableAmount === 0) {
        console.log('Available amount is 0 yet.');
        continue;
      }
      const accountInfo = await cosmos.getAccounts(fromAddress);
      if (!accountInfo) {
        return;
      }
      let stdSignMsg = cosmos.newStdMsg({
        msgs: [
          {
            type: 'cosmos-sdk/MsgSend',
            value: {
              amount: [
                {
                  amount: String(availableAmount -  fee),
                  denom: 'uatom'
                }
              ],
              from_address: fromAddress,
              to_address: toAddress
            }
          }
        ],
        chain_id: chainId,
        fee: { amount: [ { amount: String(fee), denom: 'uatom' } ], gas: String(gas) },
        memo: '',
        account_number: String(accountInfo.account.account_number),
        sequence: String(accountInfo.account.sequence)
      });
      const signedTx = cosmos.sign(stdSignMsg, ecpairPriv);
      cosmos.broadcast(signedTx).then(response => {
        console.log(response);
        isSent = true;
      });
    } catch (error) {
      console.log(error);
    }
  }

}

main().then();
