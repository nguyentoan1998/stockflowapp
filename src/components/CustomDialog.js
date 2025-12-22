// TEMPORARY WRAPPER: CustomDialog → CustomAlert
// This allows old code to work while we migrate to new CustomAlert
// TODO: Migrate all screens to use CustomAlert directly

import React from 'react';
import CustomAlert from './CustomAlert';

const CustomDialog = ({ visible, type = 'info', title, message, onClose, confirmText = 'OK' }) => {
  // Map old CustomDialog API to new CustomAlert API
  return (
    <CustomAlert
      visible={visible}
      type={type}
      title={title}
      message={message}
      onClose={onClose}
      confirmText={confirmText}
    />
  );
};

export default CustomDialog;
