import {glacier} from '../';
import {Retrieval} from '../../../contracts/entities';
import {
  RetrievalType,
  RetrievalAction,
  RetrievalStatus,
} from '../../../contracts/enums';

export default function initiateInventory(vault) {

  return new Promise((resolve, reject) => {

    const params = {
      vaultName: vault.name,
      jobParameters: {
        Type: RetrievalType.INVENTORY,
        Description: vault.name,
      },
    };

    glacier.initiateJob(params, (error, data) => {
      if(error) return reject(error);

      resolve(new Retrieval({
        id: data.jobId,
        description: vault.name,
        vaultName: vault.name,
        action: RetrievalAction.INVENTORY,
        status: RetrievalStatus.PENDING,
      }));

    });
  });
}
