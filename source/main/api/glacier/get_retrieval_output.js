import aws from './aws';

export default function getRetrievalOutput({retrieval, part}) {

  return new Promise((resolve, reject) => {

    const params = {
      range: part.range,
      jobId: retrieval.id,
      vaultName: retrieval.vaultName,
    };

    aws.getJobOutput(params, (error, data) => {
      if(error) return reject(error);
      resolve(data);
    });
  });
}
