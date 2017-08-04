import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import ActionButton from '../../../controls/ActionButton';

import {
  RetrievalStatus,
} from '../../../../contracts/enums';

import {
  Retrieval,
} from '../../../../contracts/entities';

export default class ViewRetrieval extends PureComponent {

  static propTypes = {
    stats: PropTypes.array,
    prefix: PropTypes.string,
    value: PropTypes.instanceOf(Retrieval),
    onShow: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    onRestart: PropTypes.func.isRequired,
  }

  removeArchive(archive) {
    if(confirm('Are you sure you want to delete this archive?')) {
      return this.props.onRemove(archive);
    }
  }

  removeRetrieval(retrieval) {
    if(confirm('Are you sure you want to cancel this retrieval operation?')) {
      return this.props.onRemove(retrieval);
    }
  }

  renderPending(retrieval) {
    const {status} = retrieval;

    const {prefix} = this.props;
    const description = prefix ?
      retrieval.description.slice(prefix.length + 1) :
      retrieval.description;

    return (
      <li className="list-group-item p-1">
        <div className="content w-100 d-flex align-items-center">
          <div title={description}
            className="description p-2 mr-auto">
            {description}
          </div>
          <div className="actions">
            {status !== RetrievalStatus.PENDING &&
              <span className="p-2 align-middle mr-2">
                <i className="fa fa-refresh fa-spin fa-lg text-primary"/>
              </span>
            }
            {status === RetrievalStatus.PENDING &&
              <span className="align-middle">
                <i className="fa fa-clock-o fa-lg ml-2 text-warning" title={
                  'This retrieval has been successfully submitted and is ' +
                  'awaiting for a data preparation. The process will resume ' +
                  'once the data is ready.'}
                />
              </span>
            }
            {status === RetrievalStatus.PENDING &&
              <ActionButton className="btn btn-small btn-secondary ml-2"
                title="Abort retrieval"
                onClick={this.removeRetrieval.bind(this, retrieval)}>
                <i className="fa fa-stop text-muted" />
              </ActionButton>
            }
          </div>
        </div>
      </li>
    );
  }

  renderProcessing(retrieval, stats) {

    const {prefix} = this.props;
    const description = prefix ?
      retrieval.description.slice(prefix.length + 1) :
      retrieval.description;

    const {archiveSize, partSize} = retrieval;

    const doneParts = stats ? stats.length : 0;
    const totalParts = Math.ceil(archiveSize / partSize);
    const completion = Math.round((doneParts / totalParts) * 100);

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
              title="Abort retrieval"
              onClick={this.removeRetrieval.bind(this, retrieval)} >
              <i className="fa fa-stop text-muted" />
            </ActionButton>
          </div>
        </div>
      </li>
    );
  }

  renderError(retrieval, stats) {
    const {prefix} = this.props;
    const description = prefix ?
      retrieval.description.slice(prefix.length + 1) :
      retrieval.description;

    const {archiveSize, partSize, error} = retrieval;

    const doneParts = stats ? stats.length : 0;
    const totalParts = Math.ceil(archiveSize / partSize);
    const completion = Math.round((doneParts / totalParts) * 100);

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
            <span className="p-2 d-inline-block align-middle text-primary">
              {completion + ' %'}
            </span>
            <span className="p-2 d-inline-block align-middle" title={error}>
              <i className="fa fa-exclamation-circle fa-lg text-danger" />
            </span>
            <button className="btn btn-small btn-secondary ml-2"
              title="Retry"
              onClick={this.props.onRestart.bind(this, retrieval)}>
              <i className="fa fa-refresh text-muted" />
            </button>
            <ActionButton className="btn btn-small btn-secondary ml-2"
              title="Abort retrieval"
              onClick={this.removeRetrieval.bind(this, retrieval)}>
              <i className="fa fa-stop text-muted" />
            </ActionButton>
          </div>
        </div>
      </li>
    );
  }

  renderFinished(retrieval) {
    const {prefix} = this.props;
    const description = prefix ?
      retrieval.description.slice(prefix.length + 1) :
      retrieval.description;

    return (
      <li className="list-group-item p-1">
        <div className="progress w-100">
          <div className="progress-bar w-100 h-100 list-group-item-success" />
        </div>
        <div className="content w-100 d-flex">
          <div title={description}
            className="description p-2 align-self-center mr-auto">
            {description}
          </div>
          <div className="actions">
            <button className="btn btn-small btn-secondary ml-2"
              title="View archive"
              onClick={this.props.onShow.bind(this, retrieval)}>
              <i className="fa fa-folder-open text-muted" />
            </button>
          </div>
        </div>
      </li>
    );
  }

  render() {

    const {value, stats} = this.props;

    if(value.status === RetrievalStatus.PROCESSING) {
      return this.renderProcessing(value, stats);
    } else if(value.status === RetrievalStatus.DONE) {
      return this.renderFinished(value);
    } else if(value.status === RetrievalStatus.ERROR) {
      return this.renderError(value, stats);
    }

    return this.renderPending(value);

  }
}
