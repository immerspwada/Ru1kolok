/**
 * Error message utilities for user-friendly error handling
 * Provides consistent, localized error messages across the application
 */

export const ErrorMessages = {
  // Authentication errors
  AUTH_REQUIRED: 'กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ',
  AUTH_FAILED: 'การยืนยันตัวตนล้มเหลว กรุณาเข้าสู่ระบบอีกครั้ง',
  UNAUTHORIZED: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้',
  
  // Profile errors
  PROFILE_NOT_FOUND: 'ไม่พบข้อมูลผู้ใช้ กรุณาติดต่อผู้ดูแลระบบ',
  COACH_NOT_FOUND: 'ไม่พบข้อมูลโค้ช',
  ATHLETE_NOT_FOUND: 'ไม่พบข้อมูลนักกีฬา',
  
  // Session errors
  SESSION_NOT_FOUND: 'ไม่พบตารางฝึกซ้อมที่ระบุ',
  SESSION_CANCELLED: 'ตารางฝึกซ้อมนี้ถูกยกเลิกแล้ว',
  SESSION_CREATE_FAILED: 'ไม่สามารถสร้างตารางฝึกซ้อมได้ กรุณาลองอีกครั้ง',
  SESSION_UPDATE_FAILED: 'ไม่สามารถแก้ไขตารางฝึกซ้อมได้ กรุณาลองอีกครั้ง',
  SESSION_DELETE_FAILED: 'ไม่สามารถลบตารางฝึกซ้อมได้ กรุณาลองอีกครั้ง',
  SESSION_PAST_DATE: 'ไม่สามารถสร้างหรือแก้ไขตารางในอดีตได้',
  SESSION_INVALID_TIME: 'เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด',
  SESSION_CANCEL_TOO_LATE: 'ไม่สามารถยกเลิกตารางได้ ต้องยกเลิกก่อนเวลาเริ่มอย่างน้อย 2 ชั่วโมง',
  
  // Check-in errors
  CHECKIN_ALREADY_EXISTS: 'คุณได้เช็คอินสำหรับตารางนี้แล้ว',
  CHECKIN_TOO_EARLY: 'ยังไม่ถึงเวลาเช็คอิน (สามารถเช็คอินได้ 30 นาทีก่อนเวลาเริ่ม)',
  CHECKIN_TOO_LATE: 'หมดเวลาเช็คอินแล้ว (สามารถเช็คอินได้จนถึง 15 นาทีหลังเวลาเริ่ม)',
  CHECKIN_FAILED: 'ไม่สามารถบันทึกการเช็คอินได้ กรุณาลองอีกครั้ง',
  CHECKIN_WRONG_CLUB: 'คุณไม่สามารถเช็คอินในตารางของสโมสรอื่นได้',
  
  // Leave request errors
  LEAVE_ALREADY_EXISTS: 'คุณได้แจ้งลาสำหรับตารางนี้แล้ว',
  LEAVE_TOO_LATE: 'ต้องแจ้งลาล่วงหน้าอย่างน้อย 2 ชั่วโมงก่อนเวลาเริ่ม',
  LEAVE_REASON_TOO_SHORT: 'กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร',
  LEAVE_AFTER_CHECKIN: 'คุณได้เช็คอินแล้ว ไม่สามารถแจ้งลาได้',
  LEAVE_FAILED: 'ไม่สามารถบันทึกคำขอลาได้ กรุณาลองอีกครั้ง',
  LEAVE_WRONG_CLUB: 'คุณไม่สามารถแจ้งลาในตารางของสโมสรอื่นได้',
  
  // Attendance errors
  ATTENDANCE_NOT_FOUND: 'ไม่พบข้อมูลการเข้าร่วม',
  ATTENDANCE_UPDATE_FAILED: 'ไม่สามารถแก้ไขข้อมูลการเข้าร่วมได้ กรุณาลองอีกครั้ง',
  ATTENDANCE_FETCH_FAILED: 'ไม่สามารถดึงข้อมูลการเข้าร่วมได้ กรุณาลองอีกครั้ง',
  
  // Validation errors
  VALIDATION_REQUIRED_FIELD: 'กรุณากรอกข้อมูลที่จำเป็น',
  VALIDATION_INVALID_DATE: 'วันที่ไม่ถูกต้อง',
  VALIDATION_INVALID_TIME: 'เวลาไม่ถูกต้อง',
  VALIDATION_INVALID_EMAIL: 'อีเมลไม่ถูกต้อง',
  
  // Database errors
  DB_CONNECTION_ERROR: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองอีกครั้ง',
  DB_QUERY_ERROR: 'เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองอีกครั้ง',
  DB_INSERT_ERROR: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองอีกครั้ง',
  DB_UPDATE_ERROR: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล กรุณาลองอีกครั้ง',
  DB_DELETE_ERROR: 'เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองอีกครั้ง',
  
  // Generic errors
  UNEXPECTED_ERROR: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองอีกครั้งหรือติดต่อผู้ดูแลระบบ',
  NETWORK_ERROR: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
  SERVER_ERROR: 'เซิร์ฟเวอร์ขัดข้อง กรุณาลองอีกครั้งในภายหลัง',
} as const;

/**
 * Get user-friendly error message from error code or message
 */
export function getUserFriendlyError(error: string | Error | unknown): string {
  if (typeof error === 'string') {
    // Check if it's a known error code
    if (error in ErrorMessages) {
      return ErrorMessages[error as keyof typeof ErrorMessages];
    }
    // Return the error string as-is if it's already user-friendly
    return error;
  }
  
  if (error instanceof Error) {
    // Try to match error message to known patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('auth') || message.includes('unauthorized')) {
      return ErrorMessages.AUTH_REQUIRED;
    }
    
    if (message.includes('not found')) {
      return ErrorMessages.SESSION_NOT_FOUND;
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorMessages.NETWORK_ERROR;
    }
    
    // Return the original error message if no match
    return error.message;
  }
  
  // Unknown error type
  return ErrorMessages.UNEXPECTED_ERROR;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Record<string, string>): string {
  const errorMessages = Object.values(errors);
  if (errorMessages.length === 0) return '';
  if (errorMessages.length === 1) return errorMessages[0];
  return `กรุณาแก้ไขข้อผิดพลาดต่อไปนี้:\n${errorMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}`;
}
