function QueueRejectError(message) {
  this.name = 'QueueRejectError';
  this.message = message || 'Queue is not operational at the moment';
  this.stack = (new Error()).stack;
}

QueueRejectError.prototype = Object.create(Error.prototype);
QueueRejectError.prototype.constructor = QueueRejectError;

export default QueueRejectError;
