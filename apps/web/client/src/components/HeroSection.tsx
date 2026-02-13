/**
 * Cyberpunk Lab - Hero Section
 * 
 * Features: Animated background with neon accents, project overview
 * Design: Full-width hero with generated cyberpunk imagery
 */

import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Brain } from "lucide-react";

export default function HeroSection() {
  return (
    <div className="relative h-64 overflow-hidden rounded-lg border border-border/50 mb-6">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://private-us-east-1.manuscdn.com/sessionFile/E5kZLvn0ZX2tiR2Gu5TkGV/sandbox/xCaJ8YSjBMejzEZDLSaSNI-img-1_1770949891000_na1fn_aGVyby1iYWNrZ3JvdW5k.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRTVrWkx2bjBaWDJ0aVIyR3U1VGtHVi9zYW5kYm94L3hDYUo4WVNqQk1lanpFWkRMU2FTTkktaW1nLTFfMTc3MDk0OTg5MTAwMF9uYTFmbl9hR1Z5YnkxaVlXTnJaM0p2ZFc1ay5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=SkOhudmwvwTKThvq71dG0X6a-8dDtnB-IHGLt4kTY0i9Jm8XF9dcnYZpStQKccf1fpl-M48EoZVj2p0R4~HNnSteMUPVoRr4OKhzaU6IKvyIBiWril2izkOCo0d9Jiiatslzhs8b6wJWXJoPeKM5fsN0mahnWjiIEt9YC~7Y7bKWK1HXrIieX3Dl7CazBG4PXNgkaPWoPUPA4ZZFcUDrHAcMqZm6CkJiBMYj8O7tPKu-NPs5lILJGA6qMzAQ1agHIkIDnOtImCmXF2gyaToD7ZlD-s3PAja0h2orhH3Z7eVEiqWznHxm69WtB10IQRRWD6Tf2GbQkf4mJwAuZFS-Bw__')`
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-center px-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-6 w-6 text-neon-cyan" />
          <h1 className="text-3xl font-bold orbitron tracking-wider">
            MAVIN <span className="text-neon-cyan">AI</span>BOOK
          </h1>
        </div>
        
        <p className="text-lg text-foreground/80 mb-4 max-w-xl">
          Your Digital Companion for Learning, Creating, and Building
        </p>
        
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm border border-neon-cyan/30 rounded-lg">
            <Brain className="h-4 w-4 text-neon-cyan" />
            <span className="text-sm">AI-Powered</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm border border-neon-purple/30 rounded-lg">
            <Zap className="h-4 w-4 text-neon-purple" />
            <span className="text-sm">Real-Time Capture</span>
          </div>
        </div>
      </div>
    </div>
  );
}
