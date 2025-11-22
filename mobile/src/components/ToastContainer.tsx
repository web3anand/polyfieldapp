import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Toast, { ToastConfig } from './Toast';

interface ToastContainerProps {
  toasts: ToastConfig[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          {...toast}
          index={index}
          onDismiss={onRemove}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});

export default ToastContainer;
