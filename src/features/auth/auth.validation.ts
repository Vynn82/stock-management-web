export interface PasswordRequirements {
  isLongEnough: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  passwordsMatch: boolean;
  isValid: boolean;
}

export function checkPasswordStrength(
  password: string,
  confirmPassword: string,
): PasswordRequirements {
  const isLongEnough = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  return {
    isLongEnough,
    hasUppercase,
    hasNumber,
    passwordsMatch,
    isValid: isLongEnough && hasUppercase && hasNumber && passwordsMatch,
  };
}
