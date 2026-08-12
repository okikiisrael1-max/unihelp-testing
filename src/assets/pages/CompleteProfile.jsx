import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { toast } from 'react-toastify';
import { toCloudinaryAsset, uploadImage } from '../../services/cloudinary';
import { deleteCloudinaryAssets } from '../../services/mediaCleanup';
import { ALL_NIGERIAN_SCHOOLS, COMMON_DEPARTMENTS } from '../data/nigerianSchools';
import {
  Search,
  ChevronDown,
  Check,
  User,
  GraduationCap,
  BookOpen,
  Layers,
  Sparkles,
  ArrowRight,
  Camera,
  X,
  Loader2,
} from 'lucide-react';
import { Images } from '../data/data';

const LEVELS = ['100', '200', '300', '400', '500', 'All'];
const MAX_AVATAR_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/* ---------------------------------------------------------------------- */
/*  Searchable dropdown — shared by School, Department, and Level fields  */
/* ---------------------------------------------------------------------- */

const SearchableSelect = ({
  dark,
  label,
  icon: Icon,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search…',
  allowCustom = false,
  required = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, query]);

  const handleSelect = (opt) => {
    onChange(opt);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && allowCustom && filtered.length === 0 && query.trim()) {
      handleSelect(query.trim());
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className={`text-sm font-semibold block ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
        {label} {required && <span className="text-indigo-500">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`w-full flex items-center gap-3 pl-4 pr-3 py-3.5 rounded-xl border text-[15px] text-left transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
            dark
              ? 'bg-slate-800/80 border-slate-700 text-white'
              : 'bg-white border-gray-300/80 text-slate-900'
          } ${open ? 'ring-4 ring-indigo-500/20 border-indigo-500' : ''}`}
        >
          {Icon && <Icon size={18} className={dark ? 'text-slate-500' : 'text-gray-400'} />}
          <span className={`flex-1 truncate ${!value ? (dark ? 'text-slate-500' : 'text-gray-400') : ''}`}>
            {value || placeholder}
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${dark ? 'text-slate-500' : 'text-gray-400'}`}
          />
        </button>

        {open && (
          <div
            className={`absolute z-30 mt-2 w-full rounded-xl border shadow-xl overflow-hidden ${
              dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            }`}
          >
            <div className={`flex items-center gap-2 px-3 py-2.5 border-b ${dark ? 'border-slate-700' : 'border-gray-100'}`}>
              <Search size={16} className={dark ? 'text-slate-500' : 'text-gray-400'} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className={`flex-1 bg-transparent text-sm focus:outline-none ${
                  dark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-gray-400'
                }`}
              />
            </div>

            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className={`px-4 py-3 text-sm ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {allowCustom && query.trim() ? (
                    <button
                      type="button"
                      onClick={() => handleSelect(query.trim())}
                      className="text-indigo-500 font-semibold hover:underline"
                    >
                      Use "{query.trim()}"
                    </button>
                  ) : (
                    'No matches found'
                  )}
                </div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-[15px] text-left transition-colors ${
                      dark ? 'hover:bg-slate-700/70 text-slate-100' : 'hover:bg-indigo-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {value === opt && <Check size={16} className="text-indigo-500 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------- */
/*  Avatar upload                                                         */
/* ---------------------------------------------------------------------- */

const AvatarUpload = ({ dark, previewUrl, uploading, onSelect, onRemove }) => {
  const fileInputRef = useRef(null);

  return (
    <div className="flex flex-col items-center gap-3 mb-2">
      <div className="relative w-24 h-24 lg:w-28 lg:h-28">
        <div
          className={`w-full h-full rounded-full overflow-hidden border-2 flex items-center justify-center ${
            dark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200'
          }`}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={36} className={dark ? 'text-slate-600' : 'text-gray-300'} />
          )}

          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <Loader2 size={24} className="text-white animate-spin" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 transition-all active:scale-95 bg-indigo-600 hover:bg-indigo-500 ${
            dark ? 'border-slate-900' : 'border-white'
          } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
          aria-label="Upload profile photo"
        >
          <Camera size={16} className="text-white" />
        </button>

        {previewUrl && !uploading && (
          <button
            type="button"
            onClick={onRemove}
            className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 transition-all active:scale-95 ${
              dark ? 'bg-slate-700 border-slate-900 hover:bg-slate-600' : 'bg-white border-white hover:bg-gray-100'
            }`}
            aria-label="Remove profile photo"
          >
            <X size={12} className={dark ? 'text-slate-200' : 'text-slate-600'} />
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={onSelect}
          className="hidden"
        />
      </div>

      <p className={`text-xs font-medium ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
        JPG, PNG or WebP · up to {MAX_AVATAR_MB}MB
      </p>
    </div>
  );
};

/* ---------------------------------------------------------------------- */
/*  CompleteProfile                                                       */
/* ---------------------------------------------------------------------- */

const CompleteProfile = ({ dark = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    username: '',
    school: '',
    department: '',
    level: '100',
  });

  // Photo state kept separate from `form` since it uploads independently,
  // mirroring how Profile.jsx treats `photo`/`photoAsset` as their own fields.
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoAsset, setPhotoAsset] = useState(null);
  const objectUrlRef = useRef(null);

  const schoolOptions = useMemo(() => ALL_NIGERIAN_SCHOOLS.map((s) => s.name), []);
  const departmentOptions = useMemo(() => COMMON_DEPARTMENTS.map((d) => d.name), []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (cancelled) return;

        if (snap.exists()) {
          const data = snap.data();
          setForm((f) => ({
            ...f,
            username: data.username || user.displayName || '',
            school: data.school || '',
            department: data.department || '',
            level: data.level || '100',
          }));
          setPhotoUrl(data.photo || user.photoURL || '');
          setPhotoAsset(data.photoAsset || null);
        } else {
          setForm((f) => ({ ...f, username: user.displayName || '' }));
          setPhotoUrl(user.photoURL || '');
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) toast.error('Could not load your profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Clean up any local object URL we created for an instant preview
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const setField = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please choose a JPG, PNG, or WebP image');
      return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_AVATAR_MB}MB`);
      return;
    }

    // Instant local preview while the real upload happens
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const localPreview = URL.createObjectURL(file);
    objectUrlRef.current = localPreview;
    setPhotoUrl(localPreview);

    const user = auth.currentUser;
    if (!user) return;

    setUploadingPhoto(true);
    try {
      const result = await uploadImage(file);
      const url = result.secure_url;
      const nextAsset = toCloudinaryAsset(result);
      const previousAsset = photoAsset || (photoUrl?.startsWith('http') ? { url: photoUrl, resourceType: 'image' } : null);

      try {
        await updateProfile(user, { photoURL: url });
        await setDoc(
          doc(db, 'users', user.uid),
          { photo: url, photoURL: url, photoAsset: nextAsset },
          { merge: true }
        );
      } catch (saveError) {
        await deleteCloudinaryAssets({ assets: [nextAsset] }).catch((cleanupError) => {
          console.warn('Unable to clean up newly uploaded profile photo', cleanupError);
        });
        throw saveError;
      }

      setPhotoUrl(url);
      setPhotoAsset(nextAsset);
      if (previousAsset?.publicId || previousAsset?.url) {
        await deleteCloudinaryAssets({ assets: [previousAsset] }).catch((cleanupError) => {
          console.warn('Unable to clean up previous profile photo', cleanupError);
        });
      }
      toast.success('Profile picture updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload photo');
      setPhotoUrl(user.photoURL || '');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoRemove = async () => {
    const user = auth.currentUser;
    setPhotoUrl('');
    setPhotoAsset(null);

    if (!user) return;
    try {
      await updateProfile(user, { photoURL: null });
      await setDoc(doc(db, 'users', user.uid), { photo: '', photoAsset: null }, { merge: true });
      if (photoAsset?.publicId || photoAsset?.url) {
        await deleteCloudinaryAssets({ assets: [photoAsset] }).catch((cleanupError) => {
          console.warn('Unable to clean up removed profile photo', cleanupError);
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove photo');
    }
  };

  const validate = () => {
    if (!form.username.trim()) {
      toast.error('Please enter a display name');
      return false;
    }
    if (!form.school.trim()) {
      toast.error('Please select your school');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    setSaving(true);
    try {
      const ref = doc(db, 'users', user.uid);
      await setDoc(
        ref,
        {
          username: form.username.trim(),
          usernameLower: form.username.trim().toLowerCase(),
          school: form.school,
          department: form.department,
          level: form.level,
          photo: photoUrl,
          photoAsset: photoAsset,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await updateProfile(user, { displayName: form.username.trim() });
      toast.success('Profile completed');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          dark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
        }`}
      >
        <span className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden ${
        dark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
      }`}
    >
      {/* MOBILE HERO */}
      <div className="lg:hidden relative w-full h-[28vh] shrink-0">
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop"
          alt="Campus life"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-8 left-6 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg p-1.5">
            <img src={Images.logo} alt="UniHelp Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-indigo-200 text-xs font-bold tracking-wider uppercase drop-shadow-md">
              Almost there
            </span>
            <h1 className="text-2xl font-black text-white drop-shadow-md leading-tight">
              Complete your profile
            </h1>
          </div>
        </div>
      </div>

      {/* DESKTOP IMAGE PANEL */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 w-[45%] flex-col justify-between p-12 xl:p-16 overflow-hidden z-10">
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop"
          alt="Campus life"
          className="absolute inset-0 w-full h-full object-cover scale-105 animate-[pulse_20s_ease-in-out_infinite_alternate]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg p-1">
            <img src={Images.logo} alt="UniHelp Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white drop-shadow-lg">UniHelp</span>
        </div>

        <div className="relative z-10 mt-auto max-w-lg">
          <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-semibold tracking-wider mb-6">
            <Sparkles size={14} /> ONE LAST STEP
          </span>
          <h1 className="text-4xl xl:text-5xl font-black leading-[1.1] mb-5 text-white drop-shadow-md">
            Tell us a bit <br />
            <span className="text-indigo-300">about your studies.</span>
          </h1>
          <p className="text-lg max-w-md text-gray-200 drop-shadow font-medium leading-relaxed">
            This helps us connect you with the right coursemates, groups, and resources for your school.
          </p>
        </div>
      </div>

      {/* FORM PANEL */}
      <div className="w-full lg:w-[55%] lg:ml-[45%] flex flex-col justify-center items-center px-4 pb-8 lg:p-12 xl:p-16 relative z-10 -mt-6 lg:mt-0 lg:min-h-screen">
        <div className="hidden lg:block absolute top-16 right-16 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="hidden lg:block absolute bottom-10 left-10 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div
          className={`w-full max-w-[420px] lg:max-w-[480px] xl:max-w-[520px] mx-auto p-8 lg:p-10 xl:p-12 rounded-t-3xl lg:rounded-3xl transition-all relative z-10 overflow-visible
          ${
            dark
              ? 'bg-slate-900 shadow-2xl shadow-black/80 lg:bg-slate-800/60 lg:backdrop-blur-xl lg:border lg:border-slate-700/80 lg:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]'
              : 'bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:bg-white/90 lg:backdrop-blur-xl lg:border lg:border-gray-100 lg:shadow-[0_20px_60px_-15px_rgba(67,56,202,0.18)]'
          }`}
        >
          <div className="hidden lg:block absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-t-3xl" />

          <div className="mb-6 mt-2 lg:mt-0 text-center lg:text-left">
            <h2 className="text-[1.75rem] lg:text-[2.25rem] font-bold tracking-tight mb-2">
              Complete your profile
            </h2>
            <p className={`text-[15px] font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              A few details to personalize your UniHelp experience.
            </p>
          </div>

          <AvatarUpload
            dark={dark}
            previewUrl={photoUrl}
            uploading={uploadingPhoto}
            onSelect={handlePhotoSelect}
            onRemove={handlePhotoRemove}
          />

          <div className="space-y-5">
            <div className="space-y-2">
              <label className={`text-sm font-semibold block ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                Display name <span className="text-indigo-500">*</span>
              </label>
              <div className="relative">
                <User className={`absolute left-4 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-500' : 'text-gray-400'}`} size={18} />
                <input
                  value={form.username}
                  onChange={(e) => setField('username')(e.target.value)}
                  placeholder="Your display name"
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-[15px] transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                    dark
                      ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500'
                      : 'bg-white border-gray-300/80 text-slate-900 placeholder:text-gray-400'
                  }`}
                />
              </div>
            </div>

            <SearchableSelect
              dark={dark}
              label="School"
              icon={GraduationCap}
              value={form.school}
              onChange={setField('school')}
              options={schoolOptions}
              placeholder="Select your school"
              searchPlaceholder="Search Nigerian universities…"
              required
            />

            <SearchableSelect
              dark={dark}
              label="Department"
              icon={BookOpen}
              value={form.department}
              onChange={setField('department')}
              options={departmentOptions}
              placeholder="Select department (optional)"
              searchPlaceholder="Search departments…"
              allowCustom
            />

            <SearchableSelect
              dark={dark}
              label="Level"
              icon={Layers}
              value={form.level}
              onChange={setField('level')}
              options={LEVELS}
              placeholder="Select level"
              searchPlaceholder="Search level…"
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold text-[15px] transition-all shadow-lg ${ saving ? 'bg-indigo-400 cursor-not-allowed shadow-none' : 'bg-[#4338ca] hover:bg-[#3730a3] hover:shadow-[#4338ca]/30 active:scale-[0.98]'}`}>
                {saving ? (
                  <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>) : (
                  <>Save and continue <ArrowRight size={18} /> </>)}
              </button>

              <button onClick={() => navigate('/')} className={`px-5 py-4 rounded-xl border-2 font-bold text-[15px] transition-all ${ dark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-gray-200 hover:bg-gray-50 text-slate-600' }`}> Skip </button>
            </div>
            <p className="text-sm text-center text-slate-500">
              By completing your profile, you'll get personalized recommendations and a better experience on UniHelp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
