'use client';

import { useState } from 'react';
import PersonalInfoForm from '@/components/membership/PersonalInfoForm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { personalInfoSchema, type PersonalInfoInput } from '@/lib/membership/validation';

export default function TestPersonalInfoFormPage() {
  const [formData, setFormData] = useState<PersonalInfoInput>({
    full_name: '',
    gender: 'male',
    date_of_birth: '',
    phone_number: '',
    address: '',
    emergency_contact: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleValidate = () => {
    try {
      personalInfoSchema.parse(formData);
      setErrors({});
      setIsValid(true);
    } catch (error: any) {
      const validationErrors: Record<string, string> = {};
      error.issues?.forEach((issue: any) => {
        const field = issue.path[0];
        validationErrors[field] = issue.message;
      });
      setErrors(validationErrors);
      setIsValid(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Test Personal Info Form</h1>

      <Card className="p-6">
        <PersonalInfoForm
          value={formData}
          onChange={setFormData}
          errors={errors}
        />

        <div className="mt-6 space-y-4">
          <Button onClick={handleValidate} className="w-full">
            Validate Form
          </Button>

          {isValid !== null && (
            <div
              className={`rounded-lg p-4 ${
                isValid
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {isValid ? '✓ Form is valid!' : '✗ Form has errors'}
            </div>
          )}

          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Form Data:</h3>
            <pre className="overflow-auto text-xs">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
}
