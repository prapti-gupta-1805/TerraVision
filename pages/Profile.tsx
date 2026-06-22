// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Navbar from '../components/Navbar';
// import { getCurrentUser, logout, getUserData } from '../services/authService';
// import type { User } from 'firebase/auth';

// interface UserProfile {
//   displayName?: string;
//   email?: string;
//   photoURL?: string;
//   createdAt?: string;
//   bio?: string;
//   location?: string;
//   role?: string;
// }

// const Profile: React.FC = () => {
//   const navigate = useNavigate();
//   const [user, setUser] = useState<User | null>(null);
//   const [profile, setProfile] = useState<UserProfile | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     const currentUser = getCurrentUser();
//     if (!currentUser) {
//       navigate('/login');
//       return;
//     }

//     setUser(currentUser);

//     // Fetch user profile data from Firestore
//     const fetchUserData = async () => {
//       try {
//         if (currentUser.uid) {
//           const userData = await getUserData(currentUser.uid);
//           setProfile(userData || {});
//         }
//       } catch (err) {
//         console.error('Error fetching user data:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUserData();
//   }, [navigate]);

//   const handleLogout = async () => {
//     try {
//       await logout();
//       navigate('/login');
//     } catch (err) {
//       setError('Failed to logout. Please try again.');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)]">
//         <Navbar />
//         <main className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[calc(100vh-80px)]">
//           <div className="text-[var(--color-text-main)]">Loading profile...</div>
//         </main>
//       </div>
//     );
//   }

//   if (!user) {
//     return null;
//   }

//   const displayName = `${user?.displayName || profile?.profile?.firstName || 'User'} ${profile?.profile?.lastName || ''}`.trim();
//   const email = user.email || '';
//   const photoURL = user.photoURL || profile?.profile?.photoURL;
//   const joinDate = profile?.account?.joinedAt || user.metadata?.creationTime || new Date().toISOString();
//   const bio = profile?.profile?.bio || 'Welcome to TerraVision';
//   const location = profile?.profile?.city ? `${profile.profile.city}, ${profile.profile.state}` : 'Location not set';
//   const role = profile?.profile?.role || 'User';
//   const accountType = user.providerData[0]?.providerId === 'google.com'
//     ? 'Google OAuth'
//     : 'Email & Password';

//   const initials = displayName
//     .split(' ')
//     .map((n) => n[0])
//     .join('')
//     .toUpperCase()
//     .slice(0, 2);

//   return (
//     <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] text-[var(--color-text-main)]">
//       <Navbar />
//       <main className="max-w-4xl mx-auto p-6">
//         {error && (
//           <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
//             {error}
//           </div>
//         )}

//         <div className="bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] rounded-lg shadow-sm p-6">
//           <div className="flex items-center justify-between gap-6 mb-6">
//             <div className="flex items-center gap-6">
//               {photoURL ? (
//                 <img
//                   src={photoURL}
//                   alt={displayName}
//                   className="h-20 w-20 rounded-full object-cover"
//                 />
//               ) : (
//                 <div className="h-20 w-20 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xl font-bold">
//                   {initials}
//                 </div>
//               )}
//               <div>
//                 <h1 className="text-2xl font-semibold">{displayName}</h1>
//                 <p className="text-sm text-[var(--color-text-muted)]">
//                   {role} · {location}
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={handleLogout}
//               className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
//             >
//               Logout
//             </button>
//           </div>

//           <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="md:col-span-2">
//               <h2 className="text-lg font-medium mb-2">About</h2>
//               <p className="text-sm text-[var(--color-text-muted)]">{bio}</p>

//               <div className="mt-4 grid grid-cols-2 gap-3">
//                 <div className="p-3 bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] rounded border border-[var(--color-border-light)]">
//                   <div className="text-xs text-[var(--color-text-muted)]">Email</div>
//                   <div className="font-medium text-sm break-all">{email}</div>
//                 </div>

