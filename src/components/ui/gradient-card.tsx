"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

interface GradientCardProps {
  children: React.ReactNode;
  className?: string;
  glowColorRight?: string;
  glowColorLeft?: string;
  glowColorCenter?: string;
  onClick?: () => void;
}

export const GradientCard = ({
  children,
  className = "",
  glowColorRight = "rgba(172, 92, 255, 0.4)",
  glowColorLeft = "rgba(56, 189, 248, 0.4)",
  glowColorCenter = "rgba(161, 58, 229, 0.3)",
  onClick,
}: GradientCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Subtle rotation limit (4 degrees max) for premium look
      const rotateX = -(y / rect.height) * 4;
      const rotateY = (x / rect.width) * 4;

      setRotation({ x: rotateX, y: rotateY });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      className={`relative rounded-2xl overflow-hidden border border-border/40 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      style={{
        transformStyle: "preserve-3d",
        backgroundColor: "transparent",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.3)",
      }}
      animate={{
        y: isHovered ? -3 : 0,
        rotateX: rotation.x,
        rotateY: rotation.y,
        perspective: 1000,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Subtle glass reflection overlay */}
      <motion.div
        className="absolute inset-0 z-[5] pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.03) 100%)",
        }}
        animate={{
          opacity: isHovered ? 0.75 : 0.45,
          rotateX: -rotation.x * 0.2,
          rotateY: -rotation.y * 0.2,
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut",
        }}
      />

      {/* Dark gradient base background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(15, 16, 22, 0.85) 0%, rgba(8, 9, 13, 0.88) 100%)",
        }}
      />

      {/* Fractal noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-overlay z-[1] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Soft smudge overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-soft-light z-[2] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='smudge'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='3' seed='5' stitchTiles='stitch'/%3E%3CfeGaussianBlur stdDeviation='10'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23smudge)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Interactive side-gradients */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-2/3 z-[3] pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at bottom right, ${glowColorRight} -10%, rgba(79, 70, 229, 0) 70%),
            radial-gradient(ellipse at bottom left, ${glowColorLeft} -10%, rgba(79, 70, 229, 0) 70%)
          `,
          filter: "blur(25px)",
        }}
        animate={{
          opacity: isHovered ? 0.9 : 0.75,
          y: isHovered ? rotation.x * 0.5 : 0,
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut",
        }}
      />

      {/* Interactive center-gradient */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-2/3 z-[4] pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at bottom center, ${glowColorCenter} -20%, rgba(79, 70, 229, 0) 60%)
          `,
          filter: "blur(30px)",
        }}
        animate={{
          opacity: isHovered ? 0.85 : 0.7,
          y: isHovered ? `calc(10% + ${rotation.x * 0.3}px)` : "10%",
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut",
        }}
      />

      {/* Bottom glowing line overlay */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[1.5px] z-[6]"
        style={{
          background:
            "linear-gradient(90deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0.02) 100%)",
        }}
        animate={{
          boxShadow: isHovered
            ? `0 0 15px 3px ${glowColorCenter}, 0 0 25px 5px ${glowColorRight}`
            : `0 0 10px 1px ${glowColorCenter}`,
          opacity: isHovered ? 1 : 0.7,
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut",
        }}
      />

      {/* Main card contents */}
      <div className="relative z-10 h-full p-4.5">
        {children}
      </div>
    </motion.div>
  );
};
