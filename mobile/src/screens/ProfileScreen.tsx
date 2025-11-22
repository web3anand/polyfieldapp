/**
 * Profile Screen - Now with Supabase integration
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Clipboard, Image, Modal, TextInput, Switch, Platform, ActionSheetIOS, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePrivy } from '@privy-io/expo';
import { useEmbeddedEthereumWallet } from '@privy-io/expo';
import { useNavigation, useTheme } from '@react-navigation/native';
import { useThemeContext } from '../theme/ThemeContext';
import { useToastContext } from '../context/ToastContext';
import { useSupabase } from '../context/SupabaseContext';
import { updateUserProfile, getOrCreateUser } from '../utils/supabase';

interface ProfileScreenProps {
  onLogout?: () => void;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { mode, toggleMode, colors } = useThemeContext();
  const darkMode = mode === 'dark';
  const { user, logout } = usePrivy();
  const { userProfile, refreshProfile } = useSupabase();
  const embeddedWallet = useEmbeddedEthereumWallet();
  const navigation = useNavigation();
  const theme = useTheme();
  const toast = useToastContext();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [username, setUsername] = useState(userProfile?.display_name || '');
  const [profileImage, setProfileImage] = useState<string | null>(userProfile?.avatar_url || null);
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [exportingKey, setExportingKey] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
  const themedStyles = styles(colors);

  // Sync profile data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.display_name || '');
      setProfileImage(userProfile.avatar_url || null);
    }
  }, [userProfile]);
  
  // Automatically create embedded wallet if user doesn't have one
  useEffect(() => {
    const createWalletIfNeeded = async () => {
      if (!user) return;
      
      const hasEmbeddedWallet = user.linked_accounts?.some(
        (account) => 
          account.type === 'wallet' && 
          'wallet_client_type' in account && 
          account.wallet_client_type === 'privy'
      );
      
      if (!hasEmbeddedWallet && !creatingWallet) {
        console.log('📱 No embedded wallet found, creating one...');
        setCreatingWallet(true);
        try {
          await embeddedWallet.create();
          console.log('✅ Embedded wallet created successfully');
          toast.success('Wallet Created', 'Your embedded wallet is ready!');
        } catch (error) {
          console.error('❌ Failed to create embedded wallet:', error);
          toast.error('Error', 'Failed to create wallet. Please try again.');
        } finally {
          setCreatingWallet(false);
        }
      }
    };
    
    createWalletIfNeeded();
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await logout();
              // Call parent callback to reset auth state
              if (onLogout) {
                onLogout();
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
      toast.success('Image Selected', 'Profile picture updated!');
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
      toast.success('Photo Taken', 'Profile picture updated!');
    }
  };

  const handleChangeProfilePicture = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', 'Remove Photo'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleTakePhoto();
          } else if (buttonIndex === 2) {
            handlePickImage();
          } else if (buttonIndex === 3) {
            setProfileImage(null);
            toast.success('Removed', 'Profile picture removed');
          }
        }
      );
    } else {
      Alert.alert(
        'Change Profile Picture',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: handleTakePhoto },
          { text: 'Choose from Library', onPress: handlePickImage },
          { text: 'Remove Photo', style: 'destructive', onPress: () => { setProfileImage(null); toast.success('Removed', 'Profile picture removed'); } },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleEditProfile = () => {
    setEditProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    // Get wallet address from Privy
    const wallet = user?.linked_accounts?.find(
      (a) => a.type === 'wallet' && 'wallet_client_type' in a && a.wallet_client_type === 'privy'
    );
    
    if (__DEV__) {
      console.log('💾 Saving profile...', {
        hasWallet: !!wallet,
        walletAddress: wallet && 'address' in wallet ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : null,
        username,
        hasImage: !!profileImage,
      });
    }
    
    if (!wallet || !('address' in wallet)) {
      console.error('❌ No wallet found');
      toast.error('Error', 'Wallet not ready. Please wait a moment and try again.');
      return;
    }

    try {
      setUpdatingProfile(true);
      
      if (__DEV__) {
        console.log('📝 Updating profile in Supabase:', {
          address: `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`,
          display_name: username,
          has_avatar: !!profileImage,
        });
      }
      
      // Ensure user exists first (create if doesn't exist)
      await getOrCreateUser(wallet.address);
      
      // Update profile in Supabase using wallet address
      const result = await updateUserProfile(wallet.address, {
        display_name: username,
        avatar_url: profileImage || undefined,
      });
      
      console.log('✅ Profile updated successfully:', result);

      // Refresh profile to get latest data
      await refreshProfile();
      
      setEditProfileModalVisible(false);
      toast.success('Profile Updated', 'Your profile has been updated successfully!');
    } catch (error: any) {
      console.error('❌ Error updating profile:', error);
      toast.error('Error', error.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleCopyWallet = () => {
    const wallet = user?.linked_accounts?.find(a => a.type === 'wallet');
    if (wallet && 'address' in wallet) {
      Clipboard.setString(wallet.address);
      toast.success('Copied!', 'Wallet address copied to clipboard');
    } else {
      console.log('No wallet found. User accounts:', user?.linked_accounts?.map(a => a.type));
      toast.error('Error', 'No wallet address found');
    }
  };

  const handleGeneralSettings = () => {
    setSettingsModalVisible(true);
  };

  const handleNotifications = () => {
    Alert.alert(
      'Notifications',
      notificationsEnabled ? 'Notifications are currently enabled' : 'Notifications are currently disabled',
      [
        { text: 'OK' },
        {
          text: notificationsEnabled ? 'Disable' : 'Enable',
          onPress: () => {
            setNotificationsEnabled(!notificationsEnabled);
            toast.success(
              notificationsEnabled ? 'Notifications Disabled' : 'Notifications Enabled',
              notificationsEnabled ? 'You will no longer receive notifications' : 'You will now receive notifications'
            );
          }
        }
      ]
    );
  };

  const handlePrivacySecurity = () => {
    Alert.alert(
      'Privacy & Security',
      'Manage your privacy and security settings',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Change Password', onPress: () => toast.info('Change Password', 'Password change coming soon') },
        { text: '2FA Settings', onPress: () => toast.info('2FA', 'Two-factor authentication coming soon') }
      ]
    );
  };

  const handleWalletManage = () => {
    setWalletModalVisible(true);
  };

  const handleDisconnectWallet = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet? You will need to reconnect to access your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              setWalletModalVisible(false);
              toast.success('Disconnected', 'Wallet disconnected successfully');
              if (onLogout) {
                onLogout();
              }
            } catch (error) {
              toast.error('Error', 'Failed to disconnect wallet');
            }
          }
        }
      ]
    );
  };

  const handleExportPrivateKey = async () => {
    const wallet = user?.linked_accounts?.find(
      (a) => a.type === 'wallet' && 'wallet_client_type' in a && a.wallet_client_type === 'privy'
    );
    
    if (!wallet || !('address' in wallet)) {
      toast.error('Error', 'No embedded wallet found');
      return;
    }
    
    Alert.alert(
      '🔑 Wallet Backup',
      `Your wallet is automatically backed up to ${Platform.OS === 'ios' ? 'iCloud' : 'Google Drive'}.\n\nYou can import it into MetaMask or other wallets anytime using your device backup.\n\nWallet Address:\n${wallet.address}`,
      [
        {
          text: 'Copy Address',
          onPress: () => {
            if ('address' in wallet) {
              Clipboard.setString(wallet.address);
              toast.success('Copied!', 'Wallet address copied to clipboard');
            }
          }
        },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  const handleViewOnExplorer = () => {
    const wallet = user?.linked_accounts?.find(a => a.type === 'wallet');
    if (wallet && 'address' in wallet) {
      const explorerUrl = `https://polygonscan.com/address/${wallet.address}`;
      toast.info('Opening Explorer', `View your wallet on Polygonscan`);
      // In a real app: Linking.openURL(explorerUrl);
    }
  };

  const handleHelpCenter = () => {
    Alert.alert(
      'Help Center',
      'How can we help you?',
      [
        { text: 'FAQ', onPress: () => toast.info('FAQ', 'Frequently asked questions coming soon') },
        { text: 'Contact Support', onPress: () => toast.info('Support', 'Contact support at support@polyfield.app') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleTerms = () => {
    toast.info('Terms & Conditions', 'View our terms at polyfield.app/terms');
  };

  const handlePrivacy = () => {
    toast.info('Privacy Policy', 'View our privacy policy at polyfield.app/privacy');
  };

  const wallet = user?.linked_accounts?.find(a => a.type === 'wallet');
  const email = user?.linked_accounts?.find(a => a.type === 'email');
  
  // Use userProfile display name if available, otherwise use a generic name
  const displayName = userProfile?.display_name || username || 'PolyField User';
  const walletAddress = wallet && 'address' in wallet ? wallet.address : null;

  const menuItems = [
    {
      section: 'Account',
      items: [
        { icon: 'settings-outline', title: 'General Settings', onPress: handleGeneralSettings },
        { icon: 'notifications-outline', title: 'Notifications', subtitle: notificationsEnabled ? 'On' : 'Off', onPress: handleNotifications },
        { icon: 'shield-checkmark-outline', title: 'Privacy & Security', onPress: handlePrivacySecurity },
        { icon: 'flash-outline', title: 'Toast Demo', onPress: () => navigation.navigate('ToastDemo' as never) },
      ]
    },
    {
      section: 'Preferences',
      items: [
        { 
          icon: darkMode ? 'moon-outline' : 'sunny-outline', 
          title: 'Theme', 
          subtitle: darkMode ? 'Dark' : 'Light',
          onPress: toggleMode,
          hasSwitch: true
        },
        { icon: 'wallet-outline', title: 'Manage Wallet', onPress: handleWalletManage },
      ]
    },
    {
      section: 'Support',
      items: [
        { icon: 'help-circle-outline', title: 'Help Center', onPress: handleHelpCenter },
        { icon: 'document-text-outline', title: 'Terms & Conditions', onPress: handleTerms },
        { icon: 'shield-outline', title: 'Privacy Policy', onPress: handlePrivacy },
      ]
    },
  ];

  return (
    <ScrollView style={[themedStyles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={themedStyles.content}>
      {/* User Info Card */}
      <View style={[themedStyles.userCard, { backgroundColor: theme.colors.card }]}>
        <TouchableOpacity onPress={handleChangeProfilePicture} style={themedStyles.avatarContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={themedStyles.avatarImage} />
          ) : (
            <View style={themedStyles.avatar}>
              <Ionicons name="person" size={36} color="#fff" />
            </View>
          )}
          <View style={themedStyles.cameraIconBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <View style={themedStyles.userInfo}>
          <Text style={[themedStyles.userName, { color: theme.colors.text }]}>
            {displayName}
          </Text>
          {walletAddress && (
            <TouchableOpacity style={themedStyles.walletBadge} onPress={handleCopyWallet}>
              <Ionicons name="wallet" size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[themedStyles.walletText, { color: theme.colors.text }]}>
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </Text>
              <Ionicons name="copy-outline" size={12} color={colors.textSecondary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={themedStyles.editButton} onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={themedStyles.statsContainer}>
        <View style={themedStyles.statBox}>
          <Text style={themedStyles.statValue}>0</Text>
          <Text style={themedStyles.statLabel}>Total Bets</Text>
        </View>
        <View style={themedStyles.statDivider} />
        <View style={themedStyles.statBox}>
          <Text style={themedStyles.statValue}>-</Text>
          <Text style={themedStyles.statLabel}>Win Rate</Text>
        </View>
        <View style={themedStyles.statDivider} />
        <View style={themedStyles.statBox}>
          <Text style={themedStyles.statValue}>$0</Text>
          <Text style={themedStyles.statLabel}>Volume</Text>
        </View>
      </View>

      {/* Menu Sections */}
      {menuItems.map((section, index) => (
        <View key={index} style={themedStyles.section}>
          <Text style={[themedStyles.sectionTitle, { color: theme.colors.text }]}>{section.section}</Text>
          <View style={[themedStyles.menuCard, { backgroundColor: theme.colors.card }]}>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex}>
                <TouchableOpacity 
                  style={themedStyles.menuItem}
                  onPress={item.onPress}
                >
                  <View style={themedStyles.menuItemLeft}>
                    <View style={themedStyles.menuIcon}>
                      <Ionicons 
                        name={item.icon as any} 
                        size={20} 
                        color="#6366f1" 
                      />
                    </View>
                    <View>
                      <Text style={[themedStyles.menuItemTitle, { color: theme.colors.text }]}>{item.title}</Text>
                      {item.subtitle && (
                        <Text style={[themedStyles.menuItemSubtitle, { color: theme.colors.text }]}>{item.subtitle}</Text>
                      )}
                    </View>
                  </View>
                  {('hasSwitch' in item && item.hasSwitch) ? (
                    <View style={[
                      themedStyles.switch, 
                      darkMode && themedStyles.switchActive
                    ]}>
                      <View style={[
                        themedStyles.switchThumb,
                        darkMode && themedStyles.switchThumbActive
                      ]} />
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
                  )}
                </TouchableOpacity>
                {itemIndex < section.items.length - 1 && <View style={themedStyles.divider} />}
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Logout Button */}
      <TouchableOpacity style={themedStyles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={themedStyles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={[themedStyles.version, { color: theme.colors.text }]}>PolyField v1.0.0</Text>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <View style={themedStyles.modalOverlay}>
          <View style={[themedStyles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[themedStyles.modalTitle, { color: theme.colors.text }]}>Edit Profile</Text>
            
            <TouchableOpacity style={themedStyles.imagePickerButton} onPress={handleChangeProfilePicture}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={themedStyles.modalAvatar} />
              ) : (
                <View style={[themedStyles.modalAvatar, { backgroundColor: colors.primary }]}>
                  <Ionicons name="person" size={40} color="#fff" />
                </View>
              )}
              <View style={themedStyles.modalCameraIcon}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>

            <TextInput
              style={[themedStyles.input, { color: theme.colors.text, borderColor: colors.border }]}
              placeholder="Username"
              placeholderTextColor={colors.textTertiary}
              value={username}
              onChangeText={setUsername}
            />
            <View style={themedStyles.modalButtons}>
              <TouchableOpacity
                style={[themedStyles.modalButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => setEditProfileModalVisible(false)}
              >
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[themedStyles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveProfile}
              >
                <Text style={{ color: '#fff' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={themedStyles.modalOverlay}>
          <View style={[themedStyles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[themedStyles.modalTitle, { color: theme.colors.text }]}>General Settings</Text>
            
            <View style={themedStyles.settingRow}>
              <Text style={[themedStyles.settingLabel, { color: theme.colors.text }]}>Email Notifications</Text>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: colors.surfaceSecondary, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={themedStyles.settingRow}>
              <Text style={[themedStyles.settingLabel, { color: theme.colors.text }]}>Push Notifications</Text>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: colors.surfaceSecondary, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity
              style={[themedStyles.modalButton, { backgroundColor: colors.primary, marginTop: 20 }]}
              onPress={() => {
                setSettingsModalVisible(false);
                toast.success('Settings Saved', 'Your preferences have been updated');
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Wallet Management Modal */}
      <Modal
        visible={walletModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWalletModalVisible(false)}
      >
        <View style={themedStyles.modalOverlay}>
          <View style={[themedStyles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={themedStyles.modalHeader}>
              <Text style={[themedStyles.modalTitle, { color: theme.colors.text }]}>Manage Wallet</Text>
              <TouchableOpacity onPress={() => setWalletModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {walletAddress ? (
              <View>
                {/* Wallet Address Display */}
                <View style={[themedStyles.walletAddressBox, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[themedStyles.walletAddressLabel, { color: colors.textSecondary }]}>Wallet Address</Text>
                  <Text style={[themedStyles.walletAddressFull, { color: theme.colors.text }]} selectable>
                    {walletAddress}
                  </Text>
                </View>

                {/* Wallet Actions */}
                <View style={themedStyles.walletActions}>
                  <TouchableOpacity
                    style={[themedStyles.walletActionButton, { backgroundColor: colors.primary }]}
                    onPress={handleCopyWallet}
                  >
                    <Ionicons name="copy-outline" size={20} color="#fff" />
                    <Text style={themedStyles.walletActionText}>Copy Address</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[themedStyles.walletActionButton, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={handleViewOnExplorer}
                  >
                    <Ionicons name="open-outline" size={20} color={colors.text} />
                    <Text style={[themedStyles.walletActionText, { color: colors.text }]}>View on Explorer</Text>
                  </TouchableOpacity>
                </View>

                {/* Wallet Backup Info */}
                <TouchableOpacity
                  style={[themedStyles.exportKeyButton, { backgroundColor: colors.primary, marginTop: 20 }]}
                  onPress={handleExportPrivateKey}
                  disabled={exportingKey}
                >
                  {exportingKey ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark-outline" size={22} color="#fff" />
                      <Text style={themedStyles.exportKeyButtonText}>Wallet Backup Info</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : creatingWallet ? (
              <View style={themedStyles.noWalletContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[themedStyles.noWalletText, { color: colors.textSecondary, marginTop: 16 }]}>Creating your wallet...</Text>
                <Text style={[themedStyles.advancedOptionSubtitle, { color: colors.textTertiary, marginTop: 8, textAlign: 'center' }]}>
                  This will only take a moment
                </Text>
              </View>
            ) : (
              <View style={themedStyles.noWalletContainer}>
                <Ionicons name="wallet-outline" size={64} color={colors.textTertiary} />
                <Text style={[themedStyles.noWalletText, { color: colors.textSecondary }]}>No wallet connected</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 0.8,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}26`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: colors.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  logoutButton: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 16,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  walletText: {
    fontSize: 11,
    fontFamily: 'Unbounded_700Bold',
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    fontFamily: 'Unbounded_700Bold',
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  imagePickerButton: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  walletAddressBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  walletAddressLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  walletAddressFull: {
    fontSize: 13,
    fontFamily: 'Unbounded_400Regular',
    lineHeight: 20,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  walletActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  walletActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  advancedSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  advancedOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  advancedOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  advancedOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  advancedOptionSubtitle: {
    fontSize: 12,
  },
  exportKeyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  exportKeyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  noWalletContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noWalletText: {
    fontSize: 15,
    marginTop: 12,
  },
});

