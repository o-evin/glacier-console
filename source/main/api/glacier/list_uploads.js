import aws from './aws';

import {Upload} from '../../../contracts/entities';

export default function listUploads(vault, marker, uploads = []) {

  return new Promise((resolve, reject) => {

    const params = {
      marker,
      vaultName: vault.name,
    };

    aws.listMultipartUploads(params, (error, data) => {

      if(error) return reject(error);

      uploads = uploads.concat(data.UploadsList.map(
        item => new Upload({
          id: item.MultipartUploadId,
          vaultName: vault.name,
          vaultArn: item.VaultARN,
          partSize: item.PartSizeInBytes,
          createdAt: item.CreationDate,
          description: item.ArchiveDescription,
        })
      ));

      if(data.Marker) {
        return listUploads(vault, data.Marker, uploads)
          .then(resolve);
      }

      resolve(uploads);
    });
  });
}
