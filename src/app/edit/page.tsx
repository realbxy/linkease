'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { saveProfile, loadProfile, resetProfile, Profile, SocialLink, Badge } from './../utils/profileStorage';
import { v4 as uuidv4 } from 'uuid';
import { useAudio } from './../providers/AudioProvider';
import { Modal } from './../components/Modal';
import Toast from './../components/Toast';
import { FiUser, FiEdit3, FiMusic, FiLink2, FiUpload, FiLink, FiTrash2, FiPlay, FiPause, FiFileText, FiPlus } from 'react-icons/fi';


function toDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === 'string' ? res(reader.result) : rej());
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: Section[] = [
  { id: 'profile', label: 'Profile Info', icon: <FiUser /> },
  { id: 'appearance', label: 'Appearance', icon: <FiEdit3 /> },
  { id: 'audio', label: 'Background Audio', icon: <FiMusic /> },
  { id: 'badges', label: 'Badges', icon: <FiFileText /> },
  { id: 'socials', label: 'Social Links', icon: <FiLink2 /> },
];

export default function EditPage() {
  const initial = useMemo(() => loadProfile(), []);
  const [profile, setProfile] = useState<Profile>(initial);
  const avatarRef = useRef<HTMLInputElement | null>(null);
  const bgRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLInputElement | null>(null);
  const audioCtx = useAudio();
  const setAudioSrc = (src?: string) => {
    try {
      ((audioCtx as any).setSrc as (s?: string) => void)?.(src);
    } catch {}
  };
  const setVolume = audioCtx.setVolume;

  const [modal, setModal] = useState<'avatarUrl' | 'bgUrl' | 'social' | 'badgeImage' | 'confirmDelete' | null>(null);
  const [tempUrl, setTempUrl] = useState('');
  const [tempBadgeUrl, setTempBadgeUrl] = useState('');
  const badgeFileRef = useRef<HTMLInputElement | null>(null);
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [hoveredBadgeName, setHoveredBadgeName] = useState<string | null>(null);
  const [tempSocial, setTempSocial] = useState({ icon: '', label: '', href: '' });
  const [toast, setToast] = useState<{ visible: boolean; message: string; tone?: 'success' | 'error' }>({ visible: false, message: '', tone: 'success' });
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  useEffect(() => {
    if (profile?.bgAudio) {
      setAudioSrc(profile.bgAudio);
      setVolume(profile.volume ?? 0.35);
    }
  }, [profile?.bgAudio, profile?.volume]);

  const update = (patch: Partial<Profile>) => {
    setProfile((p) => {
      const np = { ...p, ...patch };
      try {
        saveProfile(np);
      } catch {}
      return np;
    });
  };

  const addSocialModal = () => {
    setTempSocial({ icon: '', label: '', href: '' });
    setModal('social');
  };

  /* ---------- Badges helpers ---------- */
  const addTextBadge = () => {
    const nb: Badge = { id: uuidv4(), name: 'New Badge' };
    const np = { ...profile, badges: [...profile.badges, nb] };
    setProfile(np);
    saveProfile(np);
  };

  const openBadgeImageModal = () => {
    setTempBadgeUrl('');
    setModal('badgeImage');
  };

  const applyBadgeUrl = () => {
    if (!tempBadgeUrl) return showToastError('Paste a valid image URL');
    if (editingBadgeId) {
      const newBadges = profile.badges.map((b) => (b.id === editingBadgeId ? { ...b, image: tempBadgeUrl } : b));
      const np = { ...profile, badges: newBadges };
      setProfile(np);
      saveProfile(np);
      setModal(null);
      setEditingBadgeId(null);
      showToast('Badge updated');
      return;
    }
    const nb: Badge = { id: uuidv4(), image: tempBadgeUrl, name: '' };
    const np = { ...profile, badges: [...profile.badges, nb] };
    setProfile(np);
    saveProfile(np);
    setModal(null);
    showToast('Badge added');
  };

  const onBadgeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await toDataUrl(f);
    if (editingBadgeId) {
      const newBadges = profile.badges.map((b) => (b.id === editingBadgeId ? { ...b, image: url } : b));
      const np = { ...profile, badges: newBadges };
      setProfile(np);
      saveProfile(np);
      setModal(null);
      setEditingBadgeId(null);
      showToast('Badge updated');
      return;
    }
    const nb: Badge = { id: uuidv4(), image: url, name: '' };
    const np = { ...profile, badges: [...profile.badges, nb] };
    setProfile(np);
    saveProfile(np);
    setModal(null);
    showToast('Badge image uploaded');
  };

  const onSocialAdd = () => {
    if (!tempSocial.icon || !tempSocial.label || !tempSocial.href) return showToastError('Fill all social fields');
    const link: SocialLink = { id: uuidv4(), icon: tempSocial.icon, label: tempSocial.label, href: normalizeHref(tempSocial.href) };
    const np = { ...profile, socials: [...profile.socials, link] };
    setProfile(np);
    saveProfile(np);
    setModal(null);
    showToast('Social added');
  };

  /* ---------- Save / Reset ---------- */
  const onSave = () => {
    const ok = saveProfile(profile);
    if (ok) showToast('Profile saved');
    else showToastError('Save failed (too large?)');
  };

  const onReset = () => {
    const def = resetProfile();
    setProfile(def);
    saveProfile(def);
    showToast('Profile reset to defaults');
  };

  /* ---------- Toast helpers ---------- */
  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg, tone: 'success' });
    setTimeout(() => setToast({ visible: false, message: '', tone: 'success' }), 3200);
  };
  const showToastError = (msg: string) => {
    setToast({ visible: true, message: msg, tone: 'error' });
    setTimeout(() => setToast({ visible: false, message: '', tone: 'error' }), 4200);
  };

  /* ---------- Audio controls (local preview) ---------- */
  const playAudio = (src?: string) => {
    if (!audioPlayerRef.current) {
      const a = document.createElement('audio');
      a.style.display = 'none';
      document.body.appendChild(a);
      audioPlayerRef.current = a;
    }
    const el = audioPlayerRef.current!;
    if (src) el.src = src;
    el.volume = profile.volume ?? 0.35;
    el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };
  const pauseAudio = () => {
    if (!audioPlayerRef.current) return;
    audioPlayerRef.current.pause();
    setIsPlaying(false);
  };

  /* ---------- Utilities ---------- */
  const updateSocialField = (id: string, patch: Partial<SocialLink>) => {
    const np = { ...profile, socials: profile.socials.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
    setProfile(np);
    saveProfile(np);
  };

  const removeSocial = (id: string) => {
    const np = { ...profile, socials: profile.socials.filter((s) => s.id !== id) };
    setProfile(np);
    saveProfile(np);
    showToast('Social removed');
  };

  const onRequestDelete = (id: string) => {
    setToDeleteId(id);
    setModal('confirmDelete');
  };

  const confirmDelete = () => {
    if (toDeleteId) removeSocial(toDeleteId);
    setToDeleteId(null);
    setModal(null);
  };

  function normalizeHref(href: string) {
    const trimmed = href.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', id);
    } catch {}
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggingId;
    if (!sourceId) return;
    if (sourceId === targetId) return;
    const items = Array.from(profile.socials);
    const fromIdx = items.findIndex((x) => x.id === sourceId);
    const toIdx = items.findIndex((x) => x.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    const np = { ...profile, socials: items };
    setProfile(np);
    saveProfile(np);
    setDraggingId(null);
  };

  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await toDataUrl(f);
    const np = { ...profile, avatar: url };
    setProfile(np);
    saveProfile(np);
    showToast('Avatar uploaded');
  };

  const onBgFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await toDataUrl(f);
    const np = { ...profile, backgroundImage: url };
    setProfile(np);
    saveProfile(np);
    showToast('Background image uploaded');
  };

  const onAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await toDataUrl(f);
    const np = { ...profile, bgAudio: url };
    setProfile(np);
    saveProfile(np);
    try {
      setAudioSrc(url);
    } catch {}
    showToast('Audio uploaded');
    setTimeout(() => {
      if (!audioPlayerRef.current) {
        const a = document.createElement('audio');
        a.style.display = 'none';
        document.body.appendChild(a);
        audioPlayerRef.current = a;
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = url;
        audioPlayerRef.current.play().catch(() => {});
      }
    }, 120);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#000] to-[#0f0f0f] text-white p-4 md:p-8">
      {/* Header with transition like viewers counter */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 bg-[rgba(6,6,7,0.7)] border border-white/6 rounded-full px-4 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.7)] backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
          <svg className="w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back</span>
        </Link>
        <button onClick={onReset} className="bg-[rgba(6,6,7,0.7)] border border-white/6 rounded-full p-2 shadow-[0_10px_30px_rgba(0,0,0,0.7)] backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300">
          <svg className="w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 0 1 15.186-2m0 0a8.003 8.003 0 0 0-15.186 2m15.186-2v2.5m0-2.5h2.5M4 12a8 8 0 0 0 15.186 2m0 0a8.003 8.003 0 0 1-15.186-2m15.186 2v-2.5m0 2.5h-2.5" />
          </svg>
        </button>
        <button onClick={onSave} className="bg-white/10 border border-white/20 rounded-full px-4 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.7)] backdrop-blur-sm hover:bg-white/20 hover:border-white/40 transition-all duration-300 font-medium text-sm">
          Save
        </button>
      </div>

      <div className="w-full max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-12 text-center pt-4">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">Profile Settings</h1>
          <p className="text-gray-400 text-sm">Customize your profile and see live changes on the right</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Navigation Cards - Left Column */}
          <div className="lg:col-span-1">
            <div className="space-y-2 sticky top-24">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 border font-medium text-sm flex items-center gap-3 ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-white/15 to-white/5 border-white/30 text-white shadow-lg shadow-white/10'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-xl">{section.icon}</span>
                  <span>{section.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content - Middle Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="bg-gradient-to-br from-white/5 to-white/2 rounded-2xl p-8 border border-white/10 backdrop-blur-sm shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:border-white/20 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <FiUser className="text-2xl" />
                  <span>Profile Information</span>
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Display Name</label>
                      <input value={profile.displayName} onChange={(e) => update({ displayName: e.target.value })} className="w-full bg-white/5 px-4 py-3 rounded-xl border border-white/10 text-white focus:border-white/30 focus:bg-white/10 outline-none transition-all duration-300" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Username</label>
                      <input value={profile.username} onChange={(e) => update({ username: e.target.value })} className="w-full bg-white/5 px-4 py-3 rounded-xl border border-white/10 text-white focus:border-white/30 focus:bg-white/10 outline-none transition-all duration-300" placeholder="Your username" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">UID Tag</label>
                      <input value={profile.tag} onChange={(e) => update({ tag: e.target.value })} className="w-full bg-white/5 px-4 py-3 rounded-xl border border-white/10 text-white focus:border-white/30 focus:bg-white/10 outline-none transition-all duration-300" placeholder="Your unique ID" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Tagline</label>
                      <input value={profile.tagline} onChange={(e) => update({ tagline: e.target.value })} className="w-full bg-white/5 px-4 py-3 rounded-xl border border-white/10 text-white focus:border-white/30 focus:bg-white/10 outline-none transition-all duration-300" placeholder="Your tagline" />
                    </div>
                  </div>

                  {/* Avatar Section */}
                  <div className="mt-8 pt-8 border-t border-white/10">
                    <label className="block text-xs text-gray-400 mb-4 font-semibold uppercase tracking-wider">Profile Avatar</label>
                    <div className="flex flex-col gap-4">
                      <div className="relative group w-fit">
                        <img src={profile.avatar} alt="avatar" className="w-32 h-32 rounded-2xl border-2 border-white/10 object-cover shadow-lg group-hover:border-white/30 transition-all duration-300" />
                        <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => avatarRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-sm font-medium transition-all duration-300">
                          <FiUpload size={16} />
                          <span>Upload</span>
                        </button>
                        <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={onAvatarFile} />
                        <button onClick={() => { setTempUrl(profile.avatar ?? ''); setModal('avatarUrl'); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-sm font-medium transition-all duration-300">
                          <FiLink size={16} />
                          <span>URL</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <div className="bg-gradient-to-br from-white/5 to-white/2 rounded-2xl p-8 border border-white/10 backdrop-blur-sm shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:border-white/20 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <FiEdit3 className="text-2xl" />
                  <span>Appearance</span>
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">Background Color</label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/30 transition-all duration-300">
                          <input value={profile.backgroundColor} onChange={(e) => update({ backgroundColor: e.target.value })} type="color" className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                          <span className="text-sm text-gray-300 font-mono">{profile.backgroundColor}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">Card Color</label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/30 transition-all duration-300">
                          <input value={profile.cardColor} onChange={(e) => update({ cardColor: e.target.value })} type="color" className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                          <span className="text-sm text-gray-300 font-mono">{profile.cardColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/10">
                    <label className="block text-xs text-gray-400 mb-4 font-semibold uppercase tracking-wider">Background Image</label>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => bgRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-sm font-medium transition-all duration-300">
                        <FiUpload size={16} />
                        Upload
                      </button>
                      <button onClick={() => { setTempUrl(profile.backgroundImage ?? ''); setModal('bgUrl'); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-sm font-medium transition-all duration-300">
                        <FiLink size={16} />
                        URL
                      </button>
                      <button onClick={() => { const np = { ...profile, backgroundImage: undefined }; setProfile(np); saveProfile(np); showToast('Background cleared'); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-300 text-sm font-medium transition-all duration-300">
                        <FiTrash2 size={16} />
                        Clear
                      </button>
                      <input ref={bgRef} type="file" accept="image/*,video/*" className="hidden" onChange={onBgFile} />
                    </div>
                    <div className="mt-4 text-sm">
                      {profile.backgroundImage ? <p className="text-green-400 flex items-center gap-2"><span>✓</span> Background set</p> : <p className="text-gray-500">No background image</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Audio Section */}
            {activeSection === 'audio' && (
              <div className="bg-gradient-to-br from-white/5 to-white/2 rounded-2xl p-8 border border-white/10 backdrop-blur-sm shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:border-white/20 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <FiMusic className="text-2xl" />
                  <span>Background Audio</span>
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs text-gray-400 mb-4 font-semibold uppercase tracking-wider">Upload Audio File</label>
                    <button onClick={() => audioRef.current?.click()} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/40 text-sm font-medium transition-all duration-300">
                      <FiUpload size={16} />
                      Choose File
                    </button>
                    <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={onAudioFile} />
                    {profile.bgAudio && <p className="text-green-400 mt-3 text-sm">✓ Audio loaded</p>}
                  </div>

                  <div className="pt-8 border-t border-white/10">
                    <label className="block text-xs text-gray-400 mb-4 font-semibold uppercase tracking-wider">Volume Control</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input type="range" min={0} max={1} step={0.01} value={profile.volume ?? 0.35} onChange={(e) => { update({ volume: Number(e.target.value) }); setVolume(Number(e.target.value)); }} className="w-full h-2 rounded-full appearance-none bg-gradient-to-r from-white/20 to-white/10 accent-white cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer" />
                      </div>
                      <div className="flex items-center justify-center w-16 h-10 rounded-lg bg-white/5 border border-white/10 font-semibold text-sm">
                        {Math.round((profile.volume ?? 0.35) * 100)}%
                      </div>
                    </div>
                  </div>

                  {profile.bgAudio && (
                    <div className="pt-8 border-t border-white/10">
                      <audio ref={audioPlayerRef} src={profile.bgAudio} controls className="w-full rounded-lg mb-4 bg-white/5" />
                      <button onClick={() => { if (isPlaying) pauseAudio(); else playAudio(profile.bgAudio); }} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/40 text-sm font-medium transition-all duration-300">
                        {isPlaying ? (
                          <>
                            <FiPause size={16} />
                            Pause
                          </>
                        ) : (
                          <>
                            <FiPlay size={16} />
                            Play
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Socials Section */}
            {activeSection === 'socials' && (
              <div className="bg-gradient-to-br from-white/5 to-white/2 rounded-2xl p-8 border border-white/10 backdrop-blur-sm shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:border-white/20 transition-all duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <FiLink2 className="text-2xl" />
                    <span>Social Links</span>
                  </h2>
                  <button onClick={addSocialModal} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-lg text-sm font-medium transition-all duration-300">
                    <FiFileText size={16} />
                    Add Link
                  </button>
                </div>
                <div className="space-y-3">
                  {profile.socials.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No social links yet</p>
                      <p className="text-gray-500 text-sm mt-1">Add your first link to get started</p>
                    </div>
                  ) : (
                    profile.socials.map((s) => (
                      <div
                        key={s.id}
                        className="flex gap-3 items-center bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                        draggable
                        onDragStart={(e) => onDragStart(e, s.id)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, s.id)}
                        style={{ opacity: draggingId === s.id ? 0.6 : 1 }}
                      >
                        <span className="text-gray-600 cursor-grab select-none">⋮⋮</span>
                        <select value={s.icon} onChange={(e) => updateSocialField(s.id, { icon: e.target.value })} className="bg-white/5 px-3 py-2 rounded-lg border border-white/10 text-xs flex-shrink-0 focus:border-white/30 outline-none transition-all duration-300">
                          <option value="discord">discord</option>
                          <option value="github">github</option>
                          <option value="spotify">spotify</option>
                          <option value="youtube">youtube</option>
                          <option value="tiktok">tiktok</option>
                          <option value="coin">coin</option>
                        </select>
                        <input value={s.label} onChange={(e) => updateSocialField(s.id, { label: e.target.value })} placeholder="Label" className="flex-1 bg-transparent px-3 py-2 border border-white/10 rounded-lg text-sm focus:border-white/30 outline-none transition-all duration-300" />
                        <input value={s.href} onChange={(e) => updateSocialField(s.id, { href: e.target.value })} placeholder="https://..." className="flex-[2] bg-transparent px-3 py-2 border border-white/10 rounded-lg text-sm focus:border-white/30 outline-none transition-all duration-300" />
                        <button onClick={() => onRequestDelete(s.id)} className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-300">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Badges Section */}
            {activeSection === 'badges' && (
              <div className="bg-gradient-to-br from-white/5 to-white/2 rounded-2xl p-8 border border-white/10 backdrop-blur-sm shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:border-white/20 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <FiFileText className="text-2xl" />
                  <span>Custom Badges</span>
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs text-gray-400 mb-4 font-semibold uppercase tracking-wider">Badge List</label>
                    <p className="text-sm text-gray-400 mb-4">Add custom badges to display on your profile. You can use text-only badges or upload icons.</p>
                    <div className="space-y-3">
                      {profile.badges.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No badges yet</p>
                      ) : (
                        <div className="space-y-2">
                          {profile.badges.map((badge, idx) => (
                            <div key={badge.id || idx} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3">
                              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-black/20 overflow-hidden border border-white/6">
                                {badge.image ? (
                                  // show thumbnail
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={badge.image} alt={badge.name ?? 'badge'} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="text-xs px-2 text-gray-300">TXT</div>
                                )}
                              </div>
                              <input value={badge.name ?? ''} onChange={(e) => { const newBadges = profile.badges.map((b, i) => i === idx ? { ...b, name: e.target.value } : b); update({ badges: newBadges }); }} placeholder="Badge name (optional)" className="flex-1 bg-transparent px-3 py-2 border border-white/10 rounded-lg text-sm focus:border-white/30 outline-none transition-all duration-300" />
                              <div className="flex items-center gap-2">
                                <button title="Upload/change badge image" onClick={() => { setEditingBadgeId(badge.id); badgeFileRef.current?.click(); }} className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200">
                                  <FiPlus size={14} />
                                </button>
                                <button title="Set badge image URL" onClick={() => { setEditingBadgeId(badge.id); setTempBadgeUrl(badge.image ?? ''); setModal('badgeImage'); }} className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200">
                                  <FiLink size={14} />
                                </button>
                                <button onClick={() => { const newBadges = profile.badges.filter((_, i) => i !== idx); update({ badges: newBadges }); }} className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-300">
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                    <button onClick={addTextBadge} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-sm font-medium transition-all duration-300">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/></svg>
                      Add Text
                    </button>
                    <button onClick={openBadgeImageModal} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-sm font-medium transition-all duration-300">
                      <FiLink size={16} />
                      Add Image (URL)
                    </button>
                    <button onClick={() => badgeFileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-sm font-medium transition-all duration-300">
                      <FiUpload size={16} />
                      Upload Image
                    </button>
                    <input ref={badgeFileRef} type="file" accept="image/*" className="hidden" onChange={onBadgeFile} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview - Right Column */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <div className="bg-gradient-to-br from-white/5 to-white/2 rounded-2xl p-6 border border-white/10 backdrop-blur-sm shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                <h3 className="text-lg font-bold mb-6 text-white">Live Preview</h3>
                <div className="bg-black rounded-xl overflow-hidden border border-white/10" style={{ backgroundColor: profile.backgroundColor }}>
                  {/* Preview Content */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <img src={profile.avatar} alt="avatar" className="w-16 h-16 rounded-full border-2 border-white/20 object-cover" />
                      <div>
                        <h4 className="font-bold text-white text-lg">{profile.displayName}</h4>
                        <p className="text-gray-400 text-sm">{profile.username}</p>
                        <p className="text-gray-500 text-xs mt-1">{profile.tag}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm italic">{profile.tagline}</p>
                    
                    {/* Badges Preview */}
                    {profile.badges.length > 0 && (
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex flex-wrap gap-2">
                          {profile.badges.map((badge, idx) => (
                            <div key={badge.id ?? idx} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-medium text-white hover:bg-white/20 transition-all duration-200 cursor-default" title={badge.name ?? (badge.image ? 'Image badge' : '')}>
                              {badge.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={badge.image} alt={badge.name ?? 'badge'} className="w-6 h-6 object-cover rounded" />
                              ) : (
                                <span>{badge.name}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Social Links Preview */}
                    {profile.socials.length > 0 && (
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex flex-wrap gap-2">
                          {profile.socials.map((social) => (
                            <div key={social.id} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-xs font-medium text-white hover:bg-white/20 transition-all duration-200">
                              {social.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-4 text-center">Updates in real-time as you edit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal open={modal === 'avatarUrl'} onClose={() => setModal(null)} title="Use Image URL for Avatar">
        <input value={tempUrl} onChange={(e) => { setTempUrl(e.target.value); }} placeholder="https://example.com/avatar.gif" className="w-full bg-black/20 px-3 py-2 rounded-md border border-white/10 text-white" />
        <div className="flex gap-2">
          <button onClick={() => { if (!tempUrl) return showToastError('Paste a valid URL'); const np = { ...profile, avatar: tempUrl }; setProfile(np); saveProfile(np); setModal(null); showToast('Avatar URL applied'); }} className="mt-2 w-full bg-white/10 py-2 rounded-md">Apply</button>
        </div>
      </Modal>

      <Modal open={modal === 'bgUrl'} onClose={() => setModal(null)} title="Use Image URL for Background">
        <input value={tempUrl} onChange={(e) => { setTempUrl(e.target.value); update({ backgroundImage: e.target.value }); }} placeholder="https://example.com/bg.gif" className="w-full bg-black/20 px-3 py-2 rounded-md border border-white/10 text-white" />
        <div className="flex gap-2">
          <button onClick={() => { if (!tempUrl) return showToastError('Paste a valid URL'); const np = { ...profile, backgroundImage: tempUrl }; setProfile(np); saveProfile(np); setModal(null); showToast('Background URL applied'); }} className="mt-2 w-full bg-white/10 py-2 rounded-md">Apply</button>
        </div>
      </Modal>

      <Modal open={modal === 'social'} onClose={() => setModal(null)} title="Add Social Link">
        <input value={tempSocial.icon} onChange={(e) => setTempSocial({ ...tempSocial, icon: e.target.value })} placeholder="Icon (discord, github...)" className="w-full bg-black/20 px-3 py-2 rounded-md border border-white/10 text-white mb-2" />
        <input value={tempSocial.label} onChange={(e) => setTempSocial({ ...tempSocial, label: e.target.value })} placeholder="Label" className="w-full bg-black/20 px-3 py-2 rounded-md border border-white/10 text-white mb-2" />
        <input value={tempSocial.href} onChange={(e) => setTempSocial({ ...tempSocial, href: e.target.value })} placeholder="https://..." className="w-full bg-black/20 px-3 py-2 rounded-md border border-white/10 text-white mb-2" />
        <button onClick={onSocialAdd} className="mt-2 w-full bg-white/10 py-2 rounded-md">Add</button>
      </Modal>

      <Modal open={modal === 'badgeImage'} onClose={() => setModal(null)} title="Add Badge Image">
        <input value={tempBadgeUrl} onChange={(e) => setTempBadgeUrl(e.target.value)} placeholder="https://example.com/badge.png" className="w-full bg-black/20 px-3 py-2 rounded-md border border-white/10 text-white mb-2" />
        <div className="flex gap-2">
          <button onClick={applyBadgeUrl} className="mt-2 w-full bg-white/10 py-2 rounded-md">Add from URL</button>
        </div>
        <div className="mt-3 text-sm text-gray-400">Or upload an image file to store as a data URL (stored locally).</div>
        <div className="mt-3">
          <button onClick={() => badgeFileRef.current?.click()} className="w-full bg-white/10 py-2 rounded-md">Upload Image</button>
          <input ref={badgeFileRef} type="file" accept="image/*" className="hidden" onChange={onBadgeFile} />
        </div>
      </Modal>

      <Modal open={modal === 'confirmDelete'} onClose={() => setModal(null)} title="Confirm Delete">
        <div className="text-sm text-gray-300">Are you sure you want to delete this social link? This cannot be undone.</div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-md bg-black/30 border border-white/6">Cancel</button>
          <button onClick={confirmDelete} className="flex-1 py-2 rounded-md bg-red-600/20 border border-red-500/30 text-red-200">Delete</button>
        </div>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} tone={toast.tone} />
    </main>
  );
}
