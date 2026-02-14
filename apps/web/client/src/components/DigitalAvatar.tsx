/**
 * Cyberpunk Lab - Digital Avatar Component
 *
 * Features: Animated 2D avatar with multiple states (idle, speaking, thinking, listening)
 * Design: Neon purple border, glow effects, smooth transitions
 */

import { useEffect, useState } from "react";
import { Mic, Volume2 } from "lucide-react";
import { Button } from "./ui/button";
import VoiceVisualizer from "./VoiceVisualizer";
import { avatarApi } from "../services/avatarApi";

type AvatarState = "idle" | "speaking" | "thinking" | "listening";

interface DigitalAvatarProps {
  state?: AvatarState;
  onVoiceClick?: () => void;
}

// Default fallback images (CDN URLs)
const DEFAULT_AVATAR_IMAGES = {
  idle: "https://private-us-east-1.manuscdn.com/sessionFile/E5kZLvn0ZX2tiR2Gu5TkGV/sandbox/dXjEv5XREpXmuggh8ykBch_1770950902789_na1fn_bWFydmluLWF2YXRhci1uZXV0cmFs.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRTVrWkx2bjBaWDJ0aVIyR3U1VGtHVi9zYW5kYm94L2RYakV2NVhSRXBYbXVnZ2g4eWtCY2hfMTc3MDk1MDkwMjc4OV9uYTFmbl9iV0Z5ZG1sdUxXRjJZWFJoY2kxdVpYVjBjbUZzLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=nDIzgATcCse-MyqevvQA0nolksa06RrbSUK4xt8Xt50RDPYV0AvtAxClDR0BhvAmJCEqUKvu7ksUlFXxwT2D2H15AduxFb48SgB4jm1KJwyjGRDmUr1O6s88U-R13VBknGw2qAK0F6CTMelJ6HQNcGAjHahcqYCrmhi-I2dT1tBslcCydbCXpSckGQbnQlBYE1o95FK9XFWgheCWViHdWwUKTM5j8EdMmhL4KFiUB13udmTMzQ4gQGZN6E6qsymjTfgZYziv0sVIy8GMbwuxUix4IOELmSRne7~PCJZb6yS4AK0~6orin1p3sCcHRf6L--tF-bQRmC2hyjbl5~altg__",
  speaking: "https://private-us-east-1.manuscdn.com/sessionFile/E5kZLvn0ZX2tiR2Gu5TkGV/sandbox/dXjEv5XREpXmuggh8ykBch_1770950902790_na1fn_bWFydmluLWF2YXRhci1zcGVha2luZw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRTVrWkx2bjBaWDJ0aVIyR3U1VGtHVi9zYW5kYm94L2RYakV2NVhSRXBYbXVnZ2g4eWtCY2hfMTc3MDk1MDkwMjc5MF9uYTFmbl9iV0Z5ZG1sdUxXRjJZWFJoY2kxemNHVmhhMmx1WncucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=V-IJpOV2tQca1mGZXSvMlMAv3v7KkTk7x7gMI5jfB00DjGa4v5wdizCbDBDdljELhCn7WTPcoq8jWibScowrO3tHJkj79vfRBWDJ6O3VMuxB9Ofjywk6sWUrja5Jh93b-IWFi5f5DKEMj~yykdBLlPMb-~FT~QLBYc4d~RqADGFf2OdvUg60CddZYeixQEXV~rgl-paER4zff0ZgsuEa2QVOwmAKPy~R~~i9V34Hj8O~Xtw~TjVrOz3gwNiAONnRUcjOp64PluE-W6gkl2UaIF7gXr7w-Ca-xvyiRjh3KFWRi8tB0VyIPt~QBQ48oRGvsBcq0c2k~GGRESLXvQpvLw__",
  thinking: "https://private-us-east-1.manuscdn.com/sessionFile/E5kZLvn0ZX2tiR2Gu5TkGV/sandbox/dXjEv5XREpXmuggh8ykBch_1770950902790_na1fn_bWFydmluLWF2YXRhci10aGlua2luZw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRTVrWkx2bjBaWDJ0aVIyR3U1VGtHVi9zYW5kYm94L2RYakV2NVhSRXBYbXVnZ2g4eWtCY2hfMTc3MDk1MDkwMjc5MF9uYTFmbl9iV0Z5ZG1sdUxXRjJZWFJoY2kxMGFHbHVhMmx1WncucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=rz8sbm2apGxPyFPABvljv7eg8h-8vxyk-FWxmOKWBXtpvPfDnN4bBLyO39-wbQTJVdKhumxM~-bMJvpAQS5VGP9MbfBhSG-6mZy07-T~ym6Wq9jWBMhRrzmfor7WzaROcd4jF56ExQfD02nkKHmKBRq~EnYuamUa9H661bzAkLJI747PLG46twiltfHPrEkIgqfrbsBr5o7L6gWJ3UV~e7ulE1tEg0x7bnBQWnNtry3jH22uJStfn70sOu3zQWiboK3KY32bkVx-eglbUJDNCqL4fXTGdXE-32yfsiidvsaM97709atBApdx9VVHmt~JSsdOIOpZGlvP0Er-0C5oOA__",
  listening: "https://private-us-east-1.manuscdn.com/sessionFile/E5kZLvn0ZX2tiR2Gu5TkGV/sandbox/dXjEv5XREpXmuggh8ykBch_1770950902789_na1fn_bWFydmluLWF2YXRhci1uZXV0cmFs.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRTVrWkx2bjBaWDJ0aVIyR3U1VGtHVi9zYW5kYm94L2RYakV2NVhSRXBYbXVnZ2g4eWtCY2hfMTc3MDk1MDkwMjc4OV9uYTFmbl9iV0Z5ZG1sdUxXRjJZWFJoY2kxdVpYVjBjbUZzLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=nDIzgATcCse-MyqevvQA0nolksa06RrbSUK4xt8Xt50RDPYV0AvtAxClDR0BhvAmJCEqUKvu7ksUlFXxwT2D2H15AduxFb48SgB4jm1KJwyjGRDmUr1O6s88U-R13VBknGw2qAK0F6CTMelJ6HQNcGAjHahcqYCrmhi-I2dT1tBslcCydbCXpSckGQbnQlBYE1o95FK9XFWgheCWViHdWwUKTM5j8EdMmhL4KFiUB13udmTMzQ4gQGZN6E6qsymjTfgZYziv0sVIy8GMbwuxUix4IOELmSRne7~PCJZb6yS4AK0~6orin1p3sCcHRf6L--tF-bQRmC2hyjbl5~altg__"
};

