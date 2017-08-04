import {glacier} from '../';

export default function deleteArchive(id, vaultName) {

  return new Promise((resolve, reject) => {

    const params = {
      vaultName,
      archiveId: id,
    };

    glacier.deleteArchive(params, (error, data) => {
      if(error) return reject(error);
      resolve();
    });

  });
}
