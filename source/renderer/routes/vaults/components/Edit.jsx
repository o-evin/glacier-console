import React from 'react';
import PropTypes from 'prop-types';
import {Prompt} from 'react-router-dom';

import ActionButton from '../../../controls/ActionButton';

import {Component} from '../../../helpers';
import {Vault} from '../../../../contracts/entities';

export default class EditVault extends Component {

  static propTypes = {
    isEdit: PropTypes.bool.isRequired,
    value: PropTypes.instanceOf(Vault).isRequired,
    onSubmit: PropTypes.func.isRequired,
    onValidationError: PropTypes.func.isRequired,
  }

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.object.isRequired,
    }),
  };

  constructor(props) {
    super(props);

    const vault = new Vault(props.value);

    this.state = {
      ...vault,
    };
  }

  onSubmit(event) {
    event.preventDefault();

    try {
      var value = new Vault(this.state);
    } catch (error) {
      return this.props.onValidationError(error);
    }

    return this.props.onSubmit(value);
  }

  onCancel() {
    const {isEdit, value} = this.props;
    this.context.router.history.push('/vaults/' + (isEdit ? value.id : ''));
  }

  hasChanges() {
    const {value, isEdit} = this.props;
    return isEdit && !value.equal(Vault.parse(this.state));
  }

  render() {

    const {isEdit} = this.props;

    const {
      name,
      email,
    } = this.state;

    return (
      <div className="container-fluid mt-3">
        <Prompt
          when={this.hasChanges()}
          message={'You have unsaved changes on this page. Do you want to ' +
            'leave this page and discard your changes or stay on this page?'}
        />

        <h4>{isEdit ? 'Edit' : 'New'} vault</h4>

        <div className="form-md mt-3" >

          <div className="form-group row">
            <label className="col-sm-3 col-form-label">
              Name
            </label>
            <div className="col-sm-9">
              { isEdit ?
                <p className="form-control-static">{name}</p> :
                <div>
                  <input className="form-control" min="1" max="255"
                    required pattern="[\w\-.]+"
                    type="text" value={name || ''}
                    onChange={this.onChange('name')}
                    placeholder="Name"
                  />
                  <small className="form-text text-muted">
                    Allowed characters are a-z, A-Z, 0-9, '_' (underscore),
                    '-' (hyphen), and '.' (period).
                  </small>
                </div>
              }
            </div>
          </div>
          <div className="form-group row" hidden="true">
            <label className="col-sm-3 col-form-label">
              Notification Email
            </label>
            <div className="col-sm-9">
              <input className="form-control" type="email"
                value={email || ''} onChange={this.onChange('email')}
                placeholder="Email"
              />
              <small className="form-text text-muted">
                An Amazon Glacier retrieval job request is executed
                asynchronously. You must wait until Amazon Glacier completes
                the job before you can get its output. Specify the email
                address to get notified when Archive or Inventory retrieval
                completes.
              </small>
            </div>
          </div>

          <div className="form-group row">
            <div className="col-sm-9 ml-sm-auto py-3">
              <ActionButton animate={true} onClick={this.onSubmit.bind(this)}
                className="btn btn-primary">
                {isEdit ? 'Update' : 'Create'}
              </ActionButton>
              <button className="btn btn-secondary ml-2" type="button"
                onClick={this.onCancel.bind(this)}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
