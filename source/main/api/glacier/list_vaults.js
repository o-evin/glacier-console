import aws from './aws';

import {Vault} from '../../../contracts/entities';

export default function listVaults(marker, vaults = []) {

  return new Promise((resolve, reject) => {

    const params = {
      marker,
    };

    aws.listVaults(params, (error, data) => {

      if(error) return reject(error);

      vaults = vaults.concat(data.VaultList.map(
        item => new Vault({
          arn: item.VaultARN,
          name: item.VaultName,
          createdAt: item.CreationDate,
          sizeInBytes: item.SizeInBytes,
          numberOfArchives: item.NumberOfArchives,
          lastInventoryDate: item.LastInventoryDate,
        })
      ));

      if(data.Marker) {
        return listVaults(data.Marker, vaults)
          .then(resolve);
      }

      resolve(vaults);
    });

  });
}
