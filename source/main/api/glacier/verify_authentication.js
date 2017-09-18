import aws from './aws';

export default function verifyAuthentication() {

  return new Promise((resolve, reject) => {
    aws.getDataRetrievalPolicy((error) => {
      if(error) return reject(error);
      resolve(true);
    });
  });
}
