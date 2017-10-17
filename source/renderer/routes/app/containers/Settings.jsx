import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {remote} from 'electron';

import Settings from '../components/Settings';

const config = remote.getGlobal('config');

export default class SettingsContainer extends PureComponent {

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.object.isRequired,
    }),
  };

  onSubmit(value) {
    return config.set('transfer', value);
  }

  onCancel() {
    this.context.router.history.goBack();
  }

  render() {

    const transferConfig = config.get('transfer');

    return (
      <Settings
        config={transferConfig}
        defaults={config.defaults.transfer}
        onSubmit={this.onSubmit.bind(this)}
        onCancel={this.onCancel.bind(this)}
      />
    );
  }
}
