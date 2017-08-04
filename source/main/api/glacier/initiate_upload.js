import fs from 'fs';
import path from 'path';

import {glacier} from '../';
import {Upload} from '../../../contracts/entities';
import {UploadStatus} from '../../../contracts/enums';
import {Transfer as Defaults} from '../../../contracts/const';

export default function initiateUpload({filePath, pathRoot, vaultName,
  prefix = ''}) {

  return new Promise((resolve, reject) => {
    const stats = fs.statSync(filePath);
    const archiveSize = stats.size;


    const description = path.join(
      prefix || '',
      pathRoot ? filePath.slice(pathRoot.length + 1) : path.basename(filePath),
    ).replace('\\', '/') ;

    const partSize = global.config.get(
      'transfer.partSizeInBytes',
      Defaults.PART_SIZE_IN_BYTES
    );

    const params = {
      vaultName: vaultName,
      archiveDescription: description,
      partSize: partSize.toString(),
    };

    glacier.initiateMultipartUpload(params, (error, data) => {
      if(error) return reject(error);

      resolve(new Upload({
        id: data.uploadId,
        partSize,
        archiveSize,
        description,
        vaultName,
        filePath,
        pathRoot,
        location: data.location,
        status: UploadStatus.PROCESSING,
        createdAt: new Date(),
      }));

    });
  });
}
