export interface ApiResponse<T = any> {
  status: '1' | '0';
  message: string;
  result: T | null;
}

export interface ApiError {
  status: '0';
  message: string;
  result: null;
  error?: {
    code: string;
    details?: any;
  };
}

export class ResponseDto<T> {
  status: '1' | '0';
  message: string;
  result: T | null;

  constructor(status: '1' | '0', result: T | null, message = 'OK') {
    this.status = status;
    this.message = message;
    this.result = result;
  }

  static success<T>(result: T, message = 'OK'): ResponseDto<T> {
    return new ResponseDto('1', result, message);
  }

  static error(message: string, result: null = null): ResponseDto<null> {
    return new ResponseDto('0', result, message);
  }
}

