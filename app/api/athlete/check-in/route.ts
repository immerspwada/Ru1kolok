/**
 * Attendance Check-in API Route with Idempotency Support
 * 
 * POST /api/athlete/check-in
 * 
 * Handles athlete check-in with idempotency to prevent duplicate check-ins.
 * Requirements: 20.5, 20.6, 20.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  handleIdempotentRequest, 
  extractIdempotencyKey, 
  isValidIdempotencyKey 
} from '@/lib/utils/idempotency';
import { checkInToSession } from '@/lib/athlete/attendance-actions';
import { getApiContext } from '@/lib/utils/api-context';
import { createLogger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  // Create request context with correlation IDs
  const context = getApiContext(request);
  const logger = createLogger(context);
  
  try {
    logger.info('Check-in request started');
    
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Update context with user ID
    context.userId = user?.id;

    if (authError || !user) {
      logger.warn('Authentication failed', { error: authError?.message });
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'กรุณาเข้าสู่ระบบ'
          }
        },
        { status: 401 }
      );
      response.headers.set('X-Correlation-ID', context.correlationId);
      response.headers.set('X-Causation-ID', context.causationId);
      return response;
    }

    // Extract idempotency key
    const idempotencyKey = extractIdempotencyKey(request.headers);

    // Parse request body
    const body = await request.json();
    const { sessionId, method = 'manual' } = body;

    if (!sessionId) {
      logger.warn('Missing session ID in request');
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_SESSION_ID',
            message: 'Session ID is required'
          }
        },
        { status: 400 }
      );
      response.headers.set('X-Correlation-ID', context.correlationId);
      response.headers.set('X-Causation-ID', context.causationId);
      return response;
    }
    
    logger.info('Processing check-in', { sessionId, method, userId: user.id });

    // If idempotency key is provided, use idempotent handler
    if (idempotencyKey) {
      // Validate idempotency key format
      if (!isValidIdempotencyKey(idempotencyKey)) {
        logger.warn('Invalid idempotency key format', { idempotencyKey });
        const response = NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_IDEMPOTENCY_KEY',
              message: 'Idempotency-Key must be a valid UUID or alphanumeric string'
            }
          },
          { status: 400 }
        );
        response.headers.set('X-Correlation-ID', context.correlationId);
        response.headers.set('X-Causation-ID', context.causationId);
        return response;
      }
      
      logger.info('Using idempotent request handler', { idempotencyKey });

      // Handle with idempotency
      const result = await handleIdempotentRequest(
        idempotencyKey,
        user.id,
        '/api/athlete/check-in',
        async () => {
          const checkInResult = await checkInToSession(sessionId, method);
          
          if (checkInResult.error) {
            throw new Error(checkInResult.error);
          }
          
          return {
            attendance: checkInResult.data
          };
        }
      );

      // Set response headers
      const headers: Record<string, string> = {
        'X-Request-Id': result.metadata?.requestId || '',
        'X-Correlation-ID': context.correlationId,
        'X-Causation-ID': context.causationId,
      };

      if (result.metadata?.cached) {
        headers['X-Idempotency-Cached'] = 'true';
        headers['X-Original-Timestamp'] = result.metadata.originalTimestamp || '';
        logger.info('Returning cached idempotent response', { 
          idempotencyKey,
          originalTimestamp: result.metadata.originalTimestamp 
        });
      } else {
        logger.info('Check-in completed successfully', { sessionId });
      }

      return NextResponse.json(result, { 
        status: result.success ? 200 : 400,
        headers 
      });
    }

    // No idempotency key, execute normally
    logger.info('Executing check-in without idempotency key');
    const result = await checkInToSession(sessionId, method);

    if (result.error) {
      logger.warn('Check-in failed', { error: result.error, sessionId });
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: 'CHECK_IN_FAILED',
            message: result.error
          }
        },
        { status: 400 }
      );
      response.headers.set('X-Correlation-ID', context.correlationId);
      response.headers.set('X-Causation-ID', context.causationId);
      return response;
    }

    logger.info('Check-in completed successfully', { sessionId });
    const response = NextResponse.json({
      success: true,
      data: {
        attendance: result.data
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        correlationId: context.correlationId,
        causationId: context.causationId,
      }
    });
    response.headers.set('X-Correlation-ID', context.correlationId);
    response.headers.set('X-Causation-ID', context.causationId);
    return response;

  } catch (error) {
    logger.error('Check-in API error', error as Error);
    
    const response = NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          correlationId: context.correlationId,
          causationId: context.causationId,
        }
      },
      { status: 500 }
    );
    response.headers.set('X-Correlation-ID', context.correlationId);
    response.headers.set('X-Causation-ID', context.causationId);
    return response;
  }
}
