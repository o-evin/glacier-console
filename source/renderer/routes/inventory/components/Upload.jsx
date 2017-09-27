import moment from 'moment';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import ActionButton from '../../../controls/ActionButton';

import {Upload} from '../../../../contracts/entities';
import {UploadStatus} from '../../../../contracts/enums';

export default class ViewUpload extends PureComponent {

  static propTypes = {
    prefix: PropTypes.string,
    value: PropTypes.instanceOf(Upload),
    onRemove: PropTypes.func.isRequired,
    onRestart: PropTypes.func,
  }

  restart(upload) {
    return this.props.onRestart(upload);
  }

  abort(upload) {
    if(confirm('Are you sure you want to abort this upload?')) {
      return this.props.onRemove(upload);
    }
  }

  remove(entry) {
    if(confirm('Are you sure you want to delete this upload?')) {
      return this.props.onRemove(entry);
    }
  }

  renderPending(upload) {
    const {prefix} = this.props;
    const description = prefix ?
      upload.description.slice(prefix.length + 1) :
      upload.description;

    return (
      <li className="list-group-item p-1">
        <div className="content w-100 d-flex">
          <div title={description}
            className="description p-2 align-self-center mr-auto">
            {description}
          </div>
          <div className="actions">
            <span className="p-2 d-inline-block align-middle">
              <i className="fa fa-refresh fa-spin fa-lg text-primary"/>
            </span>
            {upload.status === UploadStatus.PROCESSING &&
              <ActionButton
                className="btn btn-small btn-secondary ml-2"
                title="Delete archive"
                onClick={this.abort.bind(this, upload)}>
                <i className="fa fa-stop text-muted" />
              </ActionButton>
            }
          </div>
        </div>
      </li>
    );
  }

  renderFinished(upload) {
    const {completedAt} = upload;

    const {prefix} = this.props;
    const description = prefix ?
      upload.description.slice(prefix.length + 1) :
      upload.description;

    return (
      <li className="list-group-item p-1">
        <div className="content w-100 d-flex align-items-center">
          <div title={description}
            className="description p-2 mr-auto">
            {description}
          </div>
          <div className="actions">
            <span className="align-middle">
              <i className="fa fa-clock-o fa-lg ml-2 text-success"  title={
                'Uploaded on ' +
                moment(completedAt).format('D MMM, YYYY HH:mm') + '\n\n' +
                'This archive has been successfully uploaded and is pending ' +
                'for a vault inventory. That process may take up to 24 hours.'}
              />
            </span>
            <ActionButton className="btn btn-small btn-secondary ml-2"
              title="Delete archive"
              onClick={this.remove.bind(this, upload)}>
              <i className="fa fa-trash text-muted" />
            </ActionButton>
          </div>
        </div>
      </li>
    );
  }

  renderError(upload) {

    const {prefix} = this.props;

    const description = prefix ?
      upload.description.slice(prefix.length + 1) :
      upload.description;

    const {error, completion} = upload;

    return (
      <li className="list-group-item p-1" title={error}>
        <div className="progress w-100">
          <div style={{width: completion + '%'}}
            className="progress-bar h-100 list-group-item-danger">
          </div>
        </div>
        <div className="content w-100 d-flex">
          <div title={description}
            className="description p-2 align-self-center mr-auto">
            {description}
          </div>
          <div className="actions">
            <span className="p-2 align-middle d-inline-block text-primary">
              {completion + ' %'}
            </span>
            <span className="p-2 d-inline-block align-middle" title={error}>
              <i className="fa fa-exclamation-circle fa-lg text-danger" />
            </span>
            <ActionButton className="btn btn-small btn-secondary ml-2"
              title="Retry"
              onClick={this.restart.bind(this, upload)}>
              <i className="fa fa-refresh text-muted" />
            </ActionButton>
            <ActionButton className="btn btn-small btn-secondary ml-2"
              title="Abort upload"
              onClick={this.abort.bind(this, upload)}>
              <i className="fa fa-stop text-muted" />
            </ActionButton>
          </div>
        </div>
      </li>
    );
  }

  renderProcessing(upload) {

    const {prefix} = this.props;

    const description = prefix ?
      upload.description.slice(prefix.length + 1) :
      upload.description;

    const {completion} = upload;

    return (
      <li className="list-group-item p-1">
        <div className="progress w-100">
          <div style={{width: completion + '%'}}
            className="progress-bar h-100 list-group-item-info">
          </div>
        </div>
        <div className="content w-100 d-flex">
          <div title={description}
            className="description p-2 align-self-center mr-auto">
            {description}
          </div>
          <div className="actions">
            <span className="p-2 d-inline-block align-middle text-primary">
              {completion + ' %'}
            </span>
            <ActionButton className="btn btn-small btn-secondary ml-2"
              title="Abort upload"
              onClick={this.abort.bind(this, upload)} >
              <i className="fa fa-stop text-muted" />
            </ActionButton>
          </div>
        </div>
      </li>
    );
  }

  render() {

    const {value} = this.props;

    if(value.status === UploadStatus.DONE) {
      return this.renderFinished(value);
    } else if(value.status === UploadStatus.ERROR) {
      return this.renderError(value);
    } else if(value.status === UploadStatus.PROCESSING) {
      if(value.completion > 0) {
        return this.renderProcessing(value);
      }
    }

    return this.renderPending(value);
  }

}
