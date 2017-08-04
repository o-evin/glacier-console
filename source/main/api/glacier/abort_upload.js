import {glacier} from '../';

export default function abortUpload(upload) {

  return new Promise((resolve, reject) => {

    const params = {
      uploadId: upload.id,
      vaultName: upload.vaultName,
    };

    glacier.abortMultipartUpload(params, (error, data) => {
      if(error) return reject(error);
      resolve(upload);
    });
  });
}
