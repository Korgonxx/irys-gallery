import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSetup } from './ProfileSetup';
import { 
  User, 
  Edit, 
  Twitter, 
  MessageCircle, 
  Calendar, 
  Palette, 
  Eye, 
  Heart,
  Grid,
  Settings
} from 'lucide-react';

export const ProfileView = () => {
  const { connected, publicKey } = useWallet();
  const [user, setUser] = useState(null);
  const [userArtworks, setUserArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [activeTab, setActiveTab] = useState('artworks');

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserProfile();
    }
  }, [connected, publicKey]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // First, connect/get user by wallet address
      const connectResponse = await fetch('/api/users/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: publicKey.toString()
        }),
      });

      if (connectResponse.ok) {
        const connectData = await connectResponse.json();
        setUser(connectData.user);

        // If it's a new user or incomplete profile, show setup
        if (connectData.is_new_user || !connectData.user.username) {
          setShowProfileSetup(true);
        }

        // Fetch user's artworks
        const artworksResponse = await fetch(`/api/artworks?user_id=${connectData.user.id}`);
        if (artworksResponse.ok) {
          const artworksData = await artworksResponse.json();
          setUserArtworks(artworksData.artworks);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = (updatedUser) => {
    setUser(updatedUser);
    setShowProfileSetup(false);
  };

  const handleProfileSkip = () => {
    setShowProfileSetup(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalStats = () => {
    const totalViews = userArtworks.reduce((sum, artwork) => sum + artwork.views, 0);
    const totalLikes = userArtworks.reduce((sum, artwork) => sum + artwork.likes, 0);
    return { totalViews, totalLikes };
  };

  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600">Please connect your Solana wallet to view your profile</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  const { totalViews, totalLikes } = getTotalStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showProfileSetup && (
        <ProfileSetup
          user={user}
          onComplete={handleProfileComplete}
          onSkip={handleProfileSkip}
        />
      )}

      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <Avatar className="w-24 h-24 md:w-32 md:h-32">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl md:text-3xl">
                {user?.username ? user.username[0].toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>

            {/* Profile Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {user?.username || 'Anonymous Artist'}
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                  </p>
                </div>
                <Button
                  onClick={() => setShowProfileSetup(true)}
                  variant="outline"
                  className="mt-2 sm:mt-0"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>

              {user?.bio && (
                <p className="text-gray-700 max-w-2xl">{user.bio}</p>
              )}

              {/* Social Links */}
              <div className="flex flex-wrap gap-2">
                {user?.x_handle && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Twitter className="h-3 w-3" />
                    <span>{user.x_handle}</span>
                  </Badge>
                )}
                {user?.discord_handle && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <MessageCircle className="h-3 w-3" />
                    <span>{user.discord_handle}</span>
                  </Badge>
                )}
                {user?.created_at && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {formatDate(user.created_at)}</span>
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{userArtworks.length}</p>
                <p className="text-sm text-gray-600">Artworks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalViews}</p>
                <p className="text-sm text-gray-600">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{totalLikes}</p>
                <p className="text-sm text-gray-600">Total Likes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Grid className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {userArtworks.filter(a => a.file_type === 'image').length}
                </p>
                <p className="text-sm text-gray-600">Images</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="artworks">My Artworks</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="artworks" className="mt-6">
          {userArtworks.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No artworks yet</h3>
                  <p className="text-gray-600 mb-4">Start showcasing your art by uploading your first piece</p>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                    Upload Your First Artwork
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userArtworks.map((artwork) => (
                <Card key={artwork.id} className="group hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-t-lg overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-500">Image Placeholder</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-purple-600 transition-colors">
                        {artwork.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{artwork.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Heart className="h-3 w-3" />
                            <span>{artwork.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{artwork.views}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {artwork.file_type}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Account Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Wallet Address</h4>
                <p className="text-sm text-gray-600 font-mono">{user?.wallet_address}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900">Permanent Storage</h4>
                <p className="text-sm text-blue-700">
                  Your artworks are permanently stored on the Irys blockchain and cannot be deleted. 
                  This ensures your art will be preserved forever.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

