import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileCardProps {
  className?: string;
  imageSrc: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ className = "", imageSrc }) => {
  const [isVisible] = useState(true);
  const [isMinimized] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!isVisible) return null;

  return (
    <>
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              rotate: isHovered ? [0, -2, 2, -2, 2, 0] : 0,
              y: isHovered ? -8 : 0,
            }}
            exit={{ 
              opacity: 0,
              scale: 0.8,
              transition: { duration: 0.3 }
            }}
            transition={{ 
              scale: { type: "spring", damping: 20, stiffness: 200 },
              rotate: { duration: 0.6, ease: "easeInOut" },
              y: { type: "spring", damping: 15, stiffness: 300 },
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className={`${className} transition-all duration-300 z-[60]`}
          >
            <div className="relative transition-all duration-300">
              <motion.div 
                className="bg-[#ffffff] dark:bg-[#2A3D36] rounded-lg shadow-2xl overflow-hidden group relative z-[60]"
                animate={{
                  boxShadow: isHovered
                    ? '0 25px 50px -12px rgba(232, 122, 48, 0.25)' 
                    : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div 
                  className="bg-[#F5F0E6] dark:bg-[#1F2B26] px-3 py-2.5 flex items-center justify-between border-b border-[#D3C6AB] dark:border-[#E87A30]/20 transition-colors duration-300 relative z-[61]"
                >
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-full bg-[#ff5f56] transition-all z-[62]"
                      aria-label="Close"
                    />
                    
                    <div 
                      className="w-3 h-3 rounded-full bg-[#ffbd2e] transition-all z-[62]"
                      aria-label="Minimize"
                    />

                    <div 
                      className="w-3 h-3 rounded-full bg-[#27c93f] transition-all z-[62]"
                      aria-label="Maximize"
                    />
                  </div>
                  <div className="text-stone-800 dark:text-[#FDECBF] text-xs font-mono opacity-80 transition-colors duration-300 select-none flex-1 text-center">
                    raj.exe
                  </div>
                  <div className="w-[72px]"></div>
                </div>

                <div className="relative overflow-hidden bg-white dark:bg-[#2A3D36]">
                  <img
                    src={imageSrc}
                    alt="Raj Rathod"
                    className="w-full h-auto object-cover block" 
                  />
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-tr from-[#E87A30]/10 to-transparent"
                    animate={{
                      opacity: isHovered ? 0.5 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute inset-0 bg-[#E87A30]/10 rounded-lg blur-xl -z-10 pointer-events-none"
                animate={{
                  scale: isHovered ? 1.2 : 1.1,
                  opacity: isHovered ? 0.4 : 0.1,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProfileCard;
