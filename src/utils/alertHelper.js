// Helper functions để dùng CustomAlert như Alert.alert
// Import CustomAlert vào component và dùng state để control

export const createAlertHelper = (setAlertConfig) => {
  return {
    success: (title, message, onClose) => {
      setAlertConfig({
        visible: true,
        type: 'success',
        title,
        message,
        onClose: () => {
          setAlertConfig({ visible: false });
          onClose?.();
        },
      });
    },

    error: (title, message, onClose) => {
      setAlertConfig({
        visible: true,
        type: 'error',
        title,
        message,
        onClose: () => {
          setAlertConfig({ visible: false });
          onClose?.();
        },
      });
    },

    warning: (title, message, onClose) => {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title,
        message,
        onClose: () => {
          setAlertConfig({ visible: false });
          onClose?.();
        },
      });
    },

    info: (title, message, onClose) => {
      setAlertConfig({
        visible: true,
        type: 'info',
        title,
        message,
        onClose: () => {
          setAlertConfig({ visible: false });
          onClose?.();
        },
      });
    },

    confirm: (title, message, onConfirm, onCancel, confirmText = 'Xác nhận', cancelText = 'Hủy') => {
      setAlertConfig({
        visible: true,
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => {
          // Close dialog FIRST, then run async callback
          setAlertConfig({ visible: false });
          setTimeout(() => {
            onConfirm?.();
          }, 100);
        },
        onClose: () => {
          setAlertConfig({ visible: false });
          onCancel?.();
        },
      });
    },
  };
};

// Example usage:
/*
import CustomAlert from './components/CustomAlert';
import { createAlertHelper } from './utils/alertHelper';

const MyComponent = () => {
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  const handleSave = () => {
    // Success
    Alert.success('Thành công', 'Đã lưu dữ liệu');
    
    // Error
    Alert.error('Lỗi', 'Không thể lưu dữ liệu');
    
    // Confirm
    Alert.confirm(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa?',
      () => {},
      () => {},
      'Xóa',
      'Hủy'
    );
  };

  return (
    <>
      <CustomAlert {...alertConfig} />
      {/* Your component UI *\/}
    </>
  );
};
*/
