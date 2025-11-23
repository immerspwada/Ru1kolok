'use client';

/**
 * Sport Selection Component
 * 
 * Allows athletes to select which sport/club they want to join during registration.
 * Displays available clubs as grid cards with sport name, coach info, and member count.
 * 
 * Features:
 * - Single select (one sport per application as per task requirements)
 * - Search/filter by sport name
 * - Loading states with skeleton loaders
 * - Empty state if no clubs available
 * - Responsive grid layout
 * 
 * Validates: Requirements US-2, NFR-9
 */

import { useEffect, useState } from 'react';
import { getAvailableClubs } from '@/lib/membership/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users, User } from 'lucide-react';

interface Club {
  id: string;
  name: string;
  description: string | null;
  sport_type: string | null;
  member_count: number;
  coach: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface SportSelectionProps {
  onSelect: (clubId: string) => void;
  selectedClubId?: string;
}

export function SportSelection({ onSelect, selectedClubId }: SportSelectionProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClubs();
  }, []);

  useEffect(() => {
    // Filter clubs based on search query
    if (searchQuery.trim() === '') {
      setFilteredClubs(clubs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clubs.filter(
        (club) =>
          club.name.toLowerCase().includes(query) ||
          club.sport_type?.toLowerCase().includes(query) ||
          club.description?.toLowerCase().includes(query)
      );
      setFilteredClubs(filtered);
    }
  }, [searchQuery, clubs]);

  async function loadClubs() {
    setLoading(true);
    setError(null);

    const result = await getAvailableClubs();

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setClubs(result.data || []);
    setFilteredClubs(result.data || []);
    setLoading(false);
  }

  const handleSelectClub = (clubId: string) => {
    onSelect(clubId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadClubs}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่มีกีฬาที่เปิดรับสมัคร</h3>
        <p className="text-gray-600">ขณะนี้ยังไม่มีกีฬาที่เปิดรับสมัครสมาชิก</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="ค้นหากีฬา..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className="text-sm text-gray-600">
          พบ {filteredClubs.length} กีฬา{filteredClubs.length !== clubs.length && ` จาก ${clubs.length} กีฬา`}
        </p>
      )}

      {/* Empty Search Results */}
      {filteredClubs.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่พบกีฬาที่ค้นหา</h3>
          <p className="text-gray-600">ลองค้นหาด้วยคำอื่น</p>
        </div>
      )}

      {/* Club Grid */}
      {filteredClubs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClubs.map((club) => (
            <Card
              key={club.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedClubId === club.id
                  ? 'ring-2 ring-blue-600 border-blue-600'
                  : 'hover:border-gray-400'
              }`}
              onClick={() => handleSelectClub(club.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{club.name}</span>
                  {selectedClubId === club.id && (
                    <span className="text-blue-600 text-sm font-normal">✓ เลือกแล้ว</span>
                  )}
                </CardTitle>
                {club.sport_type && (
                  <CardDescription className="text-sm text-gray-600">
                    {club.sport_type}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Description */}
                {club.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{club.description}</p>
                )}

                {/* Coach Info */}
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {club.coach
                      ? `โค้ช: ${club.coach.first_name} ${club.coach.last_name}`
                      : 'ยังไม่มีโค้ช'}
                  </span>
                </div>

                {/* Member Count */}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    สมาชิก: {club.member_count} คน
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
