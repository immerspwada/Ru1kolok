'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  personalInfoSchema,
  formatPhoneNumber,
  type PersonalInfoInput,
} from '@/lib/membership/validation';
import { z } from 'zod';

interface PersonalInfoFormProps {
  value: PersonalInfoInput;
  onChange: (value: PersonalInfoInput) => void;
  errors?: Record<string, string>;
}

export default function PersonalInfoForm({
  value,
  onChange,
  errors = {},
}: PersonalInfoFormProps) {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Merge external errors with local validation errors
  const displayErrors = { ...localErrors, ...errors };

  // Validate a single field
  const validateField = (fieldName: keyof PersonalInfoInput, fieldValue: string) => {
    try {
      // Validate just this field
      const fieldSchema = personalInfoSchema.shape[fieldName];
      fieldSchema.parse(fieldValue);
      
      // Clear error if validation passes
      setLocalErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setLocalErrors((prev) => ({
          ...prev,
          [fieldName]: error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง',
        }));
      }
    }
  };

  // Handle input change
  const handleChange = (
    field: keyof PersonalInfoInput,
    inputValue: string
  ) => {
    let processedValue = inputValue;

    // Auto-format phone numbers
    if (field === 'phone_number' || field === 'emergency_contact') {
      processedValue = formatPhoneNumber(inputValue);
    }

    // Update value
    onChange({
      ...value,
      [field]: processedValue,
    });

    // Validate if field has been touched
    if (touched[field]) {
      validateField(field, processedValue);
    }
  };

  // Handle blur (mark field as touched and validate)
  const handleBlur = (field: keyof PersonalInfoInput) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value[field] || '');
  };

  return (
    <div className="space-y-6">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">
          ชื่อ-นามสกุล <span className="text-red-500">*</span>
        </Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          value={value.full_name || ''}
          onChange={(e) => handleChange('full_name', e.target.value)}
          onBlur={() => handleBlur('full_name')}
          placeholder="กรอกชื่อ-นามสกุล"
          aria-invalid={!!displayErrors.full_name}
          className={displayErrors.full_name ? 'border-red-500' : ''}
        />
        {displayErrors.full_name && (
          <p className="text-sm text-red-600">{displayErrors.full_name}</p>
        )}
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <Label htmlFor="phone_number">
          เบอร์โทรศัพท์ <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phone_number"
          name="phone_number"
          type="tel"
          value={value.phone_number || ''}
          onChange={(e) => handleChange('phone_number', e.target.value)}
          onBlur={() => handleBlur('phone_number')}
          placeholder="081-234-5678"
          aria-invalid={!!displayErrors.phone_number}
          className={displayErrors.phone_number ? 'border-red-500' : ''}
        />
        {displayErrors.phone_number && (
          <p className="text-sm text-red-600">{displayErrors.phone_number}</p>
        )}
        <p className="text-xs text-gray-500">รูปแบบ: 0XX-XXX-XXXX</p>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">
          ที่อยู่ <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="address"
          name="address"
          value={value.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          onBlur={() => handleBlur('address')}
          placeholder="กรอกที่อยู่ของคุณ"
          rows={4}
          aria-invalid={!!displayErrors.address}
          className={displayErrors.address ? 'border-red-500' : ''}
        />
        {displayErrors.address && (
          <p className="text-sm text-red-600">{displayErrors.address}</p>
        )}
      </div>

      {/* Emergency Contact */}
      <div className="space-y-2">
        <Label htmlFor="emergency_contact">
          เบอร์โทรฉุกเฉิน <span className="text-red-500">*</span>
        </Label>
        <Input
          id="emergency_contact"
          name="emergency_contact"
          type="tel"
          value={value.emergency_contact || ''}
          onChange={(e) => handleChange('emergency_contact', e.target.value)}
          onBlur={() => handleBlur('emergency_contact')}
          placeholder="089-999-9999"
          aria-invalid={!!displayErrors.emergency_contact}
          className={displayErrors.emergency_contact ? 'border-red-500' : ''}
        />
        {displayErrors.emergency_contact && (
          <p className="text-sm text-red-600">
            {displayErrors.emergency_contact}
          </p>
        )}
        <p className="text-xs text-gray-500">
          เบอร์ติดต่อฉุกเฉินในกรณีเกิดเหตุฉุกเฉิน
        </p>
      </div>

      {/* Optional Fields Section */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="mb-4 text-sm font-medium text-gray-700">
          ข้อมูลเพิ่มเติม (ไม่บังคับ)
        </p>

        <div className="space-y-4">
          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">วันเกิด</Label>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              value={value.date_of_birth || ''}
              onChange={(e) => handleChange('date_of_birth', e.target.value)}
              placeholder="เลือกวันเกิด"
            />
          </div>

          {/* Blood Type */}
          <div className="space-y-2">
            <Label htmlFor="blood_type">กรุ๊ปเลือด</Label>
            <Input
              id="blood_type"
              name="blood_type"
              type="text"
              value={value.blood_type || ''}
              onChange={(e) => handleChange('blood_type', e.target.value)}
              placeholder="เช่น A, B, AB, O"
              maxLength={3}
            />
          </div>

          {/* Medical Conditions */}
          <div className="space-y-2">
            <Label htmlFor="medical_conditions">โรคประจำตัว / ข้อมูลสุขภาพ</Label>
            <Textarea
              id="medical_conditions"
              name="medical_conditions"
              value={value.medical_conditions || ''}
              onChange={(e) =>
                handleChange('medical_conditions', e.target.value)
              }
              placeholder="โรคประจำตัว, อาการแพ้, หรือข้อมูลสุขภาพอื่นๆ ที่โค้ชควรทราบ"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Required Fields Note */}
      <p className="text-xs text-gray-500">
        <span className="text-red-500">*</span> ฟิลด์ที่จำเป็นต้องกรอก
      </p>
    </div>
  );
}
