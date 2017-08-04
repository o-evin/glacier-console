import {glacier} from '../';
import {Upload} from '../../../contracts/entities';
import {UploadStatus} from '../../../contracts/enums';


export default function completeUpload(upload) {

  return new Promise((resolve, reject) => {

    const params = {
      uploadId: upload.id,
      checksum: upload.checksum,
      vaultName: upload.vaultName,
      archiveSize: upload.archiveSize.toString(),
    };

    glacier.completeMultipartUpload(params, (error, data) => {
      if(error) return reject(error);

      resolve(
        new Upload({
          ...upload,
          archiveId: data.archiveId,
          checksum: data.checksum,
          location: data.location,
          status: UploadStatus.DONE,
          completedAt: new Date(),
        })
      );
    });
  });
}
