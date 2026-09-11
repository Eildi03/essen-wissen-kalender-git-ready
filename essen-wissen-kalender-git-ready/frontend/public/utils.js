// public/utils.js
export const esc = (value) =>
  String(value ?? '').replace(/[&<>'"]/g, (c) =>
    ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    })[c],
  );