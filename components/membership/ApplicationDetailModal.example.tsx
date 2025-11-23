/**
 * ApplicationDetailModal - Example Usage
 * 
 * This file demonstrates how to use the ApplicationDetailModal component
 * in different scenarios.
 */

'use client';

import { useState } from 'react';
import { ApplicationDetailModal } from './ApplicationDetailModal';
import { Button } from '@/components/ui/button';
import { MembershipApplication } from '@/types/database.types';

// Example 1: Read-Only View (for Athletes)
export function AthleteApplicationView() {
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);

  // Mock application data
  const mockApplication: any = {
    id: '123',
    user_id: 'user-123',
    club_id: 'club-123',
    status: 'pending',
    personal_info: {
      full_name: 'สมชาย ใจดี',
      phone_number: '081-234-5678',
      address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
      emergency_contact: '089-999-9999',
    },
    documents: [
      {
        type: 'id_card',
        url: 'https://example.com/id.jpg',
        file_name: 'id_card.jpg',
        file_size: 1024000,
        uploaded_at: new Date().toISOString(),
      },
      {
        type: 'house_registration',
        url: 'https://example.com/house.jpg',
        file_name: 'house_reg.jpg',
        file_size: 2048000,
        uploaded_at: new Date().toISOString(),
      },
      {
        type: 'birth_certificate',
        url: 'https://example.com/birth.pdf',
        file_name: 'birth_cert.pdf',
        file_size: 512000,
        uploaded_at: new Date().toISOString(),
      },
    ],
    activity_log: [
      {
        timestamp: new Date().toISOString(),
        action: 'submitted',
        by_user: 'user-123',
        by_role: 'athlete',
        details: { club_id: 'club-123' },
      },
    ],
    clubs: {
      name: 'สโมสรฟุตบอล',
      sport_type: 'ฟุตบอล',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div>
      <Button onClick={() => setSelectedApp(mockApplication)}>
        ดูรายละเอียดใบสมัคร
      </Button>

      <ApplicationDetailModal
        application={selectedApp}
        onApprove={async (id) => {}}
        onReject={async (id, reason) => {}}
        onClose={() => setSelectedApp(null)}
        isCoach={false} // Read-only for athletes
      />
    </div>
  );
}

// Example 2: Coach Review View (with Actions)
export function CoachApplicationReview() {
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);

  // Mock application data
  const mockApplication: any = {
    id: '456',
    user_id: 'user-456',
    club_id: 'club-456',
    status: 'pending',
    personal_info: {
      full_name: 'สมหญิง รักกีฬา',
      phone_number: '082-345-6789',
      address: '456 ถนนพระราม 4 กรุงเทพฯ 10120',
      emergency_contact: '088-888-8888',
      date_of_birth: '2005-05-15',
      blood_type: 'O',
      medical_conditions: 'ไม่มีโรคประจำตัว',
    },
    documents: [
      {
        type: 'id_card',
        url: 'https://example.com/id2.jpg',
        file_name: 'id_card.jpg',
        file_size: 1536000,
        uploaded_at: new Date().toISOString(),
        is_verified: false,
      },
      {
        type: 'house_registration',
        url: 'https://example.com/house2.jpg',
        file_name: 'house_reg.jpg',
        file_size: 1024000,
        uploaded_at: new Date().toISOString(),
        is_verified: false,
      },
      {
        type: 'birth_certificate',
        url: 'https://example.com/birth2.pdf',
        file_name: 'birth_cert.pdf',
        file_size: 768000,
        uploaded_at: new Date().toISOString(),
        is_verified: false,
      },
    ],
    activity_log: [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        action: 'submitted',
        by_user: 'user-456',
        by_role: 'athlete',
        details: { club_id: 'club-456', document_count: 3 },
      },
    ],
    clubs: {
      name: 'สโมสรบาสเกตบอล',
      sport_type: 'บาสเกตบอล',
    },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  };

  const handleApprove = async (applicationId: string) => {
    console.log('Application approved!', applicationId);
    // Show success toast
    alert('อนุมัติใบสมัครเรียบร้อยแล้ว');
    // Refresh data or navigate
    setSelectedApp(null);
  };

  const handleReject = async (applicationId: string, reason: string) => {
    console.log('Application rejected!', applicationId, reason);
    // Show success toast
    alert('ปฏิเสธใบสมัครเรียบร้อยแล้ว');
    // Refresh data or navigate
    setSelectedApp(null);
  };

  return (
    <div>
      <Button onClick={() => setSelectedApp(mockApplication)}>
        พิจารณาใบสมัคร
      </Button>

      <ApplicationDetailModal
        onApprove={async (id) => {}}
        onReject={async (id, reason) => {}}
        application={selectedApp}
        onApprove={handleApprove}
        onReject={handleReject}
        onClose={() => setSelectedApp(null)}
        isCoach={true} // Enable approve/reject actions
      />
    </div>
  );
}

