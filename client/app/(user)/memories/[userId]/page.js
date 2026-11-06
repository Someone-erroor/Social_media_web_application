'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Card, { CardContent } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { memoryService } from '@/services/memoryService';
import { ROUTES } from '@/lib/routes';

export default function MemoriesPage({ params }) {
  const unwrappedParams = use(params);
  const targetUserId = unwrappedParams.userId;
  const { user: currentUser } = useAuth();

  const [milestonesData, setMilestonesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!targetUserId) return;
    setLoading(true);
    setError('');

    memoryService
      .getFriendshipMilestones(targetUserId)
      .then((res) => {
        if (res?.success) {
          setMilestonesData(res);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load friendship memories.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [targetUserId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-32 rounded-2xl bg-[#151F29]" />
        <div className="h-64 rounded-2xl bg-[#151F29]" />
      </div>
    );
  }

  if (error || !milestonesData) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="p-4 rounded-xl bg-[#FF5C70]/10 border border-[#FF5C70]/30 text-xs text-[#FF5C70] max-w-md mx-auto">
          {error || 'Unable to retrieve friendship history.'}
        </div>
        <Link href={ROUTES.USER.USER_PROFILE(targetUserId)}>
          <Button type="button" variant="outline" size="sm">
            Back to Profile
          </Button>
        </Link>
      </div>
    );
  }

  const { targetUser, connection, mutualCircles, sharedGames, milestones } = milestonesData;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href={ROUTES.USER.USER_PROFILE(targetUserId)}
          className="inline-flex items-center gap-1.5 text-xs text-[#9BAAB4] hover:text-[#19D3E3] transition-colors"
        >
          <Icon name="arrowLeft" className="w-4 h-4" />
          Back to {targetUser?.fullName}&apos;s Profile
        </Link>
        <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#19D3E3]/15 text-[#19D3E3] border border-[#19D3E3]/30">
          Friendship Vault
        </span>
      </div>

      {/* Hero Friendship Banner */}
      <Card className="bg-[#101A22] border-[#263640] shadow-xl overflow-hidden text-center">
        <div className="h-20 bg-gradient-to-r from-[#19D3E3]/30 via-[#101A22] to-[#FF6F61]/30" />
        <CardContent className="pt-0 pb-8 px-6 space-y-4 -mt-10">
          <div className="flex items-center justify-center -space-x-4">
            <div className="ring-4 ring-[#101A22] rounded-full">
              <Avatar
                name={currentUser?.fullName || 'You'}
                src={currentUser?.profile?.avatarUrl}
                size="lg"
              />
            </div>
            <div className="w-8 h-8 rounded-full bg-[#19D3E3] text-[#080D12] flex items-center justify-center font-bold text-xs z-10 shadow-md">
              ✨
            </div>
            <div className="ring-4 ring-[#101A22] rounded-full">
              <Avatar
                name={targetUser?.fullName || 'Friend'}
                src={targetUser?.avatarUrl}
                size="lg"
              />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold text-[#F4F8FA]">
              {currentUser?.fullName} & {targetUser?.fullName}
            </h1>
            <p className="text-xs text-[#19D3E3] font-semibold">
              Connected on Looply for {connection?.daysConnected || 0} days
            </p>
            {connection?.sinceDate && (
              <p className="text-[11px] text-[#9BAAB4]">
                Since {new Date(connection.sinceDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestones & Badges Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4F8FA] flex items-center gap-2">
          <Icon name="sparkles" className="w-4 h-4 text-[#19D3E3]" />
          Shared Milestones
        </h2>

        {milestones && milestones.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#151F29] border border-[#263640] space-y-2 hover:border-[#19D3E3]/40 transition-colors"
              >
                <div className="text-2xl">{m.icon || '🏅'}</div>
                <h3 className="text-xs font-bold text-[#F4F8FA]">{m.title}</h3>
                <p className="text-[11px] text-[#9BAAB4] leading-relaxed">{m.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#9BAAB4] italic">
            Play games or join mutual circles together to unlock friendship milestones!
          </p>
        )}
      </div>

      {/* Mutual Circles & Shared Games Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mutual Circles */}
        <Card className="bg-[#151F29] border-[#263640]">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F4F8FA] flex items-center gap-2">
              <Icon name="circles" className="w-4 h-4 text-[#19D3E3]" />
              Mutual Circles ({mutualCircles?.length || 0})
            </h3>
            {mutualCircles && mutualCircles.length > 0 ? (
              <div className="space-y-2">
                {mutualCircles.map((circle) => (
                  <Link
                    key={circle._id}
                    href={ROUTES.USER.CIRCLE_DETAIL(circle.slug)}
                    className="p-2.5 rounded-xl bg-[#101A22] border border-[#263640] flex items-center justify-between hover:border-[#19D3E3]/40 transition-colors block"
                  >
                    <span className="text-xs font-semibold text-[#F4F8FA]">{circle.name}</span>
                    <span className="text-[10px] text-[#19D3E3] uppercase">{circle.category}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#9BAAB4]">No mutual circles yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Shared Challenges Played */}
        <Card className="bg-[#151F29] border-[#263640]">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F4F8FA] flex items-center gap-2">
              <Icon name="play" className="w-4 h-4 text-[#19D3E3]" />
              Games & Challenges Together ({sharedGames?.length || 0})
            </h3>
            {sharedGames && sharedGames.length > 0 ? (
              <div className="space-y-2">
                {sharedGames.map((game) => (
                  <div
                    key={game._id}
                    className="p-2.5 rounded-xl bg-[#101A22] border border-[#263640] flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-[#F4F8FA] truncate max-w-[180px]">
                      {game.title}
                    </span>
                    <span className="text-[11px] font-bold text-[#19D3E3]">
                      {game.score || 100} pts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#9BAAB4]">No challenges completed together yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

