import React, { useState } from 'react';
import { Building2, CheckCircle2, ArrowRight, Sparkles, GraduationCap } from 'lucide-react';

export default function CollegeSelection({ onSelectCollege }) {
  const [selectedCollege, setSelectedCollege] = useState('KIET University');

  const colleges = [
    {
      id: 'kiet',
      name: 'KIET University',
      tagline: 'Ghaziabad, Delhi-NCR • Campus Dining Network',
      description: 'Central Food Court, NESCAFE, Hungry Nites, Big Treat Cafe, The Healthy Hut & more.',
      available: true
    }
  ];

  const handleContinue = () => {
    if (selectedCollege) {
      onSelectCollege && onSelectCollege(selectedCollege);
    }
  };

  return (
    <div className="min-h-[84vh] flex items-center justify-center px-4 py-10 bg-cream-100">
      <div className="w-full max-w-lg bg-white border border-oatmeal-300 rounded-3xl shadow-paper-elevated p-6 sm:p-10 transition-all">
        
        {/* Badge */}
        <div className="flex items-center justify-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-terracotta-50 border border-terracotta-200 text-terracotta-700 text-xs font-bold shadow-xs">
            <GraduationCap className="w-4 h-4 text-terracotta-600" />
            <span>Campus Dining Portal</span>
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-ink-900 tracking-tight">
            Select Your College
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-2 max-w-sm mx-auto">
            Choose your campus institution to access verified dining outlets and digital ordering.
          </p>
        </div>

        {/* Colleges List */}
        <div className="space-y-3 mb-8">
          {colleges.map((col) => {
            const isSelected = selectedCollege === col.name;
            return (
              <div
                key={col.id}
                onClick={() => setSelectedCollege(col.name)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'border-terracotta-500 bg-terracotta-50/40 shadow-paper'
                    : 'border-oatmeal-300 bg-white hover:border-oatmeal-400'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-terracotta-500 text-white' : 'bg-oatmeal-200 text-ink-600'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-ink-900">
                        {col.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-100 text-sage-800 border border-sage-300">
                        Active Campus
                      </span>
                    </div>
                    <p className="text-xs text-ink-600 mt-0.5 font-medium">
                      {col.tagline}
                    </p>
                    <p className="text-[11px] text-ink-400 mt-1 leading-relaxed">
                      {col.description}
                    </p>
                  </div>
                </div>

                <div className="mt-1">
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-terracotta-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-oatmeal-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full py-3.5 bg-terracotta-500 hover:bg-terracotta-600 active:scale-[0.99] text-white rounded-2xl font-bold text-sm shadow-paper hover:shadow-paper-elevated transition-all flex items-center justify-center gap-2"
        >
          <span>Continue with {selectedCollege}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] text-center text-ink-400 mt-4">
          More colleges and partner institutions joining soon.
        </p>

      </div>
    </div>
  );
}
