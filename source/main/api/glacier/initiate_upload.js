import fs from 'fs';
import path from 'path';
import aws from './aws';

import {Upload} from '../../../contracts/entities';
import {UploadStatus} from '../../../contracts/enums';

export default function initiateUpload({filePath, pathRoot, vaultName,
  prefix = ''}) {

  return new Promise((resolve, reject) => {
    const stats = fs.statSync(filePath);
    const archiveSize = stats.size;

    const description = path.posix.join(prefix,
      pathRoot ? filePath.slice(pathRoot.length + 1) : path.basename(filePath),
    );

    const {partSizeInBytes} = global.config.get('transfer');

    const params = {
      vaultName: vaultName,
      archiveDescription: description,
      partSize: partSizeInBytes.toString(),
    };

    aws.initiateMultipartUpload(params, (error, data) => {
      if(error) return reject(error);

      resolve(new Upload({
        id: data.uploadId,
        archiveSize,
        description,
        vaultName,
        filePath,
        pathRoot,
        partSize: partSizeInBytes,
        location: data.location,
        status: UploadStatus.PROCESSING,
        createdAt: new Date(),
      }));

    });
  });
}
