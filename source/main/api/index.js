import https from 'https';
import Aws from 'aws-sdk';

export class Glacier {
  constructor() {
    this.glacier = null;
    const self = this;

    return new Proxy({}, {
      get(target, property) {
        const config = self.getConfig();
        if (!self.glacier || self.glacier.config.region !== config.region) {
          self.glacier = new Aws.Glacier({
            ...config,
            apiVersion: '2012-06-01',
          });
        }
        return self.glacier[property];
      },
    });
  }

  getConfig() {

    const {aws} = global.auth;

    if(!aws) {
      throw new Error('Not authenticated.');
    }

    const agent = new https.Agent();

    return {
      accessKeyId: aws.key,
      secretAccessKey: aws.secret,
      region: aws.region,
      httpOptions: {
        agent,
      },
      sslEnabled: true,
    };
  }
}

export const glacier = new Glacier();
