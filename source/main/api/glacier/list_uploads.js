import aws from './aws';

import {Upload} from '../../../contracts/entities';

export default function listUploads({vaultName, marker, uploads = [],
  limit = 1000}) {

  return new Promise((resolve, reject) => {

    const params = {
      marker,
      vaultName,
      limit: limit.toString(),
    };

    aws.listMultipartUploads(params, (error, data) => {

      if(error) return reject(error);

      const {UploadsList: list, Marker: marker} = data;

      uploads = uploads.concat(list.map(
        item => new Upload({
          vaultName,
          id: item.MultipartUploadId,
          partSize: item.PartSizeInBytes,
          createdAt: item.CreationDate,
          description: item.ArchiveDescription,
        })
      ));

      if(marker) {
        return listUploads({vaultName, marker, uploads, limit})
          .then(resolve);
      }

      resolve(uploads);
    });
  });
}
