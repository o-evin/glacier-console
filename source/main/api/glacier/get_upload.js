import aws from './aws';

import {Upload} from '../../../contracts/entities';

export default function getUpload({vaultName, id}) {

  return new Promise((resolve, reject) => {

    const params = {
      vaultName,
      uploadId: id,
      limit: '1',
    };

    aws.listParts(params, (error, data) => {

      if(error) {
        if(error.code === 'ResourceNotFoundException') {
          return resolve(null);
        }

        return reject(error);
      }

      resolve(
        new Upload({
          vaultName,
          id: data.MultipartUploadId,
          partSize: data.PartSizeInBytes,
          createdAt: data.CreationDate,
          description: data.ArchiveDescription,
        })
      );

    });
  });
}
