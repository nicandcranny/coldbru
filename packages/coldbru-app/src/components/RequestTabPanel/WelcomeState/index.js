import React from 'react';
import ColdBru from 'components/ColdBru';

const WelcomeState = () => {
  return (
    <div className="flex flex-col flex-grow items-center justify-center h-full bg-slate-50/30 dark:bg-slate-900/10">
      <div className="flex flex-col items-center p-12 backdrop-blur-sm transition-all duration-500 group">
        <div className="opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 drop-shadow-sm">
          <ColdBru width={100} />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100 tracking-tight">
          Welcome to ColdBru
        </h2>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 max-w-[320px] text-center leading-relaxed">
          Create or open a workspace or collection from the sidebar to get started.
        </p>
      </div>
    </div>
  );
};

export default WelcomeState;