const stateConfig = {
  idle: {
    label: "Ready",
    color: "text-neon-cyan",
    glowClass: "glow-cyan",
    description: "Waiting for your input"
  },
  speaking: {
    label: "Speaking",
    color: "text-neon-purple",
    glowClass: "glow-purple",
    description: "Mavin is responding"
  },
  thinking: {
    label: "Thinking",
    color: "text-neon-cyan",
    glowClass: "glow-cyan",
    description: "Processing your request"
  },
  listening: {
    label: "Listening",
    color: "text-neon-orange",
    glowClass: "glow-orange",
    description: "Listening to your voice"
  }
};

export default function DigitalAvatar({ state = "idle", onVoiceClick }: DigitalAvatarProps) {
  const [avatarImages, setAvatarImages] = useState(DEFAULT_AVATAR_IMAGES);
  const [currentImage, setCurrentImage] = useState(avatarImages[state]);
  const [isAnimating, setIsAnimating] = useState(false);
  const config = stateConfig[state];

  // Fetch custom avatar images on mount
  useEffect(() => {
    const loadAvatarImages = async () => {
      try {
        const customAvatars = await avatarApi.getCurrentAvatars();

        // Merge custom avatars with defaults (use custom if available, otherwise default)
        setAvatarImages({
          idle: customAvatars.idle || DEFAULT_AVATAR_IMAGES.idle,
          speaking: customAvatars.speaking || DEFAULT_AVATAR_IMAGES.speaking,
          thinking: customAvatars.thinking || DEFAULT_AVATAR_IMAGES.thinking,
          listening: customAvatars.listening || DEFAULT_AVATAR_IMAGES.listening,
        });
      } catch (error) {
        console.error('Failed to load custom avatar images:', error);
        // Keep using defaults on error
      }
    };

    loadAvatarImages();

    // Listen for avatar settings changes
    const handleSettingsChanged = () => {
      console.log('Avatar settings changed, reloading images...');
      loadAvatarImages();
    };

    window.addEventListener('avatarSettingsChanged', handleSettingsChanged);

    return () => {
      window.removeEventListener('avatarSettingsChanged', handleSettingsChanged);
    };
  }, []);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setCurrentImage(avatarImages[state]);
      setIsAnimating(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [state, avatarImages]);

  return (
    <div className="relative">
      {/* Avatar Container */}
      <div className={`relative rounded-2xl overflow-hidden border-2 ${config.glowClass} transition-all duration-500 ${
        state === "idle" ? "breathe" : ""
      } ${
        state === "listening" ? "ripple-effect" : ""
      }`}
        style={{
          borderColor: state === "idle" ? "var(--neon-cyan)" : 
                       state === "speaking" ? "var(--neon-purple)" :
                       state === "thinking" ? "var(--neon-cyan)" : "var(--neon-orange)"
        }}
      >
        {/* Scan Line Effect */}
        <div className="absolute inset-0 scan-line pointer-events-none z-10" />
        
        {/* Avatar Image */}
        <div className={`relative aspect-[3/4] bg-card/30 transition-opacity duration-300 ${isAnimating ? "opacity-50" : "opacity-100"}`}>
          <img
            src={currentImage}
            alt="Mavin Avatar"
            className="w-full h-full object-cover"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
        </div>

        {/* State Indicator */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
            
            {/* Voice Button */}
            <Button
              size="icon"
              className={`rounded-full ${
                state === "listening" 
                  ? "bg-neon-orange hover:bg-neon-orange/80 pulse-recording" 
                  : "bg-neon-purple/20 hover:bg-neon-purple/30 border border-neon-purple/50"
              }`}
              onClick={onVoiceClick}
            >
              {state === "listening" ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Audio Waveform (when speaking) */}
      {state === "speaking" && (
        <div className="mt-3 h-12 bg-card/30 rounded-lg border border-neon-purple/30 overflow-hidden">
          <VoiceVisualizer isActive={true} color="purple" />
        </div>
      )}
      
      {/* Listening Waveform */}
      {state === "listening" && (
        <div className="mt-3 h-12 bg-card/30 rounded-lg border border-neon-orange/30 overflow-hidden">
          <VoiceVisualizer isActive={true} color="orange" />
        </div>
      )}

      {/* Thinking Indicator */}
      {state === "thinking" && (
        <div className="mt-3 flex items-center justify-center gap-2 p-3 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <span className="text-xs text-neon-cyan">Analyzing your request...</span>
        </div>
      )}
    </div>
  );
}
