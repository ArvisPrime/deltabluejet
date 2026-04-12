export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone: string): boolean => /^\+?[\d\s\-()]{7,}$/.test(phone);

export const isValidDOB = (dob: string): boolean => {
    if (!dob) return false;
    const date = new Date(dob);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    // Must not be in the future
    if (date > today) return false;
    // Must not be > 120 years ago
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 120);
    if (date < minDate) return false;
    return true;
};
