import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If already in ResponseDto format, return as is
        if (data instanceof ResponseDto) {
          return data;
        }

        // Otherwise, wrap in success response
        return ResponseDto.success(data);
      }),
    );
  }
}

