import {glacier} from '../';

export default function verifyAuthentication() {

  return new Promise((resolve, reject) => {

    glacier.getDataRetrievalPolicy((error) => {
      if(error) return reject(error);
      resolve(true);
    });

  });
}
