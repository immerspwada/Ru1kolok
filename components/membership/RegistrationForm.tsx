'use client';

/**
 * Multi-Step Registration Form Component
 * 
 * A comprehensive registration form for membership applications with three steps:
 * 1. Personal Information - Collect athlete's personal details
 * 2. Document Upload - Upload required documents (ID card, house registration, birth certificate)
 * 3. Sport Selection - Choose which sport/club to join
 * 
 * Features:
 * - Progress indicator showing current step (1/3, 2/3, 3/3)
 * - Navigation buttons (Next, Back, Submit)
 * - Form state management with useState
 * - Step validation before allowing progression
 * - Calls submitApplication() action on final submit
 * - Loading states during submission
 * - Error handling with user-friendly messages
 * 
 * Validates: Requirements US-1, US-2, NFR-1
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PersonalInfoForm from './PersonalInfoForm';
import DocumentUpload from './DocumentUpload';
import { SportSelection } from './SportSelection';
import { submitApplication } from '@/lib/membership/actions';
import { personalInfoSchema, type PersonalInfoInput } from '@/lib/membership/validation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface RegistrationFormProps {
  userId: string;
  onSuccess?: () => void;
}

type Step = 1 | 2 | 3;

interface DocumentInfo {
  url: string;
  file_name: string;
  file_size: number;
}

interface FormState {
  personalInfo: PersonalInfoInput;
  documents: {
    id_card: DocumentInfo | null;
    house_registration: DocumentInfo | null;
    birth_certificate: DocumentInfo | null;
  };
  clubId: string;
}

export default function RegistrationForm({ userId, onSuccess }: RegistrationFormProps) {
  // Form state
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormState>({
    personalInfo: {
      full_name: '',
      phone_number: '',
      address: '',
      emergency_contact: '',
      date_of_birth: '',
      blood_type: '',
      medical_conditions: '',
    },
    documents: {
      id_card: null,
      house_registration: null,
      birth_certificate: null,
    },
    clubId: '',
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validate Step 1: Personal Information
  const validateStep1 = (): boolean => {
    try {
      personalInfoSchema.parse(formData.personalInfo);
      setValidationErrors({});
      return true;
    } catch (error: any) {
      const errors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          errors[field] = err.message;
        });
      }
      setValidationErrors(errors);
      return false;
    }
  };

  // Validate Step 2: Documents
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.documents.id_card || !formData.documents.id_card.url) {
      errors.id_card = 'กรุณาอัปโหลดรูปบัตรประชาชน';
    }
    if (!formData.documents.house_registration || !formData.documents.house_registration.url) {
      errors.house_registration = 'กรุณาอัปโหลดรูปทะเบียนบ้าน';
    }
    if (!formData.documents.birth_certificate || !formData.documents.birth_certificate.url) {
      errors.birth_certificate = 'กรุณาอัปโหลดรูปสูติบัตร';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Step 3: Sport Selection
  const validateStep3 = (): boolean => {
    if (!formData.clubId) {
      setSubmitError('กรุณาเลือกกีฬาที่ต้องการสมัคร');
      return false;
    }
    setSubmitError(null);
    return true;
  };

  // Handle Next button
  const handleNext = () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }

    if (isValid && currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Back button
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      setValidationErrors({});
      setSubmitError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Final validation
    if (!validateStep3()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare documents array for submission
      const documentsArray = [
        {
          type: 'id_card' as const,
          url: formData.documents.id_card!.url,
          uploaded_at: new Date().toISOString(),
          file_name: formData.documents.id_card!.file_name,
          file_size: formData.documents.id_card!.file_size,
        },
        {
          type: 'house_registration' as const,
          url: formData.documents.house_registration!.url,
          uploaded_at: new Date().toISOString(),
          file_name: formData.documents.house_registration!.file_name,
          file_size: formData.documents.house_registration!.file_size,
        },
        {
          type: 'birth_certificate' as const,
          url: formData.documents.birth_certificate!.url,
          uploaded_at: new Date().toISOString(),
          file_name: formData.documents.birth_certificate!.file_name,
          file_size: formData.documents.birth_certificate!.file_size,
        },
      ];

      // Submit application
      const result = await submitApplication({
        club_id: formData.clubId,
        personal_info: formData.personalInfo,
        documents: documentsArray,
      });

      if (result.success) {
        // Success! Call onSuccess callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setSubmitError(result.error || 'ไม่สามารถส่งใบสมัครได้');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitError('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update personal info
  const handlePersonalInfoChange = (value: PersonalInfoInput) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: value,
    }));
  };

  // Update document
  const handleDocumentChange = (
    documentType: 'id_card' | 'house_registration' | 'birth_certificate',
    documentInfo: DocumentInfo | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: documentInfo,
      },
    }));
  };

  // Update club selection
  const handleClubSelect = (clubId: string) => {
    setFormData((prev) => ({
      ...prev,
      clubId,
    }));
    setSubmitError(null);
  };

  // Progress indicator
  const progressPercentage = (currentStep / 3) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">สมัครสมาชิกสโมสรกีฬา</CardTitle>
          <CardDescription>
            กรอกข้อมูลให้ครบถ้วนเพื่อสมัครเข้าร่วมกีฬา
          </CardDescription>

          {/* Progress Indicator */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                ขั้นตอนที่ {currentStep} จาก 3
              </span>
              <span className="text-sm text-gray-500">
                {currentStep === 1 && 'ข้อมูลส่วนตัว'}
                {currentStep === 2 && 'อัปโหลดเอกสาร'}
                {currentStep === 3 && 'เลือกกีฬา'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-sm font-medium text-gray-700">ข้อมูลส่วนตัว</span>
            </div>

            <div className="flex-1 h-0.5 bg-gray-200 mx-2" />

            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-sm font-medium text-gray-700">เอกสาร</span>
            </div>

            <div className="flex-1 h-0.5 bg-gray-200 mx-2" />

            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 3
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium text-gray-700">เลือกกีฬา</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <PersonalInfoForm
                value={formData.personalInfo}
                onChange={handlePersonalInfoChange}
                errors={validationErrors}
              />
            </div>
          )}

          {/* Step 2: Document Upload */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  📸 กรุณาอัปโหลดเอกสารทั้ง 3 ประเภท: บัตรประชาชน, ทะเบียนบ้าน, และสูติบัตร
                </p>
              </div>

              <DocumentUpload
                documentType="id_card"
                value={formData.documents.id_card?.url}
                onChange={(url, fileName, fileSize) => 
                  handleDocumentChange('id_card', url ? { url, file_name: fileName || '', file_size: fileSize || 0 } : null)
                }
                error={validationErrors.id_card}
                userId={userId}
              />

              <DocumentUpload
                documentType="house_registration"
                value={formData.documents.house_registration?.url}
                onChange={(url, fileName, fileSize) => 
                  handleDocumentChange('house_registration', url ? { url, file_name: fileName || '', file_size: fileSize || 0 } : null)
                }
                error={validationErrors.house_registration}
                userId={userId}
              />

              <DocumentUpload
                documentType="birth_certificate"
                value={formData.documents.birth_certificate?.url}
                onChange={(url, fileName, fileSize) => 
                  handleDocumentChange('birth_certificate', url ? { url, file_name: fileName || '', file_size: fileSize || 0 } : null)
                }
                error={validationErrors.birth_certificate}
                userId={userId}
              />
            </div>
          )}

          {/* Step 3: Sport Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  🏆 เลือกกีฬาที่คุณต้องการสมัคร (เลือกได้ 1 กีฬา)
                </p>
              </div>

              <SportSelection
                onSelect={handleClubSelect}
                selectedClubId={formData.clubId}
              />

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
            >
              ย้อนกลับ
            </Button>

            <div className="flex items-center space-x-3">
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  ถัดไป
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.clubId}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังส่ง...
                    </>
                  ) : (
                    'ส่งใบสมัคร'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
