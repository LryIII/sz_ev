import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  titleRight?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', titleRight }) => {
  return (
    <div className={`relative bg-tech-panel/80 border border-tech-cyan/20 backdrop-blur-md flex flex-col overflow-hidden ${className}`}>
      {/* Sci-fi decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-tech-cyanGlow"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-tech-cyanGlow"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-tech-cyanGlow"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-tech-cyanGlow"></div>

      <div className="flex items-center justify-between px-4 py-3 border-b border-tech-cyan/10 bg-tech-bg/50">
        <h3 className="text-tech-cyan font-bold tracking-wider uppercase text-sm flex items-center gap-2">
          <span className="w-1 h-4 bg-tech-orange inline-block"></span>
          {title}
        </h3>
        {titleRight && <div className="text-xs">{titleRight}</div>}
      </div>
      
      <div className="flex-1 p-4 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};