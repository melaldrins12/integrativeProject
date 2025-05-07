<template>
  <div v-if="modelValue" class="confirmation-dialog-overlay" @click.self="handleCancel">
    <div class="confirmation-dialog" :class="{ 'dialog-enter': modelValue }">
      <div class="dialog-icon">
        <span class="icon">{{ icon }}</span>
      </div>
      <h3>{{ title }}</h3>
      <p class="dialog-message">{{ message }}</p>
      <div v-if="duration" class="duration-display">
        <span class="duration-value">{{ duration }}</span>
      </div>
      <div class="confirmation-buttons">
        <button @click="handleConfirm" class="confirm-button">
          <span class="button-icon">{{ confirmIcon }}</span>
          {{ confirmText }}
        </button>
        <button @click="handleCancel" class="cancel-button">
          <span class="button-icon">{{ cancelIcon }}</span>
          {{ cancelText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmationDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    title: {
      type: String,
      default: 'Confirm Action'
    },
    message: {
      type: String,
      default: 'Are you sure you want to proceed?'
    },
    duration: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: '⏱️'
    },
    confirmText: {
      type: String,
      default: 'Confirm'
    },
    cancelText: {
      type: String,
      default: 'Cancel'
    },
    confirmIcon: {
      type: String,
      default: '✓'
    },
    cancelIcon: {
      type: String,
      default: '✕'
    }
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  methods: {
    handleConfirm() {
      this.$emit('confirm');
      this.$emit('update:modelValue', false);
    },
    handleCancel() {
      this.$emit('cancel');
      this.$emit('update:modelValue', false);
    }
  }
};
</script>

<style scoped>
.confirmation-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-out;
  padding: 20px;
}

.confirmation-dialog {
  background: white;
  padding: clamp(20px, 5vw, 30px);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: min(90%, 400px);
  text-align: center;
  transform: scale(0.9);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  z-index: 10000;
}

.dialog-enter {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

:deep(.dark-mode) .confirmation-dialog {
  background: #2d3748;
  color: #e2e8f0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.dialog-icon {
  margin-bottom: clamp(15px, 3vw, 20px);
}

.dialog-icon .icon {
  font-size: clamp(36px, 8vw, 48px);
  display: inline-block;
  animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.confirmation-dialog h3 {
  margin: 0 0 clamp(10px, 2vw, 15px);
  font-size: clamp(20px, 4vw, 24px);
  font-weight: 600;
  color: #2d3748;
  letter-spacing: -0.5px;
}

:deep(.dark-mode) .confirmation-dialog h3 {
  color: #e2e8f0;
}

.dialog-message {
  margin: clamp(8px, 2vw, 10px) 0;
  color: #4a5568;
  font-size: clamp(14px, 3vw, 16px);
  line-height: 1.5;
}

:deep(.dark-mode) .dialog-message {
  color: #a0aec0;
}

.duration-display {
  margin: clamp(20px, 4vw, 25px) 0;
  padding: clamp(12px, 3vw, 15px);
  background: rgba(66, 153, 225, 0.1);
  border-radius: 12px;
  display: inline-block;
}

.duration-value {
  font-size: clamp(24px, 6vw, 32px);
  font-weight: 700;
  color: #4299e1;
  font-family: 'Lato', monospace;
  letter-spacing: 2px;
}

:deep(.dark-mode) .duration-value {
  color: #63b3ed;
}

.confirmation-buttons {
  display: flex;
  gap: clamp(10px, 2vw, 15px);
  justify-content: center;
  margin-top: clamp(20px, 4vw, 25px);
  flex-wrap: wrap;
}

.confirm-button,
.cancel-button {
  padding: clamp(10px, 2vw, 12px) clamp(20px, 4vw, 24px);
  border: none;
  border-radius: 10px;
  font-size: clamp(14px, 3vw, 16px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: min(140px, 100%);
  justify-content: center;
  white-space: nowrap;
}

.confirm-button {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.confirm-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(66, 153, 225, 0.4);
}

.cancel-button {
  background: #e2e8f0;
  color: #4a5568;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.dark-mode) .cancel-button {
  background: #4a5568;
  color: #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.cancel-button:hover {
  transform: translateY(-2px);
  background: #cbd5e0;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}

:deep(.dark-mode) .cancel-button:hover {
  background: #2d3748;
}

.button-icon {
  font-size: clamp(16px, 3vw, 18px);
  line-height: 1;
}

/* Mobile-specific styles */
@media (max-width: 480px) {
  .confirmation-dialog {
    width: 95%;
    padding: 20px 15px;
  }

  .confirmation-buttons {
    flex-direction: column;
  }

  .confirm-button,
  .cancel-button {
    width: 100%;
  }
}

/* Tablet-specific styles */
@media (min-width: 481px) and (max-width: 768px) {
  .confirmation-dialog {
    width: 85%;
  }
}

/* Animation keyframes */
@keyframes fadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(4px);
  }
}

@keyframes bounceIn {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}
</style> 