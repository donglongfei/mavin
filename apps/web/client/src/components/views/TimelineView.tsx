/**
 * Cyberpunk Lab - Timeline View (Best for Students)
 * 
 * Features: Vertical timeline with audio/note/snapshot/summary cards
 * Design: Glowing cyan timeline with hexagonal markers, card-based layout
 */

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mic,
  FileText,
  Camera,
  Sparkles,
  Play,
  Download,
  Image as ImageIcon,
  FileIcon,
  Loader2,
  RefreshCw,
  X,
  Square
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface TimelineItem {
  event_id: string;
  event_type: "audio" | "image" | "file" | "chat_session" | "note";
  title: string;
  description?: string;
  file_id?: string;
  file_url?: string;
  duration_seconds?: number;
  transcription_text?: string;
  message_count?: number;
  session_summary?: string;
  created_at: string;
}

interface TimelineViewProps {
  projectId?: string;
}

const typeConfig = {
  audio: { icon: Mic, color: "text-neon-cyan", bgColor: "bg-neon-cyan/10", borderColor: "border-neon-cyan/30", label: "Audio" },
  image: { icon: Camera, color: "text-neon-orange", bgColor: "bg-neon-orange/10", borderColor: "border-neon-orange/30", label: "Image" },
  file: { icon: FileIcon, color: "text-neon-purple", bgColor: "bg-neon-purple/10", borderColor: "border-neon-purple/30", label: "File" },
  chat_session: { icon: Sparkles, color: "text-neon-cyan", bgColor: "bg-neon-cyan/10", borderColor: "border-neon-cyan/30", label: "AI Summary" },
  note: { icon: FileText, color: "text-neon-purple", bgColor: "bg-neon-purple/10", borderColor: "border-neon-purple/30", label: "Note" }
};

