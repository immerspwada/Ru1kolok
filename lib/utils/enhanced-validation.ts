/**
 * Enhanced validation utilities for comprehensive input validation
 * Requirement 9.2: Input validation and sanitization
 */

import { sanitizeInput, sanitizeEmail, sanitizePhoneNumber } from './sanitization';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): ValidationError | null {
  const sanitized = sanitizeInput(value);

  if (sanitized.length < min) {
    return {
      field: fieldName,
      message: `${fieldName} ต้องมีอย่างน้อย ${min} ตัวอักษร`,
      code: 'MIN_LENGTH',
    };
  }

  if (sanitized.length > max) {
    return {
      field: fieldName,
      message: `${fieldName} ต้องไม่เกิน ${max} ตัวอักษร`,
      code: 'MAX_LENGTH',
    };
  }

  return null;
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return {
      field: fieldName,
      message: `กรุณากรอก${fieldName}`,
      code: 'REQUIRED',
    };
  }

  if (typeof value === 'string' && sanitizeInput(value) === '') {
    return {
      field: fieldName,
      message: `กรุณากรอก${fieldName}`,
      code: 'REQUIRED',
    };
  }

  return null;
}

/**
 * Validate email format with enhanced checks
 */
export function validateEmailFormat(email: string): ValidationError | null {
  const sanitized = sanitizeEmail(email);

  if (!sanitized) {
    return {
      field: 'email',
      message: 'รูปแบบอีเมลไม่ถูกต้อง',
      code: 'INVALID_EMAIL',
    };
  }

  // Enhanced email regex
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

  if (!emailRegex.test(sanitized)) {
    return {
      field: 'email',
      message: 'รูปแบบอีเมลไม่ถูกต้อง',
      code: 'INVALID_EMAIL',
    };
  }

  // Check for common typos in domain
  const domain = sanitized.split('@')[1];
  const suspiciousDomains = ['gmial.com', 'gmai.com', 'yahooo.com', 'hotmial.com'];

  if (suspiciousDomains.includes(domain)) {
    return {
      field: 'email',
      message: 'โดเมนอีเมลอาจสะกดผิด กรุณาตรวจสอบอีกครั้ง',
      code: 'SUSPICIOUS_DOMAIN',
    };
  }

  return null;
}

/**
 * Validate phone number format
 */
export function validatePhoneFormat(phone: string): ValidationError | null {
  const sanitized = sanitizePhoneNumber(phone);

  if (!sanitized) {
    return {
      field: 'phone',
      message: 'กรุณากรอกเบอร์โทรศัพท์',
      code: 'REQUIRED',
    };
  }

  // Thai phone number: 10 digits starting with 0, or international format
  const thaiPhoneRegex = /^0[0-9]{9}$/;
  const internationalPhoneRegex = /^\+[1-9][0-9]{7,14}$/;

  if (!thaiPhoneRegex.test(sanitized) && !internationalPhoneRegex.test(sanitized)) {
    return {
      field: 'phone',
      message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ตัวอย่าง: 0812345678)',
      code: 'INVALID_PHONE',
    };
  }

  return null;
}

/**
 * Validate date range
 */
export function validateDateRange(
  date: string,
  minDate?: Date,
  maxDate?: Date,
  fieldName: string = 'วันที่'
): ValidationError | null {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return {
      field: 'date',
      message: `${fieldName}ไม่ถูกต้อง`,
      code: 'INVALID_DATE',
    };
  }

  if (minDate && dateObj < minDate) {
    return {
      field: 'date',
      message: `${fieldName}ต้องไม่ก่อน ${minDate.toLocaleDateString('th-TH')}`,
      code: 'DATE_TOO_EARLY',
    };
  }

  if (maxDate && dateObj > maxDate) {
    return {
      field: 'date',
      message: `${fieldName}ต้องไม่หลัง ${maxDate.toLocaleDateString('th-TH')}`,
      code: 'DATE_TOO_LATE',
    };
  }

  return null;
}

/**
 * Validate age from date of birth
 */
