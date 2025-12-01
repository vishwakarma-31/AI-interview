/**
 * @typedef {Object} ToastContextType
 * @property {function(string, ('success'|'error'|'warning'|'info'), number): void} addToast
 * @property {function(number): void} removeToast
 */

/** @type {import('react').ComponentType<{ children: import('react').ReactNode }>} */
const ToastProvider = /** @type {any} */ {};

/** @returns {ToastContextType} */
const useToast = () => /** @type {any} */ ({});

export { ToastProvider, useToast };
