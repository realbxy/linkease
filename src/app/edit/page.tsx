'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { saveProfile, loadProfile, resetProfile, Profile, SocialLink } from './../utils/profileStorage';
import { v4 as uuidv4 } from 'uuid';
import { TiltCard } from './../components/TiltCard';
import { useAudio } from './../providers/AudioProvider';
import { Modal } from './../components/Modal';
import Toast from './../components/Toast';
import { motion } from 'framer-motion';

/* ---------- Helpers ---------- */
function toDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === 'string' ? res(reader.result) : rej());
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

/* ---------- Page component ---------- */
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

  // modals
  const [modal, setModal] = useState<'avatarUrl' | 'bgUrl' | 'social' | 'confirmDelete' | null>(null);
  const [tempUrl, setTempUrl] = useState('');
  const [tempSocial, setTempSocial] = useState({ icon: '', label: '', href: '' });

  // toast
  const [toast, setToast] = useState<{ visible: boolean; message: string; tone?: 'success' | 'error' }>({ visible: false, message: '', tone: 'success' });

  // audio preview (local element for preview control)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // delete confirm
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  useEffect(() => {
    // when profile bgAudio changes, update provider so playback persists
    if (profile?.bgAudio) {
      setAudioSrc(profile.bgAudio);
      setVolume(profile.volume ?? 0.35);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /* ---------- Image / Audio handlers (autosave after change) ---------- */
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
    // update provider immediately
    try {
      setAudioSrc(url);
    } catch {}
    showToast('Audio uploaded');
    // autoplay preview using local element
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

  const onAvatarUrlSave = () => {
    if (!tempUrl) return showToastError('Paste a valid image URL');
    const np = { ...profile, avatar: tempUrl };
    setProfile(np);
    saveProfile(np);
    setModal(null);
    showToast('Avatar URL applied');
  };

  const onBgUrlSave = () => {
    if (!tempUrl) return showToastError('Paste a valid image URL');
    const np = { ...profile, backgroundImage: tempUrl };
    setProfile(np);
    saveProfile(np);
    setModal(null);
    showToast('Background URL applied');
  };

  /* ---------- socials ---------- */
  const addSocialModal = () => {
    setTempSocial({ icon: '', label: '', href: '' });
    setModal('social');
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

  /* ---------- Drag & Drop reorder (HTML5) ---------- */
  const [draggingId, setDraggingId] = useState<string | null>(null);

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

  /* ---------- Render ---------- */
  return (
    <main className="min-h-screen bg-[#000] text-white p-6">
      <div className="w-[min(92%,1200px)] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm text-gray-300 bg-black/30 px-3 py-2 rounded-md border border-white/6">Back</Link>

          <div className="flex items-center gap-3">
            <button onClick={onReset} className="px-3 py-2 rounded-md bg-black/30 border border-white/6 text-sm">Reset</button>
            <button onClick={onSave} className="px-4 py-2 rounded-md bg-white/6 border border-white/6 text-sm">Save</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* left: main form */}
          <div className="lg:col-span-2">
            <TiltCard intensity={10} className="w-full">
              <div className="bg-[rgba(6,6,7,0.95)] rounded-2xl p-6 border border-white/6">
                <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">Display Name</span>
                    <input value={profile.displayName} onChange={(e) => update({ displayName: e.target.value })} className="bg-black/20 px-3 py-2 rounded-md border border-white/6 text-white" />
                  </label>

                  <label className="flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">Username</span>
                    <input value={profile.username} onChange={(e) => update({ username: e.target.value })} className="bg-black/20 px-3 py-2 rounded-md border border-white/6 text-white" />
                  </label>

                  <label className="flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">UID Tag</span>
                    <input value={profile.tag} onChange={(e) => update({ tag: e.target.value })} className="bg-black/20 px-3 py-2 rounded-md border border-white/6 text-white" />
                  </label>

                  <label className="flex flex-col col-span-2">
                    <span className="text-xs text-gray-400 mb-1">Tagline</span>
                    <input value={profile.tagline} onChange={(e) => update({ tagline: e.target.value })} className="bg-black/20 px-3 py-2 rounded-md border border-white/6 text-white" />
                  </label>
                </div>

                {/* Avatar */}
                <div className="mt-5">
                  <div className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                    <span>Avatar</span>
                    <div className="text-xs text-gray-400 flex items-center gap-3">
                      <span className="truncate max-w-[240px]">{profile.avatar || 'No avatar set'}</span>
                      <div className="text-xs text-gray-400">Click to upload or use URL</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <img src={profile.avatar} alt="avatar" className="w-20 h-20 rounded-full border border-white/6 object-cover" />
                    <div className="flex items-center gap-2">
                      <button onClick={() => avatarRef.current?.click()} className="px-3 py-2 rounded-md bg-black/30 border border-white/6 text-xs">Upload</button>
                      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={onAvatarFile} />
                      <button onClick={() => { setTempUrl(profile.avatar ?? ''); setModal('avatarUrl'); }} className="px-3 py-2 rounded-md bg-black/30 border border-white/6 text-xs">Use URL</button>
                    </div>
                  </div>
                </div>

                {/* Socials */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Social Links</h3>
                    <button onClick={addSocialModal} className="text-xs px-2 py-1 bg-black/30 rounded border border-white/6">Add</button>
                  </div>
                  <div className="space-y-2">
                    {profile.socials.map((s) => (
                      <div
                        key={s.id}
                        className="flex gap-2 items-center bg-black/20 border border-white/6 rounded-md p-2"
                        draggable
                        onDragStart={(e) => onDragStart(e, s.id)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, s.id)}
                        style={{ opacity: draggingId === s.id ? 0.6 : 1 }}
                      >
                        <input value={s.label} onChange={(e) => updateSocialField(s.id, { label: e.target.value })} className="flex-1 bg-transparent px-2 py-1 border border-white/6 rounded-md" />
                        <input value={s.href} onChange={(e) => updateSocialField(s.id, { href: e.target.value })} className="flex-[2] bg-transparent px-2 py-1 border border-white/6 rounded-md" />
                        <select value={s.icon} onChange={(e) => updateSocialField(s.id, { icon: e.target.value })} className="bg-black/20 px-2 py-1 rounded-md border border-white/6 text-xs">
                          <option value="discord">discord</option>
                          <option value="github">github</option>
                          <option value="spotify">spotify</option>
                          <option value="youtube">youtube</option>
                          <option value="tiktok">tiktok</option>
                          <option value="coin">coin</option>
                        </select>
                        <button onClick={() => onRequestDelete(s.id)} className="text-xs text-red-400 px-2">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Appearance */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Appearance</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col">
                      <span className="text-xs text-gray-400 mb-1">Background Color</span>
                      <input value={profile.backgroundColor} onChange={(e) => update({ backgroundColor: e.target.value })} type="color" className="w-full h-10 p-0 rounded-md border border-white/6" />
                    </label>

                    <label className="flex flex-col">
                      <span className="text-xs text-gray-400 mb-1">Card Color</span>
                      <input value={profile.cardColor} onChange={(e) => update({ cardColor: e.target.value })} type="color" className="w-full h-10 p-0 rounded-md border border-white/6" />
                    </label>

                    <label className="col-span-2 flex flex-col">
                      <span className="text-xs text-gray-400 mb-1">Background Image / GIF</span>
                      <div className="flex gap-2">
                        <button onClick={() => bgRef.current?.click()} className="px-3 py-2 rounded-md bg-black/30 border border-white/6 text-xs">Upload</button>
                        <button onClick={() => { setTempUrl(profile.backgroundImage ?? ''); setModal('bgUrl'); }} className="px-3 py-2 rounded-md bg-black/30 border border-white/6 text-xs">Use URL</button>
                        <button onClick={() => { const np = { ...profile, backgroundImage: undefined }; setProfile(np); saveProfile(np); }} className="px-3 py-2 rounded-md bg-black/30 border border-white/6 text-xs">Clear</button>
                        <input ref={bgRef} type="file" accept="image/*,video/*" className="hidden" onChange={onBgFile} />
                      </div>
                      {profile.backgroundImage ? <div className="mt-2 text-xs text-gray-300">Preview set</div> : <div className="mt-2 text-xs text-gray-500">No background image</div>}
                    </label>
                  </div>
                </div>

                {/* Audio */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Background Audio</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => audioRef.current?.click()} className="px-2 py-1 rounded-md bg-black/30 border border-white/6 text-xs">Upload</button>
                      <button onClick={() => { setTempUrl(profile.bgAudio ?? ''); setModal('avatarUrl'); }} className="px-2 py-1 rounded-md bg-black/30 border border-white/6 text-xs hidden">Use URL</button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <audio ref={audioPlayerRef} src={profile.bgAudio} controls className="w-[60%]" />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">Vol</label>
                      <input type="range" min={0} max={1} step={0.01} value={profile.volume ?? 0.35} onChange={(e) => { update({ volume: Number(e.target.value) }); setVolume(Number(e.target.value)); }} className="w-36 pill-slider" />
                      <button onClick={() => { if (isPlaying) pauseAudio(); else playAudio(profile.bgAudio); }} className="px-2 py-1 rounded-md bg-black/30 border border-white/6 text-xs">
                        {isPlaying ? 'Pause' : 'Play'}
                      </button>
                    </div>
                    <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={onAudioFile} />
                  </div>

                </div>
              </div>
            </TiltCard>
          </div>

          {/* right column: preview */}
          <div>
            <TiltCard intensity={8} className="w-full">
              <div style={{ background: profile.cardColor || '#060607' }} className="p-6 rounded-2xl border border-white/6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {profile.backgroundImage ? (
                      <div className="absolute -inset-6 -z-10 rounded-2xl overflow-hidden">
                        <img src={profile.backgroundImage} alt="bg" className="w-full h-full object-cover opacity-20" />
                      </div>
                    ) : null}
                    <img src={profile.avatar} alt="avatar" className="w-28 h-28 rounded-full border border-white/6 object-cover" />
                  </div>

                  <div className="mt-3 text-center">
                    <div className="text-sm font-medium">{profile.displayName}</div>
                    <div className="text-xs text-gray-400">{profile.tag}</div>
                    <div className="text-sm mt-2 text-gray-300">{profile.tagline}</div>
                  </div>

                  <div className="w-full mt-4">
                    <div className="text-xs text-gray-400 mb-2">Preview</div>
                    <div className="bg-[#080808] rounded-md p-3 border border-white/6">
                      <div className="flex items-center gap-3">
                        <img src={profile.avatar} alt="mini" className="w-10 h-10 rounded-full border border-white/6 object-cover" />
                        <div>
                          <div className="text-sm font-medium">{profile.displayName}</div>
                          <div className="text-xs text-gray-400">{profile.tag}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 w-full">
                    <button onClick={() => { const ok = saveProfile(profile); showToast(ok ? 'Saved' : 'Save failed'); }} className="w-full px-4 py-2 rounded-md bg-white/6 border border-white/6">Save</button>
                  </div>
                </div>
              </div>
            </TiltCard>

            <div className="mt-4 text-xs text-gray-400">Changes saved to localStorage (client-only).</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal open={modal === 'avatarUrl'} onClose={() => setModal(null)} title="Use Image URL for Avatar">
        <input value={tempUrl} onChange={(e) => { setTempUrl(e.target.value); update({ avatar: e.target.value }); }} placeholder="https://example.com/avatar.gif" className="w-full bg-black/20 px-3 py-2 rounded-md border border-white/10 text-white" />
        <div className="flex gap-2">
          <button onClick={onAvatarUrlSave} className="mt-2 w-full bg-white/10 py-2 rounded-md">Apply</button>
        </div>
      </Modal>

      <Modal open={modal === 'bgUrl'} onClose={() => setModal(null)} title="Use Image URL for Background">
        <input value={tempUrl} onChange={(e) => { setTempUrl(e.target.value); update({ backgroundImage: e.target.value }); }} placeholder="https://example.com/bg.gif" className="w-full bg-black/20 px-3 py-2 rounded-md border border-white/10 text-white" />
        <div className="flex gap-2">
          <button onClick={onBgUrlSave} className="mt-2 w-full bg-white/10 py-2 rounded-md">Apply</button>
        </div>
      </Modal>

      <Modal open={modal === 'social'} onClose={() => setModal(null)} title="Add Social Link">
        <input value={tempSocial.icon} onChange={(e) => setTempSocial({ ...tempSocial, icon: e.target.value })} placeholder="Icon (discord, github...)" className="w-full bg-black/20 px-3 py-2 rounded-md border border-white/10 text-white mb-2" />
        <input value={tempSocial.label} onChange={(e) => setTempSocial({ ...tempSocial, label: e.target.value })} placeholder="Label" className="w-full bg-black/20 px-3 py-2 rounded-md border border-white/10 text-white mb-2" />
        <input value={tempSocial.href} onChange={(e) => setTempSocial({ ...tempSocial, href: e.target.value })} placeholder="https://..." className="w-full bg-black/20 px-3 py-2 rounded-md border border-white/10 text-white mb-2" />
        <button onClick={onSocialAdd} className="mt-2 w-full bg-white/10 py-2 rounded-md">Add</button>
      </Modal>

      <Modal open={modal === 'confirmDelete'} onClose={() => setModal(null)} title="Confirm Delete">
        <div className="text-sm text-gray-300">Are you sure you want to delete this social link? This cannot be undone.</div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-md bg-black/30 border border-white/6">Cancel</button>
          <button onClick={confirmDelete} className="flex-1 py-2 rounded-md bg-red-600/20 border border-red-500/30 text-red-200">Delete</button>
        </div>
      </Modal>

      {/* Toast */}
      <Toast visible={toast.visible} message={toast.message} tone={toast.tone} />
    </main>
  );
}
