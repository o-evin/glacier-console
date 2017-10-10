import aws from './aws';

export default function deleteVault(vaultName) {

  return new Promise((resolve, reject) => {

    aws.deleteVault({vaultName}, (error) => {
      if(error) return reject(error);
      resolve();
    });

  });
}
