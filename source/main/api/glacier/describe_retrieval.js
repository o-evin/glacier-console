import aws from './aws';
import {Retrieval} from '../../../contracts/entities';
import {RetrievalStatus} from '../../../contracts/enums';

export default function describeRetrieval(retrieval) {

  return new Promise((resolve, reject) => {

    const params = {
      jobId: retrieval.id,
      vaultName: retrieval.vaultName,
    };

    aws.describeJob(params, (error, data) => {
      if(error) return reject(error);

      resolve(new Retrieval({
        id: data.JobId,
        action: data.Action,
        archiveId: data.ArchiveId,
        archiveSize: data.ArchiveSizeInBytes,
        checksum: data.SHA256TreeHash,
        createdAt: data.CreationDate,
        completedAt: data.CompletionDate,
        description: data.JobDescription,
        tier: data.Tier,
        partSize: retrieval.partSize,
        vaultName: retrieval.vaultName,
        filePath: retrieval.filePath,
        error: data.StatusMessage,
        status: RetrievalStatus.fromCode(data.StatusCode),
      }));

    });
  });
}
