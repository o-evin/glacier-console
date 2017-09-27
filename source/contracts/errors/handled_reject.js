function HandledRejectionError(message) {
  this.name = 'HandledRejectionError';
  this.message = message || 'Operation cancelled';
  this.stack = (new Error()).stack;
}

HandledRejectionError.prototype = Object.create(Error.prototype);
HandledRejectionError.prototype.constructor = HandledRejectionError;

export default HandledRejectionError;
