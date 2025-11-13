import { useState } from 'react';
import { Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight, User as UserIcon, Moon, Sun, Award, X, Check, Mail, AtSign, Copy } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';
import { useWallet } from '../hooks/useWallet';
import { usePrivy } from '@privy-io/react-auth';

export function ProfilePage() {
  const { theme, toggleTheme } = useTheme();
  const { address, user } = useWallet();
  const { logout } = usePrivy();
  
  // Get user info from Privy or use defaults
  const [userName, setUserName] = useState(user?.email?.address?.split('@')[0] || 'User');
  const [userEmail, setUserEmail] = useState(user?.email?.address || '');
  const [userUsername, setUserUsername] = useState(`@${userName.toLowerCase().replace(/\s+/g, '')}`);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isGeneralSettingsOpen, setIsGeneralSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // Edit form state
  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [editUsername, setEditUsername] = useState(userUsername);
  
  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketUpdates, setMarketUpdates] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [dataSharing, setDataSharing] = useState(false);
  
  const userStats = {
    name: userName,
    username: userUsername,
    email: userEmail,
    totalBets: 142,
    winRate: '68%',
    totalVolume: '$24,850',
    profitLoss: '+$3,240',
    rank: '#247',
    favoriteCategory: 'Football'
  };

  const handleSaveProfile = () => {
    setUserName(editName);
    setUserEmail(editEmail);
    setUserUsername(editUsername);
    setIsEditDialogOpen(false);
    toast.success('Profile updated successfully!');
  };

  const handleLogout = async () => {
    try {
      // Call Privy logout - this should update authenticated state
      await logout();
      
      // Immediately reload the page to ensure all state is cleared
      // No delay for instant logout experience
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, reload immediately to clear any partial state
      window.location.reload();
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard!');
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-[var(--bg-primary)] border-b border-[var(--border-color)] px-4 pt-4 pb-3">
        <h1 className="text-[var(--text-primary)] mb-0.5">Profile</h1>
        <p className="text-[var(--text-secondary)] text-sm">Manage your account and settings</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        {/* User Info Card */}
        <div className="glass-card rounded-2xl p-5 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-md">
              <UserIcon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-[var(--text-primary)] mb-1 text-lg">{userName}</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-0.5">{userUsername}</p>
              {userEmail && <p className="text-[var(--text-muted)] text-xs mb-2">{userEmail}</p>}
              {address && (
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-[var(--text-muted)] text-xs font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                  <button
                    onClick={copyAddress}
                    className="p-1 hover:bg-[var(--hover-bg)] rounded transition-all"
                    title="Copy address"
                  >
                    <Copy className="w-3 h-3 text-[var(--text-muted)]" />
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                setEditName(userName);
                setEditEmail(userEmail);
                setEditUsername(userUsername);
                setIsEditDialogOpen(true);
              }}
              className="px-3 py-1.5 bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] rounded-full text-xs font-medium text-[var(--text-primary)] transition-all"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="glass-card rounded-2xl p-4">
            <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-1">Total Bets</div>
            <div className="text-xl font-semibold text-[var(--text-primary)]">{userStats.totalBets}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-3.5 h-3.5" />
              <div className="text-xs uppercase tracking-wider font-semibold opacity-90">Win Rate</div>
            </div>
            <div className="text-xl font-bold">{userStats.winRate}</div>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-1">Total Volume</div>
            <div className="text-xl font-semibold text-[var(--text-primary)]">{userStats.totalVolume}</div>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="glass-card rounded-2xl overflow-hidden mb-4">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--hover-bg)] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                theme === 'dark' 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-amber-400 text-white'
              }`}>
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </div>
              <span className="text-[var(--text-primary)] font-medium text-sm">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${
              theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'
            }`}>
              <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform shadow-sm ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </div>
          </button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4 pb-4">
          {/* Account Settings */}
          <div>
            <h3 className="text-[var(--text-primary)] mb-2 text-xs font-medium uppercase tracking-wider">Account Settings</h3>
            <div className="glass-card rounded-2xl overflow-hidden">
              <button 
                onClick={() => setIsGeneralSettingsOpen(true)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[var(--hover-bg)] transition-all border-b border-[var(--border-color)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium text-sm">General Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
              
              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[var(--hover-bg)] transition-all border-b border-[var(--border-color)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium text-sm">Notifications</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
              
              <button 
                onClick={() => setIsPrivacyOpen(true)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[var(--hover-bg)] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium text-sm">Privacy & Security</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-[var(--text-primary)] mb-2 text-xs font-medium uppercase tracking-wider">Support</h3>
            <div className="glass-card rounded-2xl overflow-hidden">
              <button 
                onClick={() => setIsHelpOpen(true)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[var(--hover-bg)] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium text-sm">Help Center</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
          </div>

          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 rounded-2xl text-white transition-all font-semibold text-sm shadow-md hover:shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[var(--bg-secondary)] border-[var(--border-color)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">Edit Profile</DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)] text-xs">
              Update your personal information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-3">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center gap-2 pb-3 border-b border-[var(--border-color)]">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-indigo-500/50 overflow-hidden">
                  <UserIcon className="w-10 h-10 text-white" />
                </div>
                <button className="absolute inset-0 w-20 h-20 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-semibold">Change</span>
                </button>
              </div>
              <button className="text-xs text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
                Upload Photo
              </button>
            </div>

            {/* Compact Form Fields */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-[var(--text-primary)] text-xs">Full Name</Label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] h-9 text-sm focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus:border-[var(--border-color)]"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="username" className="text-[var(--text-primary)] text-xs">Username</Label>
                <Input
                  id="username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] h-9 text-sm focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus:border-[var(--border-color)]"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[var(--text-primary)] text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] h-9 text-sm focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus:border-[var(--border-color)]"
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setIsEditDialogOpen(false)}
              className="flex-1 px-3 py-2 bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] rounded-xl text-[var(--text-primary)] font-medium transition-all text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-1.5 text-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* General Settings Dialog */}
      <Dialog open={isGeneralSettingsOpen} onOpenChange={setIsGeneralSettingsOpen}>
        <DialogContent className="bg-[var(--bg-secondary)] border-[var(--border-color)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">General Settings</DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              Customize your app preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 glass-card rounded-xl">
              <div>
                <div className="text-[var(--text-primary)] font-medium text-sm">Auto-refresh Markets</div>
                <div className="text-[var(--text-muted)] text-xs">Update prices automatically</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 glass-card rounded-xl">
              <div>
                <div className="text-[var(--text-primary)] font-medium text-sm">Show Trending</div>
                <div className="text-[var(--text-muted)] text-xs">Display trending indicators</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 glass-card rounded-xl">
              <div>
                <div className="text-[var(--text-primary)] font-medium text-sm">Compact View</div>
                <div className="text-[var(--text-muted)] text-xs">Use smaller cards</div>
              </div>
              <Switch />
            </div>
          </div>
          <button
            onClick={() => {
              setIsGeneralSettingsOpen(false);
              toast.success('Settings saved!');
            }}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-all"
          >
            Save Settings
          </button>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogContent className="bg-[var(--bg-secondary)] border-[var(--border-color)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">Notification Settings</DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              Manage how you receive updates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 glass-card rounded-xl">
              <div>
                <div className="text-[var(--text-primary)] font-medium text-sm">Email Notifications</div>
                <div className="text-[var(--text-muted)] text-xs">Receive updates via email</div>
              </div>
              <Switch 
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between p-3 glass-card rounded-xl">
              <div>
                <div className="text-[var(--text-primary)] font-medium text-sm">Push Notifications</div>
                <div className="text-[var(--text-muted)] text-xs">Get instant alerts</div>
              </div>
              <Switch 
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
            <div className="flex items-center justify-between p-3 glass-card rounded-xl">
              <div>
                <div className="text-[var(--text-primary)] font-medium text-sm">Market Updates</div>
                <div className="text-[var(--text-muted)] text-xs">Price changes & trends</div>
              </div>
              <Switch 
                checked={marketUpdates}
                onCheckedChange={setMarketUpdates}
              />
            </div>
            <div className="flex items-center justify-between p-3 glass-card rounded-xl">
              <div>
                <div className="text-[var(--text-primary)] font-medium text-sm">Price Alerts</div>
                <div className="text-[var(--text-muted)] text-xs">When positions reach targets</div>
              </div>
              <Switch 
                checked={priceAlerts}
                onCheckedChange={setPriceAlerts}
              />
            </div>
          </div>
          <button
            onClick={() => {
              setIsNotificationsOpen(false);
              toast.success('Notification preferences saved!');
            }}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-all"
          >
            Save Preferences
          </button>
        </DialogContent>
      </Dialog>

      {/* Privacy & Security Dialog */}
      <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
        <DialogContent className="bg-[var(--bg-secondary)] border-[var(--border-color)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">Privacy & Security</DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              Protect your account and data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 glass-card rounded-xl">
              <div>
                <div className="text-[var(--text-primary)] font-medium text-sm">Two-Factor Authentication</div>
                <div className="text-[var(--text-muted)] text-xs">Extra security for login</div>
              </div>
              <Switch 
                checked={twoFactorAuth}
                onCheckedChange={setTwoFactorAuth}
              />
            </div>
            <div className="flex items-center justify-between p-3 glass-card rounded-xl">
              <div>
                <div className="text-[var(--text-primary)] font-medium text-sm">Data Sharing</div>
                <div className="text-[var(--text-muted)] text-xs">Share analytics data</div>
              </div>
              <Switch 
                checked={dataSharing}
                onCheckedChange={setDataSharing}
              />
            </div>
            <button className="w-full p-3 bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] rounded-xl text-[var(--text-primary)] font-medium transition-all text-sm">
              Change Password
            </button>
            <button className="w-full p-3 bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] rounded-xl text-[var(--text-primary)] font-medium transition-all text-sm">
              Download My Data
            </button>
          </div>
          <button
            onClick={() => {
              setIsPrivacyOpen(false);
              toast.success('Security settings updated!');
            }}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-all"
          >
            Save Settings
          </button>
        </DialogContent>
      </Dialog>

      {/* Help Center Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="bg-[var(--bg-secondary)] border-[var(--border-color)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">Help Center</DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              Get support and learn more
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <button className="w-full p-3 glass-card hover:bg-[var(--hover-bg)] rounded-xl text-left transition-all">
              <div className="text-[var(--text-primary)] font-medium text-sm mb-1">📚 How to place bets</div>
              <div className="text-[var(--text-muted)] text-xs">Learn about YES/NO shares</div>
            </button>
            <button className="w-full p-3 glass-card hover:bg-[var(--hover-bg)] rounded-xl text-left transition-all">
              <div className="text-[var(--text-primary)] font-medium text-sm mb-1">💰 Understanding markets</div>
              <div className="text-[var(--text-muted)] text-xs">How prediction markets work</div>
            </button>
            <button className="w-full p-3 glass-card hover:bg-[var(--hover-bg)] rounded-xl text-left transition-all">
              <div className="text-[var(--text-primary)] font-medium text-sm mb-1">📊 Portfolio management</div>
              <div className="text-[var(--text-muted)] text-xs">Track and manage positions</div>
            </button>
            <button className="w-full p-3 glass-card hover:bg-[var(--hover-bg)] rounded-xl text-left transition-all">
              <div className="text-[var(--text-primary)] font-medium text-sm mb-1">💬 Contact Support</div>
              <div className="text-[var(--text-muted)] text-xs">Get help from our team</div>
            </button>
            <button className="w-full p-3 glass-card hover:bg-[var(--hover-bg)] rounded-xl text-left transition-all">
              <div className="text-[var(--text-primary)] font-medium text-sm mb-1">📝 Terms & Conditions</div>
              <div className="text-[var(--text-muted)] text-xs">Legal information</div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}