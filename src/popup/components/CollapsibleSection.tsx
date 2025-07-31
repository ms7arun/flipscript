import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`border border-neutral-200 dark:border-neutral-700 rounded-lg ${className}`}>
      <button
        type="button"
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors rounded-t-lg"
        aria-expanded={isExpanded}
        aria-controls={`collapsible-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronDown size={16} className="text-neutral-400 transition-transform" />
          ) : (
            <ChevronRight size={16} className="text-neutral-400 transition-transform" />
          )}
        </div>
      </button>
      
      <div
        id={`collapsible-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className={`overflow-visible transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 pt-0 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection; 