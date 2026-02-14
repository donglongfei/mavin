import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Card } from './ui/card';
import { Upload, X, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { avatarApi, type AvatarImage, type AvatarStateConfig } from '../services/avatarApi';

interface AvatarSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVATAR_STATES = [
  { key: 'idle' as const, label: 'Idle', color: 'neon-cyan', description: 'Waiting for input' },
  { key: 'speaking' as const, label: 'Speaking', color: 'neon-purple', description: 'Active response' },
  { key: 'thinking' as const, label: 'Thinking', color: 'neon-cyan', description: 'Processing request' },
  { key: 'listening' as const, label: 'Listening', color: 'neon-orange', description: 'Recording voice' },
];

export function AvatarSettings({ open, onOpenChange }: AvatarSettingsProps) {
  const [images, setImages] = useState<AvatarImage[]>([]);
  const [preferences, setPreferences] = useState<AvatarStateConfig>({
    idle: null,
    speaking: null,
    thinking: null,
    listening: null,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectingFor, setSelectingFor] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('gallery');

  // Load images and preferences on mount
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [imagesRes, prefsRes] = await Promise.all([
        avatarApi.getImages(),
        avatarApi.getPreferences(),
      ]);

      if (imagesRes.success) {
        setImages(imagesRes.images);
      }

      if (prefsRes.success && prefsRes.preferences) {
        setPreferences(prefsRes.preferences.stateConfig);
      }
    } catch (error) {
      console.error('Failed to load avatar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setUploading(true);
    try {
      const result = await avatarApi.uploadImage(selectedImage);
      if (result.success && result.image) {
        setImages((prev) => [...prev, result.image!]);
        setSelectedImage(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        alert(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const result = await avatarApi.deleteImage(imageId);
      if (result.success) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        // Clear from preferences if used
        const newPrefs = { ...preferences };
        Object.keys(newPrefs).forEach((key) => {
          if (newPrefs[key as keyof AvatarStateConfig] === imageId) {
            newPrefs[key as keyof AvatarStateConfig] = null;
          }
        });
        setPreferences(newPrefs);
      } else {
        alert(result.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete image');
    }
  };

  const handleSelectImageForState = (imageId: string) => {
    if (!selectingFor) return;

    setPreferences((prev) => ({
      ...prev,
      [selectingFor]: imageId,
    }));
    setSelectingFor(null);
    setCurrentTab('states');
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const result = await avatarApi.updatePreferences(preferences);
      if (result.success) {
        alert('Avatar preferences saved successfully!');
        onOpenChange(false);
        // Dispatch custom event to notify DigitalAvatar to reload
        window.dispatchEvent(new CustomEvent('avatarSettingsChanged'));
      } else {
        alert(result.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-background/95 backdrop-blur border-neon-cyan/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-neon-cyan">Avatar Settings</DialogTitle>
          <DialogDescription>Customize your digital avatar appearance for each state</DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 bg-card/50">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="states">Configure States</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {/* Selection Mode Banner */}
              {selectingFor && (
                <div className="mb-4 p-4 bg-neon-cyan/10 border-2 border-neon-cyan/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-neon-cyan text-sm mb-1">
                        SELECT IMAGE FOR: {selectingFor.toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">Click any image below to assign it to this state</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectingFor(null);
                        setCurrentTab('states');
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
                </div>
              ) : images.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                  <p>No avatar images uploaded yet</p>
                  <p className="text-sm mt-2">Go to "Upload New" tab to add images</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2">
                  {images.map((image) => {
                    const isUsed = Object.values(preferences).includes(image.id);
                    return (
                      <Card
                        key={image.id}
                        className={`group relative overflow-hidden border-2 transition-all hover:border-neon-cyan/50 ${
                          selectingFor
                            ? 'cursor-pointer hover:scale-105'
                            : ''
                        } ${isUsed ? 'border-neon-cyan/30' : 'border-card'}`}
                        onClick={() => selectingFor && handleSelectImageForState(image.id)}
                      >
                        <div className="aspect-square relative">
                          <img
                            src={`http://localhost:8002${image.thumbnailUrl}`}
                            alt={image.originalName}
                            className="w-full h-full object-cover"
                          />
                          {isUsed && (
                            <div className="absolute top-2 left-2 bg-neon-cyan/90 text-black px-2 py-1 rounded text-xs font-bold">
                              IN USE
                            </div>
                          )}
                          {selectingFor && (
                            <div className="absolute inset-0 bg-neon-cyan/20 flex items-center justify-center">
                              <Check className="h-12 w-12 text-neon-cyan" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(image.id);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-2 bg-card/50">
                          <p className="text-xs text-muted-foreground truncate">{image.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {image.dimensions.width}×{image.dimensions.height}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Configure States Tab */}
          <TabsContent value="states" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="p-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {AVATAR_STATES.map((state) => {
                    const assignedImageId = preferences[state.key];
                    const assignedImage = images.find((img) => img.id === assignedImageId);

                    return (
                      <Card key={state.key} className="p-3 border-card hover:border-neon-cyan/30 transition-colors">
                        <div className="space-y-2">
                          {/* State Header */}
                          <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full bg-${state.color} glow-${state.color.split('-')[1]}`} />
                            <h3 className={`text-xs font-bold text-${state.color} uppercase tracking-wide`}>{state.label}</h3>
                          </div>

                          {/* Image Preview */}
                          <div className="aspect-square rounded-lg border-2 border-card overflow-hidden bg-card/50">
                            {assignedImage ? (
                              <img
                                src={`http://localhost:8002${assignedImage.thumbnailUrl}`}
                                alt={state.label}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <ImageIcon className="h-8 w-8 opacity-30" />
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{state.description}</p>

                          {/* Action Buttons */}
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectingFor(state.key);
                                setCurrentTab('gallery');
                              }}
                              className="flex-1 border-neon-cyan/30 hover:border-neon-cyan text-[10px] h-7 px-2"
                            >
                              {assignedImage ? 'Change' : 'Select'}
                            </Button>
                            {assignedImage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPreferences((prev) => ({ ...prev, [state.key]: null }));
                                }}
                                className="text-muted-foreground hover:text-destructive text-[10px] h-7 px-2"
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Save/Cancel Buttons */}
                <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-border">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSavePreferences}
                    disabled={loading}
                    className="bg-neon-cyan text-black hover:bg-neon-cyan/80"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Preferences
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Upload New Tab */}
          <TabsContent value="upload" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="p-4 space-y-6">
                <Card className="p-8 border-2 border-dashed border-neon-cyan/30 hover:border-neon-cyan/50 transition-colors">
                  <div className="flex flex-col items-center justify-center text-center">
                    {previewUrl ? (
                      <div className="mb-4">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-w-sm max-h-64 rounded-lg border-2 border-neon-cyan/30"
                        />
                      </div>
                    ) : (
                      <Upload className="h-16 w-16 mb-4 text-neon-cyan/50" />
                    )}

                    <h3 className="text-lg font-bold text-neon-cyan mb-2">
                      {previewUrl ? 'Image Selected' : 'Upload Avatar Image'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      JPG, PNG, or WEBP • Max 10MB
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-neon-cyan/30 hover:border-neon-cyan"
                      >
                        Choose File
                      </Button>

                      {selectedImage && (
                        <Button
                          onClick={handleUpload}
                          disabled={uploading}
                          className="bg-neon-cyan text-black hover:bg-neon-cyan/80"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {selectedImage && (
                      <p className="text-xs text-muted-foreground mt-4">
                        {selectedImage.name} • {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                </Card>

                <Card className="p-4 bg-card/50">
                  <h4 className="font-bold text-sm mb-2">Tips for best results:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Use high-quality portrait photos</li>
                    <li>Square or vertical aspect ratios work best</li>
                    <li>Clear, well-lit images produce better results</li>
                    <li>Faces should be centered and clearly visible</li>
                  </ul>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
