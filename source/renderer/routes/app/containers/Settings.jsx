import React, {PureComponent} from 'react';
import {remote} from 'electron';

import Settings from '../components/Settings';
import {Transfer as Defaults} from '../../../../contracts/const';

const config = remote.getGlobal('config');

export default class SettingsContainer extends PureComponent {

  onSubmit(value) {
    return config.set('transfer', value);
  }

  render() {
    const defaults = {
      partSizeInBytes: Defaults.PART_SIZE_IN_BYTES,
      maximumActiveParts: Defaults.ACTIVE_PARTS_LIMIT,
      downloadsPath: remote.app.getPath('downloads'),
    };

    const transferConfig = config.get('transfer', defaults);

    return (
      <Settings
        config={transferConfig}
        onSubmit={this.onSubmit.bind(this)}
      />
    );
  }
}
