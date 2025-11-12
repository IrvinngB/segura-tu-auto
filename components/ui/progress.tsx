'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const isComplete = (value || 0) >= 100;
  const progressValue = Math.min(Math.max(value || 0, 0), 100);
  
  if (isComplete) {
    // Al 100%, el contenedor completo es verde
    return (
      <ProgressPrimitive.Root
        data-slot="progress"
        className={cn('relative h-2 w-full rounded-full', className)}
        style={{ backgroundColor: '#22c55e' }}
        {...props}
      />
    );
  }
  
  // Para cualquier progreso menor al 100%
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn('bg-gray-200 dark:bg-gray-700 relative h-2 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full transition-all duration-300"
        style={{ 
          width: `${progressValue}%`,
          backgroundColor: '#3b82f6', // Azul directo
          borderRadius: '9999px 0 0 9999px',
          transform: 'none'
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
