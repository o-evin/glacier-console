import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import {
  removeUpload,
  restartUpload,
} from '../../../modules/uploads/actions';

import {
  removeRetrieval,
  restartRetrieval,
} from '../../../modules/retrievals/actions';

import {Upload} from '../../../../contracts/entities';

import ListOperations from '../components/List';

class OperationsContainer extends PureComponent {

  remove(operation) {
    if(operation instanceof Upload) {
      return this.props.removeUpload(operation);
    } else {
      return this.props.removeRetrieval(operation);
    }
  }

  restart(operation) {
    if(operation instanceof Upload) {
      return this.props.restartUpload(operation);
    } else {
      return this.props.restartRetrieval(operation);
    }
  }

  render() {

    const {uploads, retrievals} = this.props;

    return (
      <ListOperations
        uploads={uploads}
        retrievals={retrievals}
        onRemove={this.remove.bind(this)}
        onRestart={this.restart.bind(this)}
      />
    );
  }
}

function mapStateToProps(state) {
  const {list: uploads} = state.uploads;
  const {list: retrievals} = state.retrievals;
  return {uploads, retrievals};
}

export default connect(
  mapStateToProps,
  {
    removeUpload,
    restartUpload,
    removeRetrieval,
    restartRetrieval,
  }
)(OperationsContainer);
