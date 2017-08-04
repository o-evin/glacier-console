import {glacier} from '../';

import {Vault} from '../../../contracts/entities';

export default function createVault({name}) {

  return new Promise((resolve, reject) => {

    const params = {
      vaultName: name,
    };

    glacier.createVault(params, (error, data) => {

      if(error) return reject(error);

      const vault = new Vault({
        name: name,
        location: data.location,
      });

      resolve(vault);
    });

  });
}
