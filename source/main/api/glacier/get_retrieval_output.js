import aws from './aws';

export default function getRetrievalOutput({retrieval, part}) {

  return new Promise((resolve, reject) => {

    const params = {
      jobId: retrieval.id,
      range: part.range,
      vaultName: retrieval.vaultName,
    };

    aws.getJobOutput(params, (error, data) => {
      if(error) return reject(error);
      resolve(data);
    });
  });
}
