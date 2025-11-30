export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  {
    id: 'min-length',
    label: 'Mínimo 8 caracteres',
    test: (password: string) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Al menos 1 mayúscula',
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: 'special-char',
    label: 'Al menos 1 carácter especial',
    test: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  },
];

export const checkPasswordRules = (password: string) => {
  return passwordRules.map(rule => ({
    ...rule,
    valid: rule.test(password),
  }));
};

export const isPasswordValid = (password: string): boolean => {
  return passwordRules.every(rule => rule.test(password));
};
