import aws from './aws';
import {Vault} from '../../../contracts/entities';

export default function describeVault(vaultName) {

  return new Promise((resolve, reject) => {

    aws.describeVault({vaultName}, (error, data) => {
      if(error) return reject(error);

      const vault = new Vault({
        name: data.VaultName,
        createdAt: data.CreationDate,
        sizeInBytes: data.SizeInBytes,
        numberOfArchives: data.NumberOfArchives,
        lastInventoryDate: data.LastInventoryDate,
      });

      resolve(vault);
    });

  });
}
