import aws from './aws';

export default function deleteArchive(id, vaultName) {

  return new Promise((resolve, reject) => {

    const params = {
      vaultName,
      archiveId: id,
    };

    aws.deleteArchive(params, (error, data) => {
      if(error) return reject(error);
      resolve();
    });

  });
}
