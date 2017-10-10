import React from 'react';
import PropTypes from 'prop-types';
import bytes from 'byte-size';
import {remote} from 'electron';

import ActionButton from '../../../controls/ActionButton';

import {Component} from '../../../helpers';
import {Size} from '../../../../contracts/const';

export default class Settings extends Component {

  static propTypes = {
    config: PropTypes.object.isRequired,
    defaults: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    const {config} = props;

    this.state = {
      partSize: config.partSizeInBytes / Size.MEGABYTE_IN_BYTES,
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
      partSizeInBytes: powerSize * Size.MEGABYTE_IN_BYTES,
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
    const {defaults} = this.props;
    const {partSize, activeParts, downloadsPath} = this.state;

    return (
      <div className="container-fluid">
        <div className="card mt-3">
          <h3 className="card-header">Transfer settings</h3>
          <div className="card-block p-3">
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
                    4096 MB. Default is
                    {bytes(defaults.partSizeInBytes).toString()}.
                  </small>
                </div>
              </div>
              <div className="form-group row">
                <label className="col-sm-6 col-form-label">
                  Maximum active parts
                </label>
                <div className="col-sm-6 py-3">
                  <input type="number" className="form-control"
                    min="1" max="9999" step="1" required
                    value={activeParts}
                    onChange={super.onChange('activeParts')}
                  />
                  <small className="form-text text-muted">
                    Maximum parts for all concurrent archive transfers
                    to upload in parallel.
                    Default is {defaults.maximumActiveParts}.
                  </small>
                </div>
              </div>
              <div className="col-md-6 ml-md-auto px-3 pt-1">
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
          <div className="card-block p-3">
            <div className="col-lg-6" >
              <div className="form-group row">
                <label className="col-sm-6 col-form-label">
                  Downloads
                </label>
                <div className="col-sm-6 py-3">
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
                    Default is {defaults.downloadsPath}.
                  </small>
                </div>
              </div>
              <div className="col-md-6 ml-md-auto px-3 pt-1">
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
