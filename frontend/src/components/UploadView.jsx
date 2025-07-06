import React, { useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  X, 
  Check, 
  AlertCircle,
  FileImage,
  FileVideo
} from 'lucide-react';

export const UploadView = ({ onUploadSuccess }) => {
  const { connected, publicKey } = useWallet();
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (connected && publicKey) {
      fetchUser();
    }
  }, [connected, publicKey]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/users/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: publicKey.toString()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov'];
    if (!validTypes.includes(file.type)) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a valid image (JPEG, PNG, GIF, WebP) or video (MP4, WebM, MOV) file.'
      });
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setUploadStatus({
        type: 'error',
        message: 'File size must be less than 50MB.'
      });
      return;
    }

    setSelectedFile(file);
    setUploadStatus(null);

    // Create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Auto-fill title if empty
    if (!formData.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setFormData(prev => ({ ...prev, title: fileName }));
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Simulate file input change
      const fakeEvent = { target: { files: [file] } };
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setFormData({ title: '', description: '' });
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    
    if (!selectedFile || !formData.title.trim() || !user) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a file and provide a title.'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('title', formData.title.trim());
      uploadFormData.append('description', formData.description.trim());
      uploadFormData.append('user_id', user.id);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/artworks', {
        method: 'POST',
        body: uploadFormData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        setUploadStatus({
          type: 'success',
          message: 'Artwork uploaded successfully to Irys blockchain!'
        });
        
        // Reset form
        setTimeout(() => {
          removeFile();
          setUploadProgress(0);
          setUploadStatus(null);
          if (onUploadSuccess) {
            onUploadSuccess(data.artwork);
          }
        }, 2000);
      } else {
        const error = await response.json();
        setUploadStatus({
          type: 'error',
          message: error.error || 'Upload failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: 'Upload failed. Please check your connection and try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600">Please connect your Solana wallet to upload artwork</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Art</h1>
        <p className="text-gray-600">Share your creativity with permanent storage on the Irys blockchain</p>
      </div>

      <form onSubmit={handleUpload} className="space-y-6">
        {/* File Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Select Your Artwork</span>
            </CardTitle>
            <CardDescription>
              Upload images (JPEG, PNG, GIF, WebP) or videos (MP4, WebM, MOV) up to 50MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-4">
                  <div className="flex justify-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                      <Video className="h-6 w-6 text-pink-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">Drop your file here, or click to browse</p>
                    <p className="text-sm text-gray-500 mt-1">Supports images and videos up to 50MB</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Preview */}
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {selectedFile.type.startsWith('image/') ? (
                      preview ? (
                        <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                      ) : (
                        <div className="w-20 h-20 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FileImage className="h-8 w-8 text-purple-600" />
                        </div>
                      )
                    ) : (
                      <div className="w-20 h-20 bg-pink-100 rounded-lg flex items-center justify-center">
                        <FileVideo className="h-8 w-8 text-pink-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Artwork Details */}
        {selectedFile && (
          <Card>
            <CardHeader>
              <CardTitle>Artwork Details</CardTitle>
              <CardDescription>
                Provide information about your artwork
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Give your artwork a title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your artwork, inspiration, or technique..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Progress */}
        {uploading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading to Irys blockchain...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Messages */}
        {uploadStatus && (
          <Alert className={uploadStatus.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            {uploadStatus.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <Check className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={uploadStatus.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {uploadStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        {selectedFile && (
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={uploading || !formData.title.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
            >
              {uploading ? 'Uploading...' : 'Upload to Irys'}
            </Button>
          </div>
        )}
      </form>

      {/* Info Card */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Permanent Storage</h4>
              <p className="text-sm text-gray-600">
                Your artwork will be permanently stored on the Irys blockchain and cannot be deleted. 
                This ensures your art will be preserved forever and accessible to anyone with the link.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