//                 <div className="p-3 bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] rounded border border-[var(--color-border-light)]">
//                   <div className="text-xs text-[var(--color-text-muted)]">Member since</div>
//                   <div className="font-medium">
//                     {new Date(joinDate).toLocaleDateString()}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <aside className="space-y-3">
//               <div className="p-3 rounded border border-[var(--color-border-light)] text-sm bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)]">
//                 <div className="text-xs text-[var(--color-text-muted)]">Account Type</div>
//                 <div className="font-semibold">
//                   {accountType}
//                 </div>
//               </div>

//               <div className="p-3 rounded border border-[var(--color-border-light)] text-sm bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)]">
//                 <div className="text-xs text-[var(--color-text-muted)]">Email Verified</div>
//                 <div className="font-semibold">
//                   {profile?.account?.isEmailVerified ? 'Yes' : 'No'}
//                 </div>
//               </div>
//             </aside>
//           </section>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default Profile;


import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCurrentUser, logout, getUserData, updateUserData } from '../services/authService';
import type { User } from 'firebase/auth';

interface AccountInfo {
  isEmailVerified: boolean;
  joinedAt: string;
  lastLogin: string;
}

interface Preferences {
  language: string;
  theme: string;
}

interface ProfileInfo {
  firstName?: string;
  lastName?: string;
  role?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  photoURL?: string;
}

