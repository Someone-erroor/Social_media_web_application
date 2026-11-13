'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { moodOrbitService } from '@/services/moodOrbitService';
import { ROUTES } from '@/lib/routes';

const MOODS = [
  { id: '', label: 'All Orbits', icon: 'sparkles', desc: 'Browse all active atmospheric spaces' },
  { id: 'creative', label: 'Creative', icon: 'edit', accent: '#6C63FF', desc: 'Making, designing, and brainstorming' },
  { id: 'curious', label: 'Curious', icon: 'search', accent: '#4CAF78', desc: 'Inquiring, learning, and discovering' },
  { id: 'chill', label: 'Chill', icon: 'heart', accent: '#0284C7', desc: 'Unwinding, listening, and easy presence' },
  { id: 'energized', label: 'Energized', icon: 'sparkles', accent: '#FFD166', desc: 'High motivation, active sharing' },
  { id: 'focused', label: 'Focused', icon: 'clock', accent: '#6C63FF', desc: 'Deep work, study, and silent accountability' },
  { id: 'reflective', label: 'Reflective', icon: 'eye', accent: '#FF6B6B', desc: 'Perspective, journal thoughts, mindful check-ins' }
];

function formatExpiryCountdown(expiresAt) {
  if (!expiresAt) return 'Temporary';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export default function MoodOrbitPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [selectedMood, setSelectedMood] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Room Creation State
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    mood: 'creative',
    intention: '',
    prompt: '',
    maxParticipants: 20,
    durationHours: 4,
    ambientTheme: 'twilight'
  });

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await moodOrbitService.getRooms({
        mood: selectedMood,
        status: 'active'
      });
      if (res?.success) {
        setRooms(res.rooms || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load active Mood-Orbit rooms.');
    } finally {
      setLoading(false);
    }
  }, [selectedMood]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!formData.name.trim()) {
      setCreateError('Space name is required.');
      return;
    }
    if (!formData.intention.trim()) {
      setCreateError('Space atmosphere intention is required.');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await moodOrbitService.createRoom({
        name: formData.name.trim(),
        mood: formData.mood,
        intention: formData.intention.trim(),
        prompt: formData.prompt.trim(),
        maxParticipants: formData.maxParticipants,
        durationHours: formData.durationHours,
        ambientTheme: formData.ambientTheme
      });

      if (res?.success && res.room?._id) {
        setShowCreateModal(false);
        router.push(ROUTES.USER.MOOD_ORBIT_ROOM(res.room._id));
      } else {
        throw new Error(res?.message || 'Failed to open space.');
      }
    } catch (err) {
      setCreateError(err.message || 'Error opening Mood-Orbit space.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <PageHeader
        title="Mood-Orbit Spaces"
        description="Temporary social spaces organized by shared emotional atmosphere and intention. Enter an orbit to share ideas, presence, or quiet inspiration."
        badge={
          <Badge variant="lime" size="sm">
            Live Atmospheric Spaces
          </Badge>
        }
        action={
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            icon={<Icon name="sparkles" className="w-4 h-4" />}
          >
            Open New Space
          </Button>
        }
      />

      {/* Mood Selector Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E7E5E0] scrollbar-none">
        {MOODS.map((m) => {
          const isActive = selectedMood === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMood(m.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/30 font-bold shadow-2xs'
                  : 'bg-white border border-[#E7E5E0] text-[#6B6B73] hover:text-[#1E1E24]'
              }`}
            >
              <Icon name={m.icon} className={`w-3.5 h-3.5 ${isActive ? 'text-[#6C63FF]' : 'text-[#6B6B73]'}`} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FFEAEA] border border-[#FF6B6B]/30 text-xs text-[#FF6B6B]">
          {error}
        </div>
      )}

      {/* Rooms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-white border border-[#E7E5E0] animate-pulse" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon="sparkles"
          title="No Active Rooms in this Orbit"
          description={
            selectedMood
              ? `There are currently no active spaces tuned to the "${selectedMood}" mood. Open the first space and invite fellow members!`
              : 'There are currently no active Mood-Orbit rooms open. Open the first atmospheric space!'
          }
          badgeText="Atmospheric Presence"
          action={
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              Open New Space
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const isFull = room.status === 'full';
            const capacityRatio = Math.min(100, Math.round(((room.participantsCount || 1) / (room.maxParticipants || 20)) * 100));

            return (
              <Card
                key={room._id}
                className="bg-white border-[#E7E5E0] hover:border-[#6C63FF]/40 transition-all flex flex-col justify-between shadow-xs group"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-[#EEEAFE] text-[#6C63FF]">
                        <Icon name="sparkles" className="w-4 h-4" />
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F8F7F4] border border-[#E7E5E0] text-[#6C63FF] font-mono">
                        {room.mood}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-[#6B6B73] flex items-center gap-1">
                      <Icon name="clock" className="w-3.5 h-3.5 text-[#FF6B6B]" />
                      {formatExpiryCountdown(room.expiresAt)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-[#1E1E24] font-display group-hover:text-[#6C63FF] transition-colors line-clamp-1">
                      <Link href={ROUTES.USER.MOOD_ORBIT_ROOM(room._id)}>
                        {room.name}
                      </Link>
                    </h2>
                    <p className="text-xs text-[#6B6B73] line-clamp-2 leading-relaxed">
                      {room.intention}
                    </p>
                  </div>

                  {room.prompt && (
                    <div className="p-2.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-[11px] text-[#6C63FF] italic line-clamp-1">
                      "{room.prompt}"
                    </div>
                  )}

                  {/* Presence & Capacity Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#6B6B73] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF78] animate-pulse" />
                        Presence
                      </span>
                      <span className="font-mono text-[#1E1E24]">
                        {room.participantsCount || 0} / {room.maxParticipants} seats
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-[#F1F0EC] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull ? 'bg-[#FF6B6B]' : 'bg-[#4CAF78]'
                        }`}
                        style={{ width: `${capacityRatio}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-[#E7E5E0]">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={room.creator?.fullName || 'Host'}
                        src={room.creator?.profile?.avatarUrl}
                        size="xs"
                      />
                      <span className="text-[11px] text-[#6B6B73] truncate max-w-[100px]">
                        {room.creator?.fullName || 'Member'}
                      </span>
                    </div>

                    <Link href={ROUTES.USER.MOOD_ORBIT_ROOM(room._id)}>
                      <Button
                        type="button"
                        size="sm"
                        variant={isFull ? 'outline' : 'primary'}
                      >
                        {isFull ? 'Room Full' : 'Enter Space'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-lg bg-white border border-[#E7E5E0] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E0]">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#6C63FF]">Orbit Launch</span>
                <h3 className="text-base font-bold text-[#1E1E24]">Open Mood-Orbit Space</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#6B6B73] hover:text-[#1E1E24] p-1 cursor-pointer"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-[#FFEAEA] border border-[#FF6B6B]/30 text-xs text-[#FF6B6B]">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#1E1E24]">Space Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Late Night Ambient Sketching"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-[#1E1E24] focus:outline-none focus:border-[#6C63FF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#1E1E24]">Emotional Atmosphere / Mood *</label>
                  <select
                    value={formData.mood}
                    onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-[#1E1E24] focus:outline-none focus:border-[#6C63FF]"
                  >
                    <option value="creative">Creative (Making &amp; Designing)</option>
                    <option value="curious">Curious (Questions &amp; Learning)</option>
                    <option value="chill">Chill (Listening &amp; Calm Presence)</option>
                    <option value="energized">Energized (Active Drive &amp; Momentum)</option>
                    <option value="focused">Focused (Quiet Productivity)</option>
                    <option value="reflective">Reflective (Mindful Perspective)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#1E1E24]">Duration (Hours)</label>
                  <select
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: parseInt(e.target.value, 10) || 4 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-[#1E1E24] focus:outline-none focus:border-[#6C63FF]"
                  >
                    <option value="1">1 Hour</option>
                    <option value="2">2 Hours</option>
                    <option value="4">4 Hours (Default)</option>
                    <option value="8">8 Hours</option>
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours (Full Orbit)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1E1E24]">Room Intention *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.intention}
                  onChange={(e) => setFormData({ ...formData, intention: e.target.value })}
                  placeholder="What is the shared purpose or atmosphere of this space?"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-[#1E1E24] focus:outline-none focus:border-[#6C63FF]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1E1E24]">Custom Mood Prompt (Optional)</label>
                <input
                  type="text"
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="Leave blank to use recommended default prompt..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E0] text-[#1E1E24] focus:outline-none focus:border-[#6C63FF]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#1E1E24]">Participant Capacity</label>
                  <span className="font-mono text-[#6C63FF]">{formData.maxParticipants} seats</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value, 10) || 20 })}
                  className="w-full accent-[#6C63FF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E7E5E0]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={createLoading}
                >
                  {createLoading ? 'Opening Space...' : 'Open Orbit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
