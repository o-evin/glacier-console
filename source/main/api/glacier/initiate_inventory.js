import aws from './aws';
import {Retrieval} from '../../../contracts/entities';
import {
  RetrievalType,
  RetrievalAction,
  RetrievalStatus,
} from '../../../contracts/enums';

export default function initiateInventory(vaultName) {

  return new Promise((resolve, reject) => {

    const params = {
      vaultName: vaultName,
      jobParameters: {
        Type: RetrievalType.INVENTORY,
        Description: vaultName,
      },
    };

    aws.initiateJob(params, (error, data) => {
      if(error) return reject(error);

      resolve(new Retrieval({
        id: data.jobId,
        description: vaultName,
        vaultName: vaultName,
        action: RetrievalAction.INVENTORY,
        status: RetrievalStatus.PENDING,
      }));

    });
  });
}