export function validateAge(
  dateOfBirth: string,
  minAge: number,
  maxAge: number
): ValidationError | null {
  const dob = new Date(dateOfBirth);
  const today = new Date();

  if (isNaN(dob.getTime())) {
    return {
      field: 'date_of_birth',
      message: 'วันเกิดไม่ถูกต้อง',
      code: 'INVALID_DATE',
    };
  }

  const age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();

  let actualAge = age;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    actualAge--;
  }

  if (actualAge < minAge) {
    return {
      field: 'date_of_birth',
      message: `ต้องมีอายุอย่างน้อย ${minAge} ปี`,
      code: 'AGE_TOO_YOUNG',
    };
  }

  if (actualAge > maxAge) {
    return {
      field: 'date_of_birth',
      message: `อายุต้องไม่เกิน ${maxAge} ปี`,
      code: 'AGE_TOO_OLD',
    };
  }

  return null;
}

/**
 * Validate numeric range
 */
export function validateNumericRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationError | null {
  if (isNaN(value) || !isFinite(value)) {
    return {
      field: fieldName,
      message: `${fieldName}ต้องเป็นตัวเลข`,
      code: 'INVALID_NUMBER',
    };
  }

  if (value < min) {
    return {
      field: fieldName,
      message: `${fieldName}ต้องมากกว่าหรือเท่ากับ ${min}`,
      code: 'NUMBER_TOO_SMALL',
    };
  }

  if (value > max) {
    return {
      field: fieldName,
      message: `${fieldName}ต้องน้อยกว่าหรือเท่ากับ ${max}`,
      code: 'NUMBER_TOO_LARGE',
    };
  }

  return null;
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): ValidationError | null {
  if (!url) {
    return {
      field: 'url',
      message: 'กรุณากรอก URL',
      code: 'REQUIRED',
    };
  }

  try {
    const urlObj = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        field: 'url',
        message: 'URL ต้องเป็น http หรือ https เท่านั้น',
        code: 'INVALID_PROTOCOL',
      };
    }

    return null;
  } catch {
    return {
      field: 'url',
      message: 'รูปแบบ URL ไม่ถูกต้อง',
      code: 'INVALID_URL',
    };
  }
}

/**
 * Validate UUID format
 */
export function validateUuid(uuid: string, fieldName: string = 'ID'): ValidationError | null {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    return {
      field: fieldName,
      message: `${fieldName} ไม่ถูกต้อง`,
      code: 'INVALID_UUID',
    };
  }

  return null;
}

/**
 * Validate time format (HH:MM)
 */
export function validateTimeFormat(time: string): ValidationError | null {
  const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

  if (!timeRegex.test(time)) {
    return {
      field: 'time',
      message: 'รูปแบบเวลาไม่ถูกต้อง (ตัวอย่าง: 14:30)',
      code: 'INVALID_TIME',
    };
  }

  return null;
}

/**
 * Validate time range (start time must be before end time)
 */
export function validateTimeRange(
  startTime: string,
  endTime: string
): ValidationError | null {
  const startError = validateTimeFormat(startTime);
  if (startError) return startError;

  const endError = validateTimeFormat(endTime);
  if (endError) return endError;

  if (startTime >= endTime) {
    return {
      field: 'end_time',
      message: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม',
      code: 'INVALID_TIME_RANGE',
    };
  }

  return null;
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: string,
  allowedValues: T[],
  fieldName: string
): ValidationError | null {
  if (!allowedValues.includes(value as T)) {
    return {
      field: fieldName,
      message: `${fieldName}ไม่ถูกต้อง`,
      code: 'INVALID_ENUM',
    };
  }

  return null;
}

/**
 * Validate array length
 */
export function validateArrayLength(
  array: any[],
  min: number,
  max: number,
  fieldName: string
): ValidationError | null {
  if (!Array.isArray(array)) {
    return {
      field: fieldName,
      message: `${fieldName}ต้องเป็น array`,
      code: 'INVALID_TYPE',
    };
  }

  if (array.length < min) {
    return {
      field: fieldName,
      message: `${fieldName}ต้องมีอย่างน้อย ${min} รายการ`,
      code: 'ARRAY_TOO_SHORT',
    };
  }

  if (array.length > max) {
    return {
      field: fieldName,
      message: `${fieldName}ต้องไม่เกิน ${max} รายการ`,
      code: 'ARRAY_TOO_LONG',
    };
  }

  return null;
}

/**
 * Batch validation - validate multiple fields at once
 */
export function batchValidate(
  validators: Array<() => ValidationError | null>
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const validator of validators) {
    const error = validator();
    if (error) {
      errors.push(error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
