import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

type JwtAuthPayload = {
  sub?: string;
  id?: string;
  role?: string;
  roles?: string[];
  exp?: number;
  [key: string]: unknown;
};

const base64UrlToBuffer = (value: string): Buffer => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64');
};

const decodeBase64Url = (value: string): string =>
  base64UrlToBuffer(value).toString('utf-8');

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers?.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authorization.slice(7).trim();
    const payload = this.verify(token);

    request.user = {
      ...payload,
      id: payload.sub ?? payload.id ?? null,
    };

    return true;
  }

  private verify(token: string): JwtAuthPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('JWT secret is not configured');
    }

    const segments = token.split('.');
    if (segments.length !== 3) {
      throw new UnauthorizedException('Malformed JWT token');
    }

    const [headerSegment, payloadSegment, signatureSegment] = segments;
    const headerJson = decodeBase64Url(headerSegment);
    let header: { alg?: string };
    try {
      header = JSON.parse(headerJson);
    } catch {
      throw new UnauthorizedException('Invalid JWT header');
    }

    if (header.alg !== 'HS256') {
      throw new UnauthorizedException('Unsupported JWT algorithm');
    }

    const signingInput = `${headerSegment}.${payloadSegment}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(signingInput)
      .digest();

    const actualSignature = base64UrlToBuffer(signatureSegment);
    if (
      expectedSignature.length !== actualSignature.length ||
      !timingSafeEqual(expectedSignature, actualSignature)
    ) {
      throw new UnauthorizedException('Invalid JWT signature');
    }

    const payloadJson = decodeBase64Url(payloadSegment);
    let payload: JwtAuthPayload;
    try {
      payload = JSON.parse(payloadJson);
    } catch {
      throw new UnauthorizedException('Invalid JWT payload');
    }

    if (payload.exp && typeof payload.exp === 'number') {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new UnauthorizedException('JWT token expired');
      }
    }

    return payload;
  }
}
