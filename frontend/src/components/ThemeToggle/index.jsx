import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '@/features/theme/themeSlice';
import styles from './ThemeToggle.module.scss';
import { BsSun, BsMoon } from 'react-icons/bs';

const ThemeToggle = () => {
  const dispatch = useDispatch();
  const { isDarkMode } = useSelector((state) => state.theme);

  const handleToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <button 
      className={`${styles.themeToggle} ${isDarkMode ? styles.dark : styles.light}`}
      onClick={handleToggle}
      aria-label="Toggle theme"
    >
      {isDarkMode ? <BsSun size="16" /> : <BsMoon size="16" />}
    </button>
  );
};

export default ThemeToggle; 