export class ChainlinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChainlinkError';
  }
}

export class InvalidCredentialsError extends ChainlinkError {
  constructor(message: string = 'Invalid API credentials') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

export class SignatureMismatchError extends ChainlinkError {
  constructor(message: string = 'Signature verification failed') {
    super(message);
    this.name = 'SignatureMismatchError';
  }
}

export class TimestampOutOfSyncError extends ChainlinkError {
  constructor(message: string = 'Timestamp is out of sync with server') {
    super(message);
    this.name = 'TimestampOutOfSyncError';
  }
}

export class InvalidResponseError extends ChainlinkError {
  constructor(message: string = 'Invalid response from server') {
    super(message);
    this.name = 'InvalidResponseError';
  }
}

export class WebSocketError extends ChainlinkError {
  constructor(message: string) {
    super(message);
    this.name = 'WebSocketError';
  }
}

export class ConnectionError extends ChainlinkError {
  constructor(message: string = 'Failed to establish connection') {
    super(message);
    this.name = 'ConnectionError';
  }
}