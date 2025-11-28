'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PersonalInfoForm from '@/components/membership/PersonalInfoForm';
import DocumentUpload from '@/components/membership/DocumentUpload';
import { ProfilePictureUpload } from '@/components/athlete/ProfilePictureUpload';
import { Loader2, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { personalInfoSchema, type PersonalInfoInput } from '@/lib/membership/validation';
import { updateAthleteProfileComplete } from '@/lib/athlete/actions';

interface Athlete {
  id: string;
  user_id: string;
  club_id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  date_of_birth: string;
  phone_number: string;
  email: string;
  gender: string;
  health_notes?: string;
  profile_picture_url?: string;
  clubs?: {
    id: string;
    name: string;
  };
}

interface Application {
  id: string;
  personal_info: any;
  documents: any[];
}

interface ProfileEditFormCompleteProps {
  athlete: Athlete;
  application?: Application | null;
}

interface DocumentInfo {
  url: string;
  file_name: string;
  file_size: number;
}

export default function ProfileEditFormComplete({ athlete, application }: ProfileEditFormCompleteProps) {
  const router = useRouter();
  
  // Initialize personal info from athlete data
  const initialPersonalInfo: PersonalInfoInput = {
    full_name: `${athlete.first_name} ${athlete.last_name}`,
    nickname: athlete.nickname || '',
    gender: athlete.gender as 'male' | 'female' | 'other',
    date_of_birth: athlete.date_of_birth,
    phone_number: athlete.phone_number,
    address: (application?.personal_info as any)?.address || '',
    emergency_contact: (application?.personal_info as any)?.emergency_contact || '',
    blood_type: (application?.personal_info as any)?.blood_type || '',
    medical_conditions: athlete.health_notes || (application?.personal_info as any)?.medical_conditions || '',
  };

  // Initialize documents from application
  const getDocumentUrl = (type: string) => {
    if (!application?.documents) return null;
    const doc = (application.documents as any[]).find((d: any) => d.type === type);
    return doc ? { url: doc.url, file_name: doc.file_name || '', file_size: doc.file_size || 0 } : null;
  };

  const [personalInfo, setPersonalInfo] = useState<PersonalInfoInput>(initialPersonalInfo);
  const [documents, setDocuments] = useState({
    id_card: getDocumentUrl('id_card'),
    house_registration: getDocumentUrl('house_registration'),
    birth_certificate: getDocumentUrl('birth_certificate'),
    parent_id_card: getDocumentUrl('parent_id_card'),
    parent_house_registration: getDocumentUrl('parent_house_registration'),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'personal' | 'documents'>('personal');

  const handleDocumentChange = (
    documentType: 'id_card' | 'house_registration' | 'birth_certificate' | 'parent_id_card' | 'parent_house_registration',
    documentInfo: DocumentInfo | null
  ) => {
    setDocuments((prev) => ({
      ...prev,
      [documentType]: documentInfo,
    }));
  };

  const validatePersonalInfo = (): boolean => {
    try {
      personalInfoSchema.parse(personalInfo);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePersonalInfo()) {
      setActiveTab('personal');
      setError('กรุณาตรวจสอบข้อมูลส่วนตัวให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateAthleteProfileComplete(athlete.id, {
        personalInfo,
        documents,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/athlete/profile');
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์');
      console.error('Profile update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>แก้ไขข้อมูลโปรไฟล์</CardTitle>
          <CardDescription>
            อัปเดตข้อมูลส่วนตัวและเอกสารของคุณ
          </CardDescription>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4 border-b">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'personal'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              ข้อมูลส่วนตัว
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              เอกสาร
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">บันทึกสำเร็จ!</p>
                <p className="text-xs text-green-700 mt-1">กำลังนำคุณกลับไปหน้าโปรไฟล์...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              {/* Profile Picture Upload */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">รูปโปรไฟล์</h3>
                <ProfilePictureUpload
                  userId={athlete.user_id}
                  currentPictureUrl={athlete.profile_picture_url}
                  onUploadSuccess={() => {
                    // Refresh page to show new picture
                    router.refresh();
                  }}
                />
              </div>

              <PersonalInfoForm
                value={personalInfo}
                onChange={setPersonalInfo}
                errors={validationErrors}
              />

              {/* Read-only fields */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700 mb-4">
                  ข้อมูลที่ไม่สามารถแก้ไขได้
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-600">อีเมล</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {athlete.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">สโมสร</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {athlete.clubs?.name || 'ไม่ระบุ'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  หากต้องการเปลี่ยนแปลงข้อมูลเหล่านี้ กรุณาติดต่อผู้ดูแลระบบหรือโค้ช
                </p>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  📸 คุณสามารถอัปโหลดเอกสารใหม่เพื่อแทนที่เอกสารเดิมได้
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">เอกสารนักกีฬา</h3>
                  <div className="space-y-4">
                    <DocumentUpload
                      documentType="id_card"
                      value={documents.id_card?.url}
                      onChange={(url, fileName, fileSize) =>
                        handleDocumentChange('id_card', url ? { url, file_name: fileName || '', file_size: fileSize || 0 } : null)
                      }
                      userId={athlete.user_id}
                    />

                    <DocumentUpload
                      documentType="house_registration"
                      value={documents.house_registration?.url}
                      onChange={(url, fileName, fileSize) =>
                        handleDocumentChange('house_registration', url ? { url, file_name: fileName || '', file_size: fileSize || 0 } : null)
                      }
                      userId={athlete.user_id}
                    />

                    <DocumentUpload
                      documentType="birth_certificate"
                      value={documents.birth_certificate?.url}
                      onChange={(url, fileName, fileSize) =>
                        handleDocumentChange('birth_certificate', url ? { url, file_name: fileName || '', file_size: fileSize || 0 } : null)
                      }
                      userId={athlete.user_id}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">เอกสารผู้ปกครอง</h3>
                  <div className="space-y-4">
                    <DocumentUpload
                      documentType="parent_id_card"
                      value={documents.parent_id_card?.url}
                      onChange={(url, fileName, fileSize) =>
                        handleDocumentChange('parent_id_card', url ? { url, file_name: fileName || '', file_size: fileSize || 0 } : null)
                      }
                      userId={athlete.user_id}
                    />

                    <DocumentUpload
                      documentType="parent_house_registration"
                      value={documents.parent_house_registration?.url}
                      onChange={(url, fileName, fileSize) =>
                        handleDocumentChange('parent_house_registration', url ? { url, file_name: fileName || '', file_size: fileSize || 0 } : null)
                      }
                      userId={athlete.user_id}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || success}
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  บันทึกสำเร็จ
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึกการเปลี่ยนแปลง
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
