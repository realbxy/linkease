'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { saveProfile, loadProfile, resetProfile, Profile, SocialLink } from '../utils/profileStorage';
import { v4 as uuidv4 } from 'uuid';
import { TiltCard } from '../components/TiltCard';
import { useAudio } from '../providers/AudioProvider';


/* ---------- Helpers ---------- */
function toDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === 'string' ? res(reader.result) : rej());
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

/* Small animated modal (glassy) */
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-[94%] max-w-md bg-[#070708]/95 border border-white/6 rounded-2xl p-5 shadow-[0_30px_80px_rgba(0,0,0,0.8)] transform-gpu transition-transform duration-300 scale-100"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sm text-gray-300 px-2 py-1 rounded hover:bg-white/6">Close</button>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

/* Top-center toast */
function Toast({ visible, message, tone = 'success' }: { visible: boolean; message: string; tone?: 'success' | 'error' }) {
  const bg = tone === 'success' ? 'bg-gradient-to-r from-green-500/20 to-green-400/8 border-green-600/20' : 'bg-gradient-to-r from-red-500/12 to-red-400/6 border-red-600/10';
  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 top-6 z-60 pointer-events-none transition-all duration-400 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className={`px-5 py-3 rounded-xl border ${bg} shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-sm text-sm text-white/90`}>
        {message}
      </div>
    </div>
  );
}

/* ---------- Page component ---------- */
export default function EditPage() {
  const initial = useMemo(() => loadProfile(), []);
  const [profile, setProfile] = useState<Profile>(initial);
  const avatarRef = useRef<HTMLInputElement | null>(null);
  const bgRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLInputElement | null>(null);

  // modals
  const [modal, setModal] = useState<'avatarUrl' | 'bgUrl' | 'social' | null>(null);
  const [tempUrl, setTempUrl] = useState('');
  const [tempSocial, setTempSocial] = useState({ icon: '', label: '', href: '' });

  // toast
  const [toast, setToast] = useState<{ visible: boolean; message: string; tone?: 'success' | 'error' }>({
    visible: false,
    message: '',
    tone: 'success',
  });

  // audio playback
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  useEffect(() => {
    // ensure audio element volume follows profile.volume
    if (!audioPlayerRef.current) return;
    audioPlayerRef.current.volume = profile.volume ?? 0.35;
  }, [profile.volume]);

  const update = (patch: Partial<Profile>) => setProfile((p) => ({ ...p, ...patch }));

  /* ---------- Image / Audio handlers ---------- */
  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await toDataUrl(f);
    update({ avatar: url });
    showToast('Avatar uploaded');
  };

  const onBgFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await toDataUrl(f);
    update({ backgroundImage: url });
    showToast('Background image uploaded');
  };

  const onAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await toDataUrl(f);
    update({ bgAudio: url });
    showToast('Audio uploaded');
    // autoplay preview
    setTimeout(() => playAudio(url), 150);
  };

  const onAvatarUrlSave = () => {
    if (!tempUrl) return showToastError('Paste a valid image URL');
    update({ avatar: tempUrl });
    setModal(null);
    showToast('Avatar URL applied');
  };

  const onBgUrlSave = () => {
    if (!tempUrl) return showToastError('Paste a valid image URL');
    update({ backgroundImage: tempUrl });
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
    const link: SocialLink = { id: uuidv4(), icon: tempSocial.icon, label: tempSocial.label, href: tempSocial.href };
    setProfile((p) => ({ ...p, socials: [...p.socials, link] }));
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
    showToast('Profile reset to defaults');
  };

  /* ---------- Toast helpers ---------- */
  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg, tone: 'success' });
    setTimeout(() => setToast({ visible: false, message: '', tone: 'success' }), 3000);
  };
  const showToastError = (msg: string) => {
    setToast({ visible: true, message: msg, tone: 'error' });
    setTimeout(() => setToast({ visible: false, message: '', tone: 'error' }), 4000);
  };

  /* ---------- Audio controls ---------- */
  const playAudio = (src?: string) => {
    const el = audioPlayerRef.current;
    if (!el) return;
    if (src) {
      el.src = src;
      el.currentTime = 0;
    }
    el.volume = profile.volume ?? 0.35;
    el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };
  const pauseAudio = () => {
    const el = audioPlayerRef.current;
    if (!el) return;
    el.pause();
    setIsPlaying(false);
  };

  /* ---------- Utilities ---------- */
  const updateSocialField = (id: string, patch: Partial<SocialLink>) => {
    setProfile((p) => ({ ...p, socials: p.socials.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  };
  const removeSocial = (id: string) => setProfile((p) => ({ ...p, socials: p.socials.filter((s) => s.id !== id) }));

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
                    <div className="text-xs text-gray-400">Click to upload or use URL</div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <img src={profile.avatar} alt="avatar" className="w-20 h-20 rounded-full border border-white/6 object-cover" />
                    <div className="flex items-center gap-2">
                      <button onClick={() => avatarRef.current?.click()} className="px-3 py-2 rounded-md bg-black/30 border border-white/6 text-xs">Upload</button>
                      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={onAvatarFile} />
                      <button onClick={() => { setTempUrl(''); setModal('avatarUrl'); }} className="px-3 py-2 rounded-md bg-black/30 border border-white/6 text-xs">Use URL</button>
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
                      <div key={s.id} className="flex gap-2 items-center bg-black/20 border border-white/6 rounded-md p-2">
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
                        <button onClick={() => removeSocial(s.id)} className="text-xs text-red-400 px-2">Remove</button>
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
                        <button onClick={() => { setTempUrl(''); setModal('bgUrl'); }} className="px-3 py-2 rounded-md bg-black/30 border border-white/6 text-xs">Use URL</button>
                        <button onClick={() => update({ backgroundImage: undefined })} className="px-3 py-2 rounded-md bg-black/30 border border-white/6 text-xs">Clear</button>
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
                      <button onClick={() => { setTempUrl(''); setModal('avatarUrl'); /* re-use input? we'll use separate modal below */ }} className="px-2 py-1 rounded-md bg-black/30 border border-white/6 text-xs hidden">Use URL</button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <audio ref={audioPlayerRef} src={profile.bgAudio} controls className="w-[60%]" />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">Vol</label>
                      <input type="range" min={0} max={1} step={0.01} value={profile.volume ?? 0.35} onChange={(e) => update({ volume: Number(e.target.value) })} className="w-36" />
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
                    {/* show bg image if set (cover) */}
                    {profile.backgroundImage ? (
                      // if it's a video or gif served as image, still shows as img — full support should be added if needed
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
        <input value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} placeholder="https://example.com/avatar.gif" className="w-full bg-black/20 px-3 py-2 rounded-md border border-white/10 text-white" />
        <div className="flex gap-2">
          <button onClick={onAvatarUrlSave} className="mt-2 w-full bg-white/10 py-2 rounded-md">Apply</button>
        </div>
      </Modal>

      <Modal open={modal === 'bgUrl'} onClose={() => setModal(null)} title="Use Image URL for Background">
        <input value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} placeholder="https://example.com/bg.gif" className="w-full bg-black/20 px-3 py-2 rounded-md border border-white/10 text-white" />
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

      {/* Toast */}
      <Toast visible={toast.visible} message={toast.message} tone={toast.tone} />
    </main>
  );
}
