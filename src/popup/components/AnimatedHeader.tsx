import { useState, useEffect } from 'react';

interface WordPair {
  mad: string;
  professional: string;
}

const AnimatedHeader: React.FC = () => {
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const wordPairs: WordPair[] = [
    { mad: 'Fool', professional: 'Individual' },
    { mad: 'Dumb', professional: 'Uninformed' },
    { mad: 'Crap', professional: 'Unrefined' },
    { mad: 'Trash', professional: 'Redundant' },
    { mad: 'Lazy', professional: 'Underutilized' },
    { mad: 'Useless', professional: 'Needs Support' },
    { mad: 'Horrible', professional: 'Challenging' },
    { mad: 'Stupid', professional: 'Misguided' },
    { mad: 'Weird', professional: 'Unconventional' },
    { mad: 'Insane', professional: 'Unusual' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentPairIndex((prev) => (prev + 1) % wordPairs.length);
        setIsTransitioning(false);
      }, 300); // Transition duration
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const currentPair = wordPairs[currentPairIndex];

  return (
    <div 
      id="animated-header"
      className="py-3 px-4 bg-blue-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg border border-blue-200 dark:border-slate-600/40 shadow-sm"
    >
      <h1 className="text-xl font-bold mb-2 text-slate-700 dark:text-slate-300 text-left">
        flipscript.
      </h1>
      
      <div className={`text-left transition-opacity duration-300 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="font-bold text-red-600 dark:text-red-400">
            {currentPair.mad} {' '}
          </span>
            Did you mean{' '}
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {currentPair.professional}
          </span>
          ?
        </span>
      </div>
    </div>
  );
};

export default AnimatedHeader; 