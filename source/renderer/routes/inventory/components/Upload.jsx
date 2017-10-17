import cx from 'classnames';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import ActionButton from '../../../controls/ActionButton';

import {Upload} from '../../../../contracts/entities';
import {UploadStatus} from '../../../../contracts/enums';

export default class ViewUpload extends PureComponent {

  static propTypes = {
    upload: PropTypes.instanceOf(Upload),
    onRemove: PropTypes.func.isRequired,
    onRestart: PropTypes.func,
  }

  abort() {
    if(confirm('Are you sure you want to abort this upload?')) {
      return this.props.onRemove(this.props.upload);
    }
  }

  restart() {
    return this.props.onRestart(this.props.upload);
  }

  render() {
    const {completedAt, completion, error, status, title} = this.props.upload;

    return (
      <li className="list-group-item p-1">
        { status !== UploadStatus.DONE && completion > 0 &&
          <div className="progress w-100">
            <div className={cx('progress-bar h-100', {
              'list-group-item-danger': status === UploadStatus.ERROR,
              'list-group-item-info': status === UploadStatus.PROCESSING,
            })} style={{width: completion + '%'}}>
            </div>
          </div>
        }
        <div className="content w-100 d-flex align-items-center text-nowrap">
          <div className="text-truncate px-2 mr-auto" title={title}>
            {title}
          </div>
          <div className="d-flex align-items-center">
            { status === UploadStatus.PROCESSING &&
              <span className="text-primary">
                { completion > 0 ? completion + '%' :
                  <i className="fa fa-spinner fa-pulse fa-lg"/>
                }
              </span>
            }
            { status === UploadStatus.ERROR &&
              <span>
                <i className="fa fa-exclamation-circle fa-lg text-danger"
                  title={error}
                />
                <ActionButton className="btn btn-small btn-secondary ml-2"
                  title="Retry"
                  onClick={this.restart.bind(this)}>
                  <i className="fa fa-refresh" />
                </ActionButton>
              </span>
            }
            { status === UploadStatus.DONE &&
              <span className="text-success">
                <i className="fa fa-clock-o fa-lg ml-2"
                  title={'Uploaded on ' +
                  moment(completedAt).format('D MMM, YYYY HH:mm') + '\n\n' +
                  'This archive has been successfully uploaded and is ' +
                  'pending for a vault inventory. That process may take ' +
                  'up to 24 hours.'}
                />
              </span>
            }
            <ActionButton className="btn btn-small btn-secondary ml-2"
              title="Abort upload" onClick={this.abort.bind(this)}>
              <i className="fa fa-stop" />
            </ActionButton>
          </div>
        </div>
      </li>
    );
  }
}
