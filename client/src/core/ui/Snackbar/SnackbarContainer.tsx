/**
 * SnackbarContainer Component
 *
 * Snackbar를 담는 컨테이너
 * 화면 하단 중앙에 고정
 */

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Snackbar } from './Snackbar';
import { useSnackbarStore } from './snackbar.store';

export const SnackbarContainer: React.FC = () => {
  const { snackbars, removeSnackbar } = useSnackbarStore();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {snackbars.map((snackbar) => (
          <div key={snackbar.id} className="pointer-events-auto">
            <Snackbar {...snackbar} onClose={() => removeSnackbar(snackbar.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
