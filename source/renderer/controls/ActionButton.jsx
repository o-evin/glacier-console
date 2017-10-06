import cx from 'classnames';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

export default class ActionButton extends PureComponent {

  static defaultProps = {
    animate: false,
    animationTimeout: 500,
    statusResetTimeout: 3000,
  }

  static propTypes = {
    animate: PropTypes.bool,
    animationTimeout: PropTypes.number,
    statusResetTimeout: PropTypes.number,
  }

  static initialState = {
    isProcessing: false,
    isSuccess: false,
    isFailure: false,
  }

  constructor(props) {
    super(props);
    this.state = ActionButton.initialState;
  }

  waitAnimation() {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, this.props.animationTimeout);
    });
  }

  resetState() {
    if(this.mounted) {
      this.setState(ActionButton.initialState);
    }
  }

  showSuccess() {
    if(this.mounted) {
      this.setState({
        isSuccess: true,
        isProcessing: false,
      });
    }
  }

  showFailure() {
    if(this.mounted) {
      this.setState({
        isFailure: true,
        isProcessing: false,
      });
    }
  }

  clickHandler(event) {

    if(this.state.isProcessing) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }

    this.setState({
      isProcessing: true,
    });

    return Promise.all([
      Promise.resolve(
        this.props.onClick(event)
      ),
      this.waitAnimation(),
    ])
      .then(([data]) => {
        this.props.animate ? this.showSuccess() : this.resetState();
        return Promise.resolve(data);
      })
      .catch((error) => {
        this.props.animate ? this.showFailure() : this.resetState();
      });
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentDidUpdate() {
    const {isSuccess, isFailure} = this.state;
    if(this.props.animate && (isSuccess || isFailure)) {
      setTimeout(this.resetState.bind(this), this.props.statusResetTimeout);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  render() {

    const {
      children,
      className,
      animate,              // eslint-disable-line no-unused-vars
      statusResetTimeout,   // eslint-disable-line no-unused-vars
      animationTimeout,     // eslint-disable-line no-unused-vars
      onClick,              // eslint-disable-line no-unused-vars
      ...props
    } = this.props;

    const {isProcessing, isSuccess, isFailure} = this.state;

    return (
      <button
        {...props}
        className={cx('btn-action', className, {
          'action-processing': isProcessing,
          'btn-success action-success': isSuccess,
          'btn-danger action-failure': isFailure,
        })}
        onClick={this.clickHandler.bind(this)}>
        <div className="action-status processing">
          <i className="fa fa-spinner fa-pulse" />
        </div>
        <div className="action-status failure">
          <i className="fa fa-exclamation-triangle fa-lg" />
        </div>
        <div className="action-status success">
          <i className="fa fa-check-square-o fa-lg" />
        </div>
        {
          isProcessing || isSuccess || isFailure ?
            <div className="invisible">{children}</div>
            :
            children
        }
      </button>
    );
  }
}
