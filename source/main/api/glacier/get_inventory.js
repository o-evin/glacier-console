import {glacier} from '../';
import {Archive, Inventory} from '../../../contracts/entities';

export default function getInventory(retrieval) {

  return new Promise((resolve, reject) => {

    const params = {
      jobId: retrieval.id,
      vaultName: retrieval.vaultName,
    };

    glacier.getJobOutput(params, (error, response) => {
      if(error) return reject(error);

      const data = JSON.parse(response.body.toString('utf8'));

      let sizeInBytes = 0;

      const archives = data.ArchiveList.map(
        (item) => {
          sizeInBytes += item.Size;
          return new Archive({
            id: item.ArchiveId,
            size: item.Size,
            vaultName: retrieval.vaultName,
            checksum: item.SHA256TreeHash,
            createdAt: item.CreationDate,
            description: item.ArchiveDescription,
          });
        }
      );

      const inventory = new Inventory({
        archives,
        sizeInBytes,
        vaultName: retrieval.vaultName,
        createdAt: data.InventoryDate,
        numberOfArchives: archives.length,
      });

      resolve(inventory);

    });
  });
}