export default function TimelineView({ projectId }: TimelineViewProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Transcription dialog state
  const [showTranscription, setShowTranscription] = useState(false);
  const [transcriptionContent, setTranscriptionContent] = useState('');
  const [transcriptionTitle, setTranscriptionTitle] = useState('');
  const [loadingTranscription, setLoadingTranscription] = useState(false);

  const loadTimeline = useCallback(async (showLoader = true) => {
    if (!projectId) return;

    if (showLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch(`http://localhost:8002/api/panel/projects/${projectId}/timeline`);
      const data = await response.json();
      if (data.success) {
        setTimeline(data.timeline);
      }
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId]);

  // Initial load
  useEffect(() => {
    if (projectId) {
      loadTimeline(true);
    } else {
      setTimeline([]);
    }
  }, [projectId, loadTimeline]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!projectId) return;

    const interval = setInterval(() => {
      loadTimeline(false); // Silent refresh, no loader
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [projectId, loadTimeline]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  // Handle playing audio
  const handlePlayAudio = (fileUrl: string, eventId: string) => {
    console.log('Attempting to play audio:', fileUrl);

    if (playingAudio === eventId) {
      // Stop playing
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      setPlayingAudio(null);
      setAudioProgress(0);
      setAudioDuration(0);
      return;
    }

    // Stop previous audio if any
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }

    // Create and play new audio
    const audio = new Audio();

    // Add error handler
    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      console.error('Failed URL:', fileUrl);
      alert(`Failed to play audio. URL: ${fileUrl}\n\nPlease check if the file exists and is accessible.`);
      setPlayingAudio(null);
      setAudioProgress(0);
      setAudioDuration(0);
    };

    // Add loaded handler
    audio.onloadeddata = () => {
      console.log('Audio loaded successfully');
      setAudioDuration(audio.duration);
    };

    // Track playback progress
    audio.ontimeupdate = () => {
      setAudioProgress(audio.currentTime);
    };

    audio.src = fileUrl;
    audio.play().catch(err => {
      console.error('Play failed:', err);
      alert(`Audio playback failed: ${err.message}`);
      setPlayingAudio(null);
      setAudioProgress(0);
      setAudioDuration(0);
    });

    setAudioElement(audio);
    setPlayingAudio(eventId);

    // Reset when finished
    audio.onended = () => {
      setPlayingAudio(null);
      setAudioProgress(0);
      setAudioDuration(0);
    };
  };

  // Handle transcribing audio
  const handleTranscribeAudio = async (fileId: string | undefined, eventId: string) => {
    try {
      // Get the timeline item for title
      const item = timeline.find(t => t.event_id === eventId);
      setTranscriptionTitle(item?.title || 'Audio Transcription');

      // Check if transcription already exists in timeline data
      if (item?.transcription_text) {
        setTranscriptionContent(item.transcription_text);
        setShowTranscription(true);
        return;
      }

      // Fetch transcription from API using fileId
      if (!fileId) {
        setTranscriptionContent('No file ID available for transcription.');
        setShowTranscription(true);
        return;
      }

      setLoadingTranscription(true);
      setShowTranscription(true);
      setTranscriptionContent('Loading transcription...');

      const response = await fetch(`http://localhost:8002/api/storage/files/${fileId}/transcription`);
      const data = await response.json();

      if (data.success && data.transcription) {
        setTranscriptionContent(data.transcription);
      } else {
        setTranscriptionContent('No transcription found.\n\nAudio transcriptions are created automatically during upload. If this is a recently uploaded file, the transcription may still be processing.');
      }
    } catch (error) {
      console.error('Failed to get transcription:', error);
      setTranscriptionContent('Failed to load transcription. Please try again.');
    } finally {
      setLoadingTranscription(false);
    }
  };

  // Handle opening files
  const handleOpenFile = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  // Handle viewing images
  const handleViewImage = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!projectId) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Select a project to view its timeline</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No events yet. Upload files or start a discussion!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* Timeline Header with Refresh Button - more compact */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
          <span className="text-xs text-muted-foreground">
            {timeline.length} {timeline.length === 1 ? 'event' : 'events'}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => loadTimeline(true)}
          disabled={isRefreshing || isLoading}
          className="h-6 text-xs px-2 text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/10"
        >
          <RefreshCw className={`h-2.5 w-2.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Timeline Content with custom thin scrollbar */}
      <ScrollArea className="flex-1 timeline-scrollarea">
        <div className="relative pl-4 pr-1.5 py-1.5">
          {/* Vertical Timeline Line - thinner */}
          <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-neon-cyan/30 via-neon-purple/30 to-neon-cyan/30" />

          {/* Timeline Items */}
          <div className="space-y-1.5">
            {timeline.map((item, index) => {
            const config = typeConfig[item.event_type];
            const Icon = config.icon;

            return (
              <div key={item.event_id} className="relative">
                {/* Timeline Marker (Dot) - smaller and aligned */}
                <div className={`absolute -left-[0.625rem] top-1.5 w-2.5 h-2.5 rounded-full ${config.bgColor} border ${config.borderColor} flex items-center justify-center z-10`}>
                  <Icon className={`h-1.5 w-1.5 ${config.color}`} />
                </div>

                {/* Timeline Card - ultra compact with readable fonts */}
                <Card className={`p-2 bg-card/50 border ${config.borderColor} hover:bg-card/70 transition-colors`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`${config.color} ${config.borderColor} text-xs px-1.5 py-0 h-4 leading-none`}>
                        {formatTime(item.created_at)}
                      </Badge>
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 leading-none">
                        {config.label}
                      </Badge>
                    </div>
                    {item.duration_seconds && (
                      <span className="text-xs text-muted-foreground">{formatDuration(item.duration_seconds)}</span>
                    )}
                  </div>

                  <h3 className="font-medium text-sm mb-1 truncate leading-tight" title={item.title}>
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-1 leading-tight">{item.description}</p>
                  )}

                  {item.session_summary && (
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-1 leading-tight">{item.session_summary}</p>
                  )}

                  {item.message_count && (
                    <p className="text-xs text-muted-foreground mb-1 leading-tight">
                      {item.message_count} messages
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    {item.event_type === "audio" && item.file_url && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`
                            h-6 text-xs px-1.5 transition-all duration-300
                            ${playingAudio === item.event_id
                              ? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.5)] animate-pulse'
                              : 'border-border/50 hover:border-neon-cyan/50 hover:bg-neon-cyan/10 hover:text-neon-cyan'
                            }
                          `}
                          onClick={() => handlePlayAudio(item.file_url!, item.event_id)}
                        >
                          {playingAudio === item.event_id ? (
                            <>
                              <Square className="h-2 w-2 mr-0.5 fill-current" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Play className="h-2 w-2 mr-0.5" />
                              Play
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-1.5 border-border/50 hover:border-neon-purple/50 hover:bg-neon-purple/10 hover:text-neon-purple"
                          onClick={() => handleTranscribeAudio(item.file_id, item.event_id)}
                        >
                          <FileText className="h-2 w-2 mr-0.5" />
                          Transcribe
                        </Button>
                      </>
                    )}
                    {item.event_type === "image" && item.file_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-1.5 border-border/50 hover:border-neon-orange/50 hover:bg-neon-orange/10 hover:text-neon-orange transition-all duration-300"
                        onClick={() => handleViewImage(item.file_url!)}
                      >
                        <ImageIcon className="h-2 w-2 mr-0.5" />
                        View
                      </Button>
                    )}
                    {item.event_type === "chat_session" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-1.5 border-border/50 hover:border-neon-cyan/50 hover:bg-neon-cyan/10 hover:text-neon-cyan transition-all duration-300"
                      >
                        <Download className="h-2 w-2 mr-0.5" />
                        Export
                      </Button>
                    )}
                    {item.event_type === "file" && item.file_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-1.5 border-border/50 hover:border-neon-purple/50 hover:bg-neon-purple/10 hover:text-neon-purple transition-all duration-300"
                        onClick={() => handleOpenFile(item.file_url!)}
                      >
                        <FileIcon className="h-2 w-2 mr-0.5" />
                        Open
                      </Button>
                    )}
                  </div>

                  {/* Audio Progress Indicator */}
                  {item.event_type === "audio" && playingAudio === item.event_id && (
                    <div className="mt-1 space-y-0.5">
                      {/* Progress bar */}
                      <div className="w-full h-px bg-border/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-100"
                          style={{ width: `${(audioProgress / audioDuration) * 100}%` }}
                        />
                      </div>
                      {/* Time display */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground leading-none">
                        <span className="text-neon-cyan font-mono">
                          {formatDuration(Math.floor(audioProgress))}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDuration(Math.floor(audioDuration))}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>

    {/* Transcription Dialog */}
    <Dialog open={showTranscription} onOpenChange={setShowTranscription}>
      <DialogContent className="max-w-3xl max-h-[85vh] bg-card border-neon-cyan/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-neon-cyan">
            <Mic className="h-5 w-5" />
            {transcriptionTitle}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Audio transcription generated by FunASR
          </DialogDescription>

          {/* Stats under title */}
          {!loadingTranscription && (
            <div className="flex items-center gap-3 pt-2">
              <Badge variant="outline" className="border-neon-cyan/30 text-xs">
                {transcriptionContent.split(/\s+/).filter(w => w.length > 0).length} words
              </Badge>
              <Badge variant="outline" className="border-neon-purple/30 text-xs">
                {transcriptionContent.length} characters
              </Badge>
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="h-[calc(85vh-220px)] pr-4">
          {loadingTranscription ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
            </div>
          ) : (
            <div className="bg-card/50 border border-border/50 rounded-lg p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {transcriptionContent}
              </p>
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(transcriptionContent);
            }}
            className="border-neon-cyan/30 hover:bg-neon-cyan/10 hover:text-neon-cyan"
          >
            <FileText className="h-3 w-3 mr-1" />
            Copy Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTranscription(false)}
            className="border-border/50"
          >
            <X className="h-3 w-3 mr-1" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}
