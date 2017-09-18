// import aws from './aws';

export default function updateVault({id, name}) {

  return new Promise((resolve, reject) => {

    throw new Error('Sorry, the update function is not fully ' +
      'implemented yet.');

    /*
    const params = {
      vaultName: name,
    };

    aws.setVaultNotifications(params, (error, data) => {
      if(error) return reject(error);
      resolve();
    });
    */
  });
}
