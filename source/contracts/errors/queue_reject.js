function QueueRejectError(message) {
  this.name = 'QueueRejectError';
  this.message = message || 'The queue is not ready to process your request ' +
    'at this moment.';
}

QueueRejectError.prototype = new Error();
QueueRejectError.prototype.constructor = QueueRejectError;

export default QueueRejectError;
