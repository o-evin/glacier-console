import React from 'react';

import {FetchStatus} from '../../contracts/enums';

export default function FetchSpinner({status}) {

  if(status) {

    if(status === FetchStatus.ERROR) {
      return (
        <div className="p-2 text-xs-center">
          Unable to process your request.
        </div>
      );
    }

    if(status === FetchStatus.FETCHING) {
      return (
        <div className="p-3 text-center">
          <i className="fa fa-spinner fa-pulse fa-lg fa-fw"></i>
        </div>
      );
    }

  }

  return (
    <div className="p-2 text-center">
      Unable to identify the current fetching progress. Please refresh the
      page or contact an administrator.
    </div>
  );

}
