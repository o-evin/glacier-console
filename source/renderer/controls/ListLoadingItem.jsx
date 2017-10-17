import React, {PureComponent} from 'react';

export default class ListLoadingItem extends PureComponent {
  render() {
    return (
      <li className="list-group-item p-1">
        <div className="content">
          <div className="p-2 text-center">
            <i className="fa fa-spinner fa-pulse" />
          </div>
        </div>
      </li>
    );
  }
}
