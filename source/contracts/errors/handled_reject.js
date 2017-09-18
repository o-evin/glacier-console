function HandledRejectError(message) {
  this.name = 'HandledRejectError';
  this.message = message || 'Oparation aborted';
  this.stack = (new Error()).stack;
}

HandledRejectError.prototype = Object.create(Error.prototype);
HandledRejectError.prototype.constructor = HandledRejectError;

export default HandledRejectError;
