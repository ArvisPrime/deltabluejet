import React from 'react';

interface WizardStepperProps {
    steps: string[];
    currentStep: number;
}

const WizardStepper: React.FC<WizardStepperProps> = ({ steps, currentStep }) => {
    return (
        <div className="flex items-center gap-2">
            {steps.map((label, i) => {
                const stepNum = i + 1;
                const isActive = stepNum === currentStep;
                const isComplete = stepNum < currentStep;
                return (
                    <React.Fragment key={label}>
                        <div className="flex items-center gap-2">
                            <div
                                className={`size-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${isComplete
                                        ? 'bg-emerald-500 text-white'
                                        : isActive
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'bg-navy-100 text-navy-400'
                                    }`}
                            >
                                {isComplete ? (
                                    <span className="material-symbols-outlined text-sm">check</span>
                                ) : (
                                    stepNum
                                )}
                            </div>
                            <span
                                className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${isActive ? 'text-navy-950' : isComplete ? 'text-emerald-600' : 'text-navy-300'
                                    }`}
                            >
                                {label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                className={`flex-1 h-0.5 rounded-full min-w-[24px] ${isComplete ? 'bg-emerald-300' : 'bg-navy-100'
                                    }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default WizardStepper;
