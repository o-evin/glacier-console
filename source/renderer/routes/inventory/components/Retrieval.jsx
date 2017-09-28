import cx from 'classnames';
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
    prefix: PropTypes.string,
    retrieval: PropTypes.instanceOf(Retrieval),
    onShow: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    onRestart: PropTypes.func.isRequired,
  }

  remove() {
    if(confirm('Are you sure you want to cancel this retrieval operation?')) {
      return this.props.onRemove(this.props.retrieval);
    }
  }

  restart() {
    return this.props.onRestart(this.props.retrieval);
  }

  show() {
    return this.props.onShow(this.props.retrieval);
  }

  render() {
    const {prefix, retrieval} = this.props;
    const {completion, error, status, description} = retrieval;
    const title = description.slice(prefix.length);

    return (
      <li className="list-group-item p-1">
        { status !== RetrievalStatus.DONE && completion > 0 &&
          <div className="progress w-100">
            <div className={cx('progress-bar h-100', {
              'list-group-item-danger': status === RetrievalStatus.ERROR,
              'list-group-item-info': status === RetrievalStatus.PROCESSING,
            })} style={{width: completion + '%'}}>
            </div>
          </div>
        }
        <div className="content w-100 d-flex">
          <div className="description p-2 align-self-center mr-auto"
            title={title}>{title}</div>
          <div className="text-nowrap">
            { status === RetrievalStatus.PROCESSING &&
              <span className="p-2 d-inline-block align-middle text-primary">
                { completion > 0 ? `${completion} %` :
                  <i className="fa fa-spinner fa-spin fa-lg"/>
                }
              </span>
            }
            { status === RetrievalStatus.PENDING &&
              <span className="align-middle">
                <i className="fa fa-clock-o fa-lg ml-2 text-warning" title={
                  'This retrieval has been successfully submitted and is ' +
                  'awaiting for its data preparation. The process will ' +
                  'resume once the data is ready.'}
                />
              </span>
            }
            { status === RetrievalStatus.ERROR &&
              <span>
                <span className="p-2 d-inline-block align-middle" title={error}>
                  <i className="fa fa-exclamation-circle fa-lg text-danger" />
                </span>
                <button className="btn btn-small btn-secondary ml-2"
                  title="Retry" onClick={this.restart.bind(this)}>
                  <i className="fa fa-refresh text-muted" />
                </button>
              </span>
            }
            { status === RetrievalStatus.DONE &&
              <button className="btn btn-small btn-secondary ml-2"
                title="View archive"
                onClick={this.show.bind(this)}>
                <i className="fa fa-folder-open text-muted" />
              </button>
            }
            <ActionButton className="btn btn-small btn-secondary ml-2"
              title="Abort retrieval" onClick={this.remove.bind(this)}>
              <i className="fa fa-stop text-muted" />
            </ActionButton>
          </div>
        </div>
      </li>
    );
  }

}
