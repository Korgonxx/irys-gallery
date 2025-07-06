import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Grid, List, Heart, Eye, Calendar, User, RefreshCw } from 'lucide-react';

export const GalleryView = () => {
  const { connected } = useWallet();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filterType, setFilterType] = useState('all');
  const [pagination, setPagination] = useState({
    current_page: 1,
    total: 0,
    pages: 0,
    per_page: 12
  });

  useEffect(() => {
    fetchArtworks();
  }, [filterType, searchTerm]);

  const fetchArtworks = async (page = 1) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: pagination.per_page.toString()
      });
      
      if (filterType !== 'all') {
        params.append('file_type', filterType);
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await fetch(`/api/artworks?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setArtworks(data.artworks);
        setPagination({
          current_page: data.current_page,
          total: data.total,
          pages: data.pages,
          per_page: data.per_page
        });
      } else {
        console.error('Failed to fetch artworks');
        setArtworks([]);
      }
    } catch (error) {
      console.error('Error fetching artworks:', error);
      setArtworks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (artworkId) => {
    try {
      const response = await fetch(`/api/artworks/${artworkId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update the artwork in the list
        setArtworks(prev => prev.map(artwork => 
          artwork.id === artworkId 
            ? { ...artwork, likes: data.likes }
            : artwork
        ));
      }
    } catch (error) {
      console.error('Error liking artwork:', error);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    fetchArtworks(1);
  };

  const filteredArtworks = artworks;

  if (loading && artworks.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading artworks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Art Gallery</h1>
        <p className="text-gray-600">Discover amazing art stored permanently on the blockchain</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search artworks, artists, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchArtworks(pagination.current_page)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={filterType === 'all' ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => setFilterType('all')}
          >
            All ({pagination.total})
          </Badge>
          <Badge
            variant={filterType === 'image' ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => setFilterType('image')}
          >
            Images
          </Badge>
          <Badge
            variant={filterType === 'video' ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => setFilterType('video')}
          >
            Videos
          </Badge>
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredArtworks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterType !== 'all' ? 'No artworks found' : 'No artworks yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Be the first to upload artwork to the gallery'
            }
          </p>
          {connected && (
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              Upload Your First Artwork
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredArtworks.map((artwork) => (
              <Card key={artwork.id} className="group hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-0">
                  {viewMode === 'grid' ? (
                    <div>
                      <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                        {artwork.thumbnail_url || artwork.file_url ? (
                          <img 
                            src={artwork.thumbnail_url || artwork.file_url} 
                            alt={artwork.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <span className="text-gray-500">
                            {artwork.file_type === 'image' ? 'Image' : 'Video'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-purple-600 transition-colors">
                          {artwork.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{artwork.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{artwork.artist}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {artwork.file_type}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => handleLike(artwork.id)}
                              className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                            >
                              <Heart className="h-3 w-3" />
                              <span>{artwork.likes}</span>
                            </button>
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{artwork.views}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(artwork.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex p-4 space-x-4">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {artwork.thumbnail_url || artwork.file_url ? (
                          <img 
                            src={artwork.thumbnail_url || artwork.file_url} 
                            alt={artwork.title}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span className="text-gray-500 text-xs">
                          {artwork.file_type === 'image' ? 'Image' : 'Video'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-purple-600 transition-colors">
                          {artwork.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{artwork.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{artwork.artist}</span>
                            </div>
                            <button 
                              onClick={() => handleLike(artwork.id)}
                              className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                            >
                              <Heart className="h-3 w-3" />
                              <span>{artwork.likes}</span>
                            </button>
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
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchArtworks(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.current_page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchArtworks(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Connect Wallet CTA */}
      {!connected && artworks.length > 0 && (
        <div className="mt-12 text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-8">
          <h3 className="text-xl font-semibold mb-2">Ready to showcase your art?</h3>
          <p className="text-gray-600 mb-4">Connect your Solana wallet to start uploading and managing your digital art collection.</p>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
            Connect Wallet to Get Started
          </Button>
        </div>
      )}
    </div>
  );
};

