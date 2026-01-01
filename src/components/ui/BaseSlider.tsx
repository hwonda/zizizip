'use client';

import { Slider as MUISlider, SliderProps } from '@mui/material';
import styles from '@/styles/slider.module.css';

const BaseSlider = (props: SliderProps) => {
  return <MUISlider className={styles.customMuiSlider} {...props} />;
};

export default BaseSlider;

