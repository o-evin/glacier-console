import aws from './aws';

import {Retrieval} from '../../../contracts/entities';
import {RetrievalStatus} from '../../../contracts/enums';


export default function listRetrievals(vault, marker, retrievals = []) {

  return new Promise((resolve, reject) => {

    const params = {
      marker,
      vaultName: vault.name,
    };

    aws.listJobs(params, (error, data) => {
      if(error) return reject(error);

      retrievals = retrievals.concat(data.JobList.map(
        item => new Retrieval({
          id: item.JobId,
          action: item.Action,
          archiveId: item.ArchiveId,
          archiveSize: item.ArchiveSizeInBytes,
          checksum: item.SHA256TreeHash,
          createdAt: item.CreationDate,
          completedAt: item.CompletionDate,
          description: item.JobDescription,
          tier: item.Tier,
          vaultName: vault.name,
          error: item.StatusMessage,
          status: RetrievalStatus.fromCode(item.StatusCode),
        })
      ));

      if(data.Marker) {
        return listRetrievals(vault, data.Marker, retrievals)
          .then(resolve);
      }

      resolve(retrievals);
    });
  });
}
