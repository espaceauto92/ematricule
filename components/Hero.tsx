'use client'

import { FileText, Star } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'

const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Generate stable IDs for SVG gradients
  const waveGradientId = useMemo(() => `waveGradient-${Date.now()}`, [])
  const waveGradientTopId = useMemo(() => `waveGradientTop-${Date.now()}`, [])
  
  const carouselImages = [
    '/hero2.png', 
    '/hero3.png'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % carouselImages.length)
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [carouselImages.length])
  return (
    <section className="relative bg-gradient-to-br from-white via-primary-50/40 via-white to-primary-100/30 py-8 lg:py-12 overflow-hidden w-full max-w-full" style={{ zIndex: 1 }}>
      {/* Advanced Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none w-full max-w-full">
        {/* Base Gradient Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-primary-50/30 to-primary-100/20"></div>
        
        {/* Animated Gradient Orbs - Multiple Layers */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] max-w-[100vw] bg-gradient-to-br from-primary-400/35 via-primary-500/25 to-primary-600/15 rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] max-w-[100vw] bg-gradient-to-tr from-primary-300/30 via-primary-400/20 to-primary-500/15 rounded-full blur-3xl transform -translate-x-1/4 translate-y-1/4 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] max-w-[100vw] bg-gradient-to-r from-primary-200/25 via-primary-300/15 to-primary-400/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '5s' }}></div>
        <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] max-w-[100vw] bg-gradient-to-bl from-purple-300/20 via-primary-400/15 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
        
        {/* Floating Particles / Animated Dots */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary-400/40 rounded-full animate-float"
            style={{
              left: `${10 + (i * 7.5)}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + (i % 3)}s`
            }}
          ></div>
        ))}
        
        {/* Animated Geometric Shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 border-2 border-primary-200/30 rounded-3xl transform rotate-12 animate-float-delayed"></div>
        <div className="absolute top-40 right-20 w-24 h-24 border-2 border-primary-300/25 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-primary-200/15 rounded-2xl transform -rotate-12 animate-float-delayed" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-16 h-16 border-2 border-primary-300/20 rounded-lg transform rotate-45 animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/3 left-1/3 w-28 h-28 border-2 border-primary-300/20 rounded-2xl transform rotate-45 animate-float-delayed" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-18 h-18 bg-primary-300/20 rounded-full animate-float" style={{ animationDelay: '2.5s' }}></div>
        
        {/* Wave Pattern */}
        <svg className="absolute bottom-0 left-0 w-full h-64 opacity-20" preserveAspectRatio="none" viewBox="0 0 1200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={waveGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
              <stop offset="50%" stopColor="rgba(139, 92, 246, 0.1)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.1)" />
            </linearGradient>
          </defs>
          <path d="M0,60 Q300,20 600,60 T1200,60 L1200,120 L0,120 Z" fill={`url(#${waveGradientId})`} />
        </svg>
        
        {/* Top Wave Pattern */}
        <svg className="absolute top-0 left-0 w-full h-48 opacity-15" preserveAspectRatio="none" viewBox="0 0 1200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={waveGradientTopId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.08)" />
              <stop offset="50%" stopColor="rgba(139, 92, 246, 0.08)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.08)" />
            </linearGradient>
          </defs>
          <path d="M0,60 Q300,100 600,60 T1200,60 L1200,0 L0,0 Z" fill={`url(#${waveGradientTopId})`} />
        </svg>
        
        {/* Light Rays */}
        <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-transparent via-primary-300/20 to-transparent transform rotate-12 blur-sm"></div>
        <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-transparent via-primary-400/15 to-transparent transform -rotate-12 blur-sm"></div>
        <div className="absolute top-0 left-1/2 w-1 h-full bg-gradient-to-b from-transparent via-primary-200/25 to-transparent transform rotate-6 blur-sm"></div>
        
        {/* Grid Pattern Overlay with Better Opacity */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(59, 130, 246, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59, 130, 246, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '3rem 3rem'
          }}
        ></div>
        
        {/* Radial Gradient Overlay */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            background: 'radial-gradient(circle at center, transparent 0%, rgba(59, 130, 246, 0.05) 50%, rgba(59, 130, 246, 0.1) 100%)'
          }}
        ></div>
        
        {/* Advanced Shine Effect with Multiple Layers */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent transform -skew-x-12 animate-shine"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-100/5 to-transparent transform -skew-x-12 animate-shine" style={{ animationDelay: '4s', animationDuration: '10s' }}></div>
        
        {/* Glow Spots */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-primary-300/15 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '5s' }}></div>
        
        {/* Mesh Gradient Effect */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(at 20% 30%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
              radial-gradient(at 80% 70%, rgba(139, 92, 246, 0.1) 0px, transparent 50%),
              radial-gradient(at 50% 50%, rgba(59, 130, 246, 0.05) 0px, transparent 50%)
            `
          }}
        ></div>
      </div>

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div className="space-y-6 order-2 lg:order-1">
            <div className="space-y-5">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary-100/80 backdrop-blur-sm text-primary-700 px-4 py-2 rounded-full text-sm font-semibold border border-primary-200/50">
                <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></span>
                <span>Plateforme officielle depuis 2009</span>
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
                Faites votre{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-primary-600">carte grise</span>
                  <span className="absolute bottom-2 left-0 right-0 h-3 bg-primary-200/40 -z-0 transform -skew-x-12"></span>
                </span>
                {' '}et vos{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-primary-600">plaques d'immatriculation</span>
                  <span className="absolute bottom-2 left-0 right-0 h-3 bg-primary-200/40 -z-0 transform -skew-x-12"></span>
                </span>
                {' '}en quelques minutes
              </h1>
              
              <p className="text-lg lg:text-xl text-gray-600 max-w-2xl leading-relaxed">
                Nous accompagnons des milliers d'automobilistes avec une solution simple, rapide et sécurisée. Habilités par l'État Français, nous prenons en charge toutes vos démarches d'immatriculation en ligne, sans déplacement ni paperasse inutile.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/carte-grise"
                className="group relative bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 text-base font-bold rounded-3xl text-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 hover:from-primary-700 hover:to-primary-800 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <span>Commander une carte grise</span>
                  <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full group-hover:translate-x-0"></div>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              
              <Link
                href="/plaque-immatriculation"
                className="group relative bg-white text-primary-600 px-8 py-4 text-base font-bold rounded-3xl text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border-2 border-primary-200 hover:border-primary-300 hover:bg-primary-50/80 overflow-hidden backdrop-blur-sm"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <span>Commander des plaques d'immatriculation</span>
                  <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-50/0 via-primary-100/50 to-primary-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full group-hover:translate-x-0"></div>
              </Link>
            </div>
          </div>

          {/* Right side - Animated Carousel */}
          <div className="relative flex items-center justify-center order-1 lg:order-2">
            <div className="relative w-full max-w-[600px] aspect-square">
              {/* Carousel Images */}
              {carouselImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={index === 0 ? "Service de carte grise en ligne rapide et sécurisé" : "Plaques d'immatriculation homologuées en plexiglass"}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    index === currentImageIndex 
                      ? 'opacity-100 z-10' 
                      : 'opacity-0 z-0'
                  }`}
                />
              ))}

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
