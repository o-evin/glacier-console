import aws from './aws';

import TreeHash from '../hasher/tree_hash';

export default function uploadPart(part, vaultName, data) {

  return new Promise((resolve, reject) => {

    const params = {
      checksum: TreeHash.from(data),
      range: part.range,
      vaultName: vaultName,
      uploadId: part.parentId,
      body: data,
    };

    aws.uploadMultipartPart(params, (error, data) => {
      if(error) return reject(error);
      resolve(data);
    });
  });

}
