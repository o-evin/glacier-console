import {glacier} from '../';

export default function deleteVault(vault) {

  return new Promise((resolve, reject) => {

    const params = {
      vaultName: vault.name,
    };

    glacier.deleteVault(params, (error) => {
      if(error) return reject(error);
      resolve();
    });

  });
}
