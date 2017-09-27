import fs from 'fs';
import aws from './aws';

import TreeHash from '../hasher/tree_hash';

export default function uploadPart({upload, part}) {

  return new Promise((resolve, reject) => {

    const data = Buffer.alloc(part.size);
    const fd = fs.openSync(upload.filePath, 'r');

    fs.readSync(fd, data, 0, part.size, part.position);

    const params = {
      body: data,
      range: part.range,
      uploadId: upload.id,
      vaultName: upload.vaultName,
      checksum: TreeHash.from(data),
    };

    aws.uploadMultipartPart(params, (error, data) => {
      if(error) return reject(error);
      resolve(data);
    });
  });

}
