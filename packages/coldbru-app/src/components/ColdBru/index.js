import React from 'react';
import logoTransparent from '../../../../../assets/images/logo-transparent.png';

const Bruno = ({ width }) => {
  return (
    <img
      src={logoTransparent}
      alt="ColdBru logo"
      width={width}
      style={{ height: 'auto', display: 'block' }}
      draggable={false}
    />
  );
};

export default Bruno;
