'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface CheckboxPanelProps {
  solutions: string[];
  onSave: (selectedIndices: number[]) => void;
  onCancel: () => void;
}

export function CheckboxPanel({
  solutions,
  onSave,
  onCancel,
}: CheckboxPanelProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleToggle = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleSave = () => {
    if (selectedIndices.length > 0) {
      onSave(selectedIndices);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="mt-3 rounded-xl border-[0.5px] border-[var(--border-tertiary)] bg-[var(--surface-card)] p-4"
    >
      <p className="text-[13px] font-medium text-[var(--text-secondary)] mb-3">
        Save from this response
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {solutions.map((solution, index) => (
          <label
            key={index}
            className="flex items-start gap-3 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={selectedIndices.includes(index)}
              onChange={() => handleToggle(index)}
              className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer accent-[var(--accent-primary)]"
            />
            <span className="text-[14px] text-[var(--text-primary)] leading-[1.5] flex-1">
              {solution}
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={selectedIndices.length === 0}
          className="px-4 py-2 rounded-lg text-[13px] font-medium bg-[var(--accent-primary)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          Save
        </button>
      </div>
    </motion.div>
  );
}
