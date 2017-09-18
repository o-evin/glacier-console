import aws from './aws';

export default function abortUpload(upload) {

  return new Promise((resolve, reject) => {

    const params = {
      uploadId: upload.id,
      vaultName: upload.vaultName,
    };

    aws.abortMultipartUpload(params, (error, data) => {
      if(error) return reject(error);
      resolve(upload);
    });
  });
}
