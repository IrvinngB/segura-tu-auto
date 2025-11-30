import { checkPasswordRules } from '@/lib/validations/password';
import { cn } from '@/lib/utils';

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

export function PasswordRequirements({ password, className }: PasswordRequirementsProps) {
  const rules = checkPasswordRules(password);

  return (
    <div className={cn('text-xs space-y-1', className)}>
      {rules.map((rule) => (
        <div
          key={rule.id}
          className={cn(
            'flex items-center gap-2 transition-colors duration-200',
            rule.valid ? 'text-green-600' : 'text-red-600'
          )}
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full transition-colors duration-200',
              rule.valid ? 'bg-green-600' : 'bg-red-600'
            )}
          ></span>
          {rule.label}
        </div>
      ))}
    </div>
  );
}
