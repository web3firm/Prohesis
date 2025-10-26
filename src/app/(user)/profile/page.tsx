"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toaster";
import { User, Mail, Bell, Save, Trophy, Users, Gift, UserCircle } from "lucide-react";
import useSWR, { mutate } from "swr";
import { ReputationCard } from '@/components/reputation/ReputationCard';
import BadgeCard from '@/components/badges/BadgeCard';
import ReferralCard from '@/components/referrals/ReferralCard';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TabType = 'profile' | 'reputation' | 'achievements' | 'referral';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Real-time profile data
  const { data: profileData, error: fetchError } = useSWR(
    address ? `/api/users/profile?wallet=${address}` : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onSuccess: (data) => {
        if (data.user) {
          setUsername(data.user.username || "");
          setEmail(data.user.email || "");
          setEmailNotifications(data.user.emailNotifications ?? true);
        }
      }
    }
  );

  useEffect(() => {
    if (!isConnected || !address) {
      router.push("/");
      return;
    }

    if (fetchError || (profileData && !profileData.user)) {
      router.push("/signup");
    }
  }, [address, isConnected, router, profileData, fetchError]);

  const handleSave = async () => {
    setError("");

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError("Username must be between 3 and 20 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          username: username.trim(),
          email: email.trim() || null,
          emailNotifications,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        setSaving(false);
        return;
      }

      // Immediately revalidate the profile data
      mutate(`/api/users/profile?wallet=${address}`);
      
      addToast("✅ Profile updated successfully!", "success");
      setSaving(false);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setSaving(false);
    }
  };

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    if (address) {
      return address.slice(2, 3).toUpperCase();
    }
    return "?";
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'Personal Info', icon: UserCircle },
    { id: 'reputation' as TabType, label: 'Reputation', icon: Trophy },
    { id: 'achievements' as TabType, label: 'Achievements', icon: Trophy },
    { id: 'referral' as TabType, label: 'Referral', icon: Gift },
  ];

  return (
    <div className="w-full p-6 min-h-screen">
      <div className="w-full">
        {/* Header with Avatar */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {getInitials()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {username || "Your Profile"}
              </h1>
              <div className="font-mono text-sm text-gray-500 dark:text-gray-400 break-all">
                {address}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">{activeTab === 'profile' && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Edit Profile
              </h2>

              <div className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Receive updates about your markets and bets
              </p>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Bell size={20} className="text-gray-600 dark:text-gray-400" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Email Notifications
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Get notified about market resolutions and bet updates
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
          )}

          {activeTab === 'reputation' && (
            <ReputationCard userId={address || ''} wallet={address} />
          )}

          {activeTab === 'achievements' && (
            <BadgeCard userId={address || ''} />
          )}

          {activeTab === 'referral' && (
            <ReferralCard userId={address || ''} />
          )}
        </div>
      </div>
    </div>
  );
}
