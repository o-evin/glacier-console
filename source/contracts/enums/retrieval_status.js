import * as RetrievalStatusCode from './retrieval_status_code';

export const DONE = 'DONE';
export const PENDING = 'PENDING';
export const PROCESSING = 'PROCESSING';
export const ERROR = 'ERROR';

export function fromCode(code) {
  switch (code) {
    case RetrievalStatusCode.IN_PROGRESS:
      return PENDING;
    case RetrievalStatusCode.SUCCEEDED:
      return PROCESSING;
    case RetrievalStatusCode.FAILED:
      return ERROR;
    default:
      return ERROR;
  }
}
