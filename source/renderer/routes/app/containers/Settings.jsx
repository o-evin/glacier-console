import React, {PureComponent} from 'react';
import {remote} from 'electron';

import Settings from '../components/Settings';

const config = remote.getGlobal('config');

export default class SettingsContainer extends PureComponent {

  onSubmit(value) {
    return config.set('transfer', value);
  }

  render() {

    const transferConfig = config.get('transfer');

    return (
      <Settings
        config={transferConfig}
        defaults={config.defaults.transfer}
        onSubmit={this.onSubmit.bind(this)}
      />
    );
  }
}
