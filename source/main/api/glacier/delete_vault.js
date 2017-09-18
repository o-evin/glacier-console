import aws from './aws';

export default function deleteVault(vault) {

  return new Promise((resolve, reject) => {

    const params = {
      vaultName: vault.name,
    };

    aws.deleteVault(params, (error) => {
      if(error) return reject(error);
      resolve();
    });

  });
}
