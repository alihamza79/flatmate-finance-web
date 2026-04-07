export function showToast(message: string): void {
  if (typeof window !== 'undefined') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #334155; color: #f1f5f9; padding: 12px 24px; border-radius: 12px;
      font-size: 14px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: opacity 0.3s;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
}

export function showError(message: string): void {
  if (typeof window !== 'undefined') {
    alert(message);
  }
}