interface FirestoreUser {
  id: string;
  email: string;
  account: AccountInfo;
  preferences: Preferences;
  profile: ProfileInfo;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profileDoc, setProfileDoc] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  // local editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setUser(currentUser);

    const fetchUserDataFromFirestore = async () => {
      try {
        if (currentUser.uid) {
          const userData = (await getUserData(currentUser.uid)) as FirestoreUser | null;
          if (userData) {
            setProfileDoc(userData);
            const pf = userData.profile || {};
            const prefs = userData.preferences || { language: 'en', theme: 'light' };

            setFirstName(pf.firstName || '');
            setLastName(pf.lastName || '');
            setRole(pf.role || 'Urban Planner');
            setCity(pf.city || 'Delhi');
            setStateRegion(pf.state || '');
            setCountry(pf.country || 'IN');
            setBio(pf.bio || '');
            setLanguage(prefs.language || 'en');
            setTheme(prefs.theme || 'light');
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataFromFirestore();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to logout. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!user || !profileDoc) return;

    setSaving(true);
    setError('');

    try {
      const updated: FirestoreUser = {
        ...profileDoc,
        email: profileDoc.email || user.email || '',
        account: {
          ...profileDoc.account,
        },
        preferences: {
          language,
          theme,
        },
        profile: {
          ...profileDoc.profile,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: role.trim() || 'Urban Planner',
          city: city.trim() || 'Delhi',
          state: stateRegion.trim() || '',
          country: country.trim() || 'IN',
          bio: bio.trim(),
        },
      };

      await updateUserData(user.uid, updated);
      setProfileDoc(updated);
      setEditMode(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)]">
        <Navbar />
        <main className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-[var(--color-text-main)]">Loading profile...</div>
        </main>
      </div>
    );
  }

  if (!user || !profileDoc) {
    return null;
  }

  const pf = profileDoc.profile;
  const acc = profileDoc.account;
  const prefs = profileDoc.preferences;

  const displayName = `${firstName || user.displayName || 'User'} ${lastName || ''}`.trim();
  const email = profileDoc.email || user.email || '';
  const photoURL = pf.photoURL || user.photoURL || undefined;
  const joinDate = acc.joinedAt || user.metadata?.creationTime || new Date().toISOString();
  const accountType =
    user.providerData[0]?.providerId === 'google.com' ? 'Google OAuth' : 'Email & Password';
  const isEmailVerified = acc.isEmailVerified ?? user.emailVerified ?? false;

  const locationLabel = city
    ? `${city}${stateRegion ? `, ${stateRegion}` : ''}${country ? `, ${country}` : ''}`
    : 'Location not set';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] text-[var(--color-text-main)]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Top card */}
        <div className="mb-8 rounded-2xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-5">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="h-20 w-20 md:h-24 md:w-24 rounded-full object-cover border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]"
              />
            ) : (
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                {initials}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-1">
                Profile
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-main)]">
                {displayName}
              </h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {role || 'Urban Planner'} · {locationLabel}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Member since {new Date(joinDate).toLocaleDateString()} ·{' '}
                {isEmailVerified ? 'Email verified' : 'Email not verified'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 items-stretch md:items-end">
            <div className="flex gap-2 flex-wrap justify-end">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] px-3 py-1 text-[11px] font-medium text-[var(--color-text-muted)] border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]">
                <span className="material-symbols-outlined text-[14px] text-primary">
                  palette
                </span>
                {prefs.theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] px-3 py-1 text-[11px] font-medium text-[var(--color-text-muted)] border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]">
                <span className="material-symbols-outlined text-[14px] text-primary">
                  translate
                </span>
                {prefs.language.toUpperCase()}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] px-3 py-1 text-[11px] font-medium text-[var(--color-text-muted)] border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]">
                <span className="material-symbols-outlined text-[14px] text-primary">
                  verified_user
                </span>
                {accountType}
              </span>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditMode((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-primary/60 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {editMode ? 'close' : 'edit'}
                </span>
                {editMode ? 'Cancel' : 'Edit profile'}
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-red-500/70 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-500/15 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editable form */}
          <section className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-main)] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      person
                    </span>
                    Personal information
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Update how your name and role appear across the platform.
                  </p>
                </div>
                {editMode && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {saving ? 'hourglass_empty' : 'save'}
                    </span>
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                    First name
                  </label>
                  <input
                    type="text"
                    disabled={!editMode}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] px-3 py-2 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-70"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                    Last name
                  </label>
                  <input
                    type="text"
                    disabled={!editMode}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] px-3 py-2 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-70"
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                    Role
                  </label>
                  <input
                    type="text"
                    disabled={!editMode}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] px-3 py-2 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-70"
                    placeholder="Urban Planner, Data Scientist..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full rounded-xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] px-3 py-2 text-sm text-[var(--color-text-muted)]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] p-6">
              <h2 className="text-sm font-semibold text-[var(--color-text-main)] flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  location_on
                </span>
                Location & bio
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    disabled={!editMode}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] px-3 py-2 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-70"
                    placeholder="Delhi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                    State / Region
                  </label>
                  <input
                    type="text"
                    disabled={!editMode}
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] px-3 py-2 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-70"
                    placeholder="Delhi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    disabled={!editMode}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] px-3 py-2 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-70"
                    placeholder="IN"
                  />
                </div>
              </div>

              <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                Bio
              </label>
              <textarea
                disabled={!editMode}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] px-3 py-2 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-70 resize-none"
                placeholder="Tell others about your work, focus areas, or current projects..."
              />
            </div>
          </section>

          {/* Right side: account & preferences */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] p-4">
              <h3 className="text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-[0.16em] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  shield_person
                </span>
                Account
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Account type</span>
                  <span className="text-[var(--color-text-main)] font-medium">
                    {accountType}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Email verified</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] text-[var(--color-text-main)] bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)]">
                    <span className="material-symbols-outlined text-[14px] text-primary">
                      {isEmailVerified ? 'check_circle' : 'error'}
                    </span>
                    {isEmailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex flex-col text-xs text-[var(--color-text-muted)] mt-2">
                  <span>
                    Last login:{' '}
                    {acc.lastLogin
                      ? new Date(acc.lastLogin).toLocaleString()
                      : 'Not available'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] p-4">
              <h3 className="text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-[0.16em] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  tune
                </span>
                Preferences
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                    Language
                  </label>
                  <select
                    disabled={!editMode}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-70"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                    Theme
                  </label>
                  <select
                    disabled={!editMode}
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-70"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Profile;
