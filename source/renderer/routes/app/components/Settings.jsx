import React from 'react';
import PropTypes from 'prop-types';
import bytes from 'bytes';
import {remote} from 'electron';

import ActionButton from '../../../controls/ActionButton';

import Component from '../../../helpers/component';
import {Transfer as Defaults, Size} from '../../../../contracts/const';

export default class Settings extends Component {

  static propTypes = {
    config: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    const {config} = props;

    this.state = {
      partSize: config.partSizeInBytes / Size.BYTES_IN_MEGABYTE,
      activeParts: config.maximumActiveParts,
      downloadsPath: config.downloadsPath,
    };
  }

  saveTransfer() {
    const size = parseInt(this.state.partSize);
    const log = Math.log(size) / Math.log(2);
    const powerSize = Math.pow(2, Math.round(log));

    if(size !== powerSize) {
      if(confirm('The part size must be a megabyte multiplied by a power ' +
        `of 2. Please confirm to use ${powerSize} MB  or cancel to ` +
        'discard the change.')) {
        this.setState({partSize: powerSize});
      } else {
        return false;
      }
    }

    return this.props.onSubmit({
      ...this.props.config,
      maximumActiveParts: this.state.activeParts,
      partSizeInBytes: powerSize * Size.BYTES_IN_MEGABYTE,
    });
  }

  savePaths() {
    return this.props.onSubmit({
      ...this.props.config,
      downloadsPath: this.state.downloadsPath,
    });
  }

  openDirectoryBrowser(event) {
    event.preventDefault();
    remote.dialog.showOpenDialog({properties: [
      'openDirectory',
      'createDirectory',
    ]}, (params) => {
      if(params && params.length > 0) {
        this.setState({downloadsPath: params[0]});
      }
    });
  }

  render() {

    const {partSize, activeParts, downloadsPath} = this.state;

    return (
      <div className="container-fluid">
        <div className="card mt-3">
          <h3 className="card-header">Transfer settings</h3>
          <div className="card-block">
            <div className="col-lg-6" >
              <div className="form-group row">
                <label className="col-sm-6 col-form-label">
                  Part Size (MB)
                </label>
                <div className="col-sm-6">
                  <input type="number" className="form-control"
                    min="1" max="4096" step="1" required
                    value={partSize}
                    onChange={super.onChange('partSize')}
                  />
                  <small className="form-text text-muted">
                    The part size must be a megabyte multiplied by a power of 2.
                    For example, 1 MB, 2 MB, 4 MB, 8 MB, and so on.
                    The minimum allowable part size is 1 MB, and the maximum is
                    4096 MB. Default is {bytes(Defaults.PART_SIZE_IN_BYTES)}.
                  </small>
                </div>
              </div>
              <div className="form-group row">
                <label className="col-sm-6 col-form-label">
                  Maximum active parts
                </label>
                <div className="col-sm-6">
                  <input type="number" className="form-control"
                    min="1" max="9999" step="1" required
                    value={activeParts}
                    onChange={super.onChange('activeParts')}
                  />
                  <small className="form-text text-muted">
                    Maximum parts for all concurrent archive transfers
                    to upload in parallel.
                    Default is {Defaults.ACTIVE_PARTS_LIMIT}.
                  </small>
                </div>
              </div>
              <div className="offset-sm-6 px-3 pt-1">
                <ActionButton animate={true}
                  onClick={this.saveTransfer.bind(this)}
                  className="btn btn-primary" type="button">
                  Save
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
        <div className="card mt-3">
          <h3 className="card-header">Paths</h3>
          <div className="card-block">
            <div className="col-lg-6" >
              <div className="form-group row">
                <label className="col-sm-6 col-form-label">
                  Downloads
                </label>
                <div className="col-sm-6">
                  <div className="input-group">
                    <input type="text"
                      className="form-control" required
                      value={downloadsPath}
                      onChange={super.onChange('downloadsPath')}
                    />
                    <span className="input-group-btn">
                      <button className="btn btn-secondary" type="button"
                        onClick={this.openDirectoryBrowser.bind(this)}>
                        Select
                      </button>
                    </span>
                  </div>
                  <small className="form-text text-muted">
                    Downloaded archives are automatically saved
                    in the Downloads folder.
                    Default is {remote.app.getPath('downloads')}.
                  </small>
                </div>
              </div>
              <div className="offset-sm-6 px-3 pt-1">
                <ActionButton animate={true}
                  onClick={this.savePaths.bind(this)}
                  className="btn btn-primary" type="button">
                  Save
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
