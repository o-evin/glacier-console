import aws from './aws';

import {Retrieval} from '../../../contracts/entities';
import {
  RetrievalType,
  RetrievalAction,
  RetrievalStatus,
} from '../../../contracts/enums';

export default function initiateRetrieval({vaultName, archiveId, filePath,
  description, tier, partSize, archiveSize, checksum}) {

  if(!partSize || partSize <= 0) {
    throw new Error('Part size is required.');
  }

  if(!archiveSize || archiveSize <= 0) {
    throw new Error('Archive size is required.');
  }

  if(!archiveId || archiveId.length <= 0) {
    throw new Error('Archive ID is required.');
  }

  if(!checksum || checksum.length <= 0) {
    throw new Error('Archive checksum is required.');
  }

  return new Promise((resolve, reject) => {

    const params = {
      vaultName,
      jobParameters: {
        Tier: tier,
        ArchiveId: archiveId,
        Description: description,
        Type: RetrievalType.ARCHIVE,
      },
    };

    aws.initiateJob(params, (error, data) => {
      if(error) return reject(error);

      resolve(new Retrieval({
        tier,
        archiveId,
        vaultName,
        partSize,
        filePath,
        checksum,
        archiveSize,
        description,
        id: data.jobId,
        action: RetrievalAction.ARCHIVE,
        status: RetrievalStatus.PENDING,
      }));


    });
  });
}
