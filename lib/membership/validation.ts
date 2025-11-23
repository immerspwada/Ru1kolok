import { z } from 'zod';

// Phone number format: 0XX-XXX-XXXX
const phoneRegex = /^0[0-9]{2}-[0-9]{3}-[0-9]{4}$/;

// Personal Information Schema
export const personalInfoSchema = z.object({
  full_name: z
    .string()
    .min(2, 'ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(100, 'ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร'),
  phone_number: z
    .string()
    .regex(phoneRegex, 'รูปแบบเบอร์โทรไม่ถูกต้อง (ตัวอย่าง: 081-234-5678)'),
  address: z
    .string()
    .min(10, 'ที่อยู่ต้องมีอย่างน้อย 10 ตัวอักษร')
    .max(500, 'ที่อยู่ต้องไม่เกิน 500 ตัวอักษร'),
  emergency_contact: z
    .string()
    .regex(phoneRegex, 'รูปแบบเบอร์โทรฉุกเฉินไม่ถูกต้อง (ตัวอย่าง: 081-234-5678)'),
  date_of_birth: z.string().optional(),
  blood_type: z.string().optional(),
  medical_conditions: z.string().optional(),
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;

// Document Type Schema
export const documentTypeSchema = z.enum([
  'id_card',
  'house_registration',
  'birth_certificate',
]);

// Document Entry Schema
export const documentEntrySchema = z.object({
  type: documentTypeSchema,
  url: z.string().url('URL ไม่ถูกต้อง'),
  uploaded_at: z.string(),
  file_name: z.string(),
  file_size: z.number().positive('ขนาดไฟล์ต้องมากกว่า 0'),
  is_verified: z.boolean().optional(),
});

// File Validation Schema (for upload)
export const fileValidationSchema = z.object({
  name: z.string(),
  size: z
    .number()
    .max(5 * 1024 * 1024, 'ขนาดไฟล์ต้องไม่เกิน 5MB'),
  type: z
    .string()
    .refine(
      (type) =>
        ['image/jpeg', 'image/png', 'application/pdf'].includes(type),
      'ประเภทไฟล์ต้องเป็น JPG, PNG หรือ PDF เท่านั้น'
    ),
});

// Application Submission Schema
export const applicationSubmissionSchema = z.object({
  club_id: z.string().uuid('Club ID ไม่ถูกต้อง'),
  personal_info: personalInfoSchema,
  documents: z
    .array(documentEntrySchema)
    .min(3, 'ต้องอัปโหลดเอกสารครบทั้ง 3 ประเภท')
    .max(3, 'อัปโหลดได้สูงสุด 3 เอกสาร')
    .refine(
      (docs) => {
        const types = docs.map((d) => d.type);
        return (
          types.includes('id_card') &&
          types.includes('house_registration') &&
          types.includes('birth_certificate')
        );
      },
      'ต้องมีเอกสารครบทั้ง 3 ประเภท: บัตรประชาชน, ทะเบียนบ้าน, สูติบัตร'
    ),
});

export type ApplicationSubmissionInput = z.infer<
  typeof applicationSubmissionSchema
>;

// Review Application Schema
export const reviewApplicationSchema = z.object({
  application_id: z.string().uuid('Application ID ไม่ถูกต้อง'),
  action: z.enum(['approve', 'reject', 'request_info']),
  notes: z.string().optional(),
  requested_changes: z.array(z.string()).optional(),
});

export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>;

// Helper function to validate phone number
export function isValidPhoneNumber(phone: string): boolean {
  return phoneRegex.test(phone);
}

// Helper function to format phone number
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Format as 0XX-XXX-XXXX
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phone;
}

// Helper function to validate file
export function validateFile(file: File): {
  valid: boolean;
  error?: string;
} {
  try {
    fileValidationSchema.parse({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.issues[0]?.message || 'ไฟล์ไม่ถูกต้อง',
      };
    }
    return { valid: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบไฟล์' };
  }
}

// Allowed file types
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Document type labels (Thai)
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  id_card: 'บัตรประชาชน',
  house_registration: 'ทะเบียนบ้าน',
  birth_certificate: 'สูติบัตร',
};