// Example 3: Rejected Application View
export function RejectedApplicationView() {
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);

  // Mock rejected application
  const mockApplication: any = {
    id: '789',
    user_id: 'user-789',
    club_id: 'club-789',
    status: 'rejected',
    personal_info: {
      full_name: 'สมศักดิ์ พยายาม',
      phone_number: '083-456-7890',
      address: '789 ถนนสีลม กรุงเทพฯ 10500',
      emergency_contact: '087-777-7777',
    },
    documents: [
      {
        type: 'id_card',
        url: 'https://example.com/id3.jpg',
        file_name: 'id_card.jpg',
        file_size: 2048000,
        uploaded_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        type: 'house_registration',
        url: 'https://example.com/house3.jpg',
        file_name: 'house_reg.jpg',
        file_size: 1536000,
        uploaded_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        type: 'birth_certificate',
        url: 'https://example.com/birth3.pdf',
        file_name: 'birth_cert.pdf',
        file_size: 1024000,
        uploaded_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    activity_log: [
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        action: 'submitted',
        by_user: 'user-789',
        by_role: 'athlete',
        details: { club_id: 'club-789' },
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        action: 'status_changed',
        by_user: 'coach-123',
        by_role: 'coach',
        from: 'pending',
        to: 'rejected',
        notes: 'รูปบัตรประชาชนไม่ชัดเจน กรุณาอัปโหลดใหม่',
      },
    ],
    review_info: {
      reviewed_by: 'coach-123',
      reviewed_at: new Date(Date.now() - 3600000).toISOString(),
      reviewer_role: 'coach',
      notes: 'รูปบัตรประชาชนไม่ชัดเจน กรุณาอัปโหลดใหม่',
    },
    clubs: {
      name: 'สโมสรว่ายน้ำ',
      sport_type: 'ว่ายน้ำ',
    },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  };

  return (
    <div>
      <Button variant="outline" onClick={() => setSelectedApp(mockApplication)}>
        ดูใบสมัครที่ถูกปฏิเสธ
      </Button>

      <ApplicationDetailModal
        onApprove={async (id) => {}}
        onReject={async (id, reason) => {}}
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        isCoach={false}
      />
    </div>
  );
}

// Example 4: Approved Application View
export function ApprovedApplicationView() {
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);

  // Mock approved application
  const mockApplication: any = {
    id: '101',
    user_id: 'user-101',
    club_id: 'club-101',
    status: 'approved',
    personal_info: {
      full_name: 'สมปอง สำเร็จ',
      phone_number: '084-567-8901',
      address: '101 ถนนเพชรบุรี กรุงเทพฯ 10400',
      emergency_contact: '086-666-6666',
      date_of_birth: '2004-08-20',
      blood_type: 'A',
    },
    documents: [
      {
        type: 'id_card',
        url: 'https://example.com/id4.jpg',
        file_name: 'id_card.jpg',
        file_size: 1024000,
        uploaded_at: new Date(Date.now() - 172800000).toISOString(),
        is_verified: true,
      },
      {
        type: 'house_registration',
        url: 'https://example.com/house4.jpg',
        file_name: 'house_reg.jpg',
        file_size: 2048000,
        uploaded_at: new Date(Date.now() - 172800000).toISOString(),
        is_verified: true,
      },
      {
        type: 'birth_certificate',
        url: 'https://example.com/birth4.pdf',
        file_name: 'birth_cert.pdf',
        file_size: 512000,
        uploaded_at: new Date(Date.now() - 172800000).toISOString(),
        is_verified: true,
      },
    ],
    activity_log: [
      {
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        action: 'submitted',
        by_user: 'user-101',
        by_role: 'athlete',
        details: { club_id: 'club-101' },
      },
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        action: 'status_changed',
        by_user: 'coach-456',
        by_role: 'coach',
        from: 'pending',
        to: 'approved',
        notes: 'เอกสารครบถ้วน อนุมัติ',
      },
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        action: 'profile_created',
        by_user: 'user-101',
        by_role: 'athlete',
        details: { profile_id: 'profile-101', club_id: 'club-101' },
      },
    ],
    review_info: {
      reviewed_by: 'coach-456',
      reviewed_at: new Date(Date.now() - 86400000).toISOString(),
      reviewer_role: 'coach',
      notes: 'เอกสารครบถ้วน อนุมัติ',
    },
    profile_id: 'profile-101',
    clubs: {
      name: 'สโมสรเทนนิส',
      sport_type: 'เทนนิส',
    },
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  };

  return (
    <div>
      <Button variant="outline" onClick={() => setSelectedApp(mockApplication)}>
        ดูใบสมัครที่อนุมัติแล้ว
      </Button>

      <ApplicationDetailModal
        onApprove={async (id) => {}}
        onReject={async (id, reason) => {}}
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        isCoach={false}
      />
    </div>
  );
}

// Example 5: Integration with ApplicationList
export function ApplicationListIntegration() {
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);

  // Mock applications list
  const applications: any[] = [
    {
      id: '1',
      status: 'pending',
      personal_info: { full_name: 'นักกีฬา 1' },
      clubs: { name: 'สโมสร A', sport_type: 'กีฬา A' },
      documents: [],
      activity_log: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      status: 'approved',
      personal_info: { full_name: 'นักกีฬา 2' },
      clubs: { name: 'สโมสร B', sport_type: 'กีฬา B' },
      documents: [],
      activity_log: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  return (
    <div>
      <div className="space-y-2">
        {applications.map((app) => (
          <Button
            key={app.id}
            variant="outline"
            onClick={() => setSelectedApp(app)}
            className="w-full justify-start"
          >
            {app.personal_info.full_name} - {app.clubs.name} ({app.status})
          </Button>
        ))}
      </div>

      <ApplicationDetailModal
        onApprove={async (id) => {}}
        onReject={async (id, reason) => {}}
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        isCoach={true}
        onApprove={() => {
          alert('Approved!');
          setSelectedApp(null);
        }}
        onReject={() => {
          alert('Rejected!');
          setSelectedApp(null);
        }}
      />
    </div>
  );
}
