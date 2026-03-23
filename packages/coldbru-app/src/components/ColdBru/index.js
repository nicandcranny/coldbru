import React from 'react';
import logo from '../../../../../assets/images/logo.svg';

const Bruno = ({ width }) => {
  return (
    <img
      src={logo}
      alt="ColdBru logo"
      width={width}
      style={{ height: 'auto', display: 'block' }}
      draggable={false}
    />
  );
};

export default Bruno;
