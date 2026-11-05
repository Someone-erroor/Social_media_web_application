'use client';

import { useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import { ROUTES } from '@/lib/routes';

/**
 * Reusable modal for inspecting Followers and Following user lists.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal dialog is open
 * @param {function} props.onClose - Modal close handler
 * @param {'followers'|'following'} props.type - List type
 * @param {Array<object>} props.users - List of users
 * @param {boolean} props.loading - Loading indicator
 * @param {string} props.profileName - Name of the profile owner
 */
export default function UserListModal({
  isOpen,
  onClose,
  type = 'followers',
  users = [],
  loading = false,
  profileName = 'User'
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const isFollowers = type === 'followers';
  const title = isFollowers ? 'Followers' : 'Following';
  const description = isFollowers
    ? `People following ${profileName}`
    : `People followed by ${profileName}`;

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = u.fullName?.toLowerCase().includes(q);
    const bioMatch = u.profile?.bio?.toLowerCase().includes(q);
    return nameMatch || bioMatch;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
    >
      <div className="space-y-4">
        {/* Search filter if more than 3 users */}
        {users.length > 3 && (
          <div className="pb-1">
            <Input
              id="user-list-search"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Icon name="search" className="w-4 h-4" />}
            />
          </div>
        )}

        {/* Content list */}
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#101A22] border border-[#263640] animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-[#1D2A35]" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-3.5 bg-[#1D2A35] rounded" />
                  <div className="w-48 h-2.5 bg-[#1D2A35]/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-6">
            <EmptyState
              icon="profile"
              title={
                searchQuery
                  ? 'No matching members'
                  : isFollowers
                  ? 'No followers yet'
                  : 'Not following anyone yet'
              }
              description={
                searchQuery
                  ? `No members found matching "${searchQuery}".`
                  : isFollowers
                  ? `${profileName} does not have any followers yet.`
                  : `${profileName} is not following anyone yet.`
              }
            />
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {filteredUsers.map((item) => (
              <Link
                key={item._id}
                href={ROUTES.USER.USER_PROFILE(item._id)}
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-xl bg-[#101A22] border border-[#263640] hover:border-[#19D3E3]/40 hover:bg-[#1D2A35] transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar
                    name={item.fullName}
                    src={item.profile?.avatarUrl}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#F4F8FA] group-hover:text-[#19D3E3] transition-colors truncate">
                      {item.fullName}
                    </p>
                    {item.profile?.bio ? (
                      <p className="text-xs text-[#9BAAB4] truncate max-w-sm">
                        {item.profile.bio}
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#9BAAB4]/60 italic">
                        Member
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <span className="text-xs font-semibold text-[#19D3E3] group-hover:underline flex items-center gap-1">
                    <span>View</span>
                    <Icon name="arrowRight" className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

