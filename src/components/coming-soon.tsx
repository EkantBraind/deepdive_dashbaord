import { Construction } from 'lucide-react'

interface ComingSoonProps {
  title: string
  description?: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <Construction className="size-8 text-muted-foreground" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground max-w-md">
          {description || 'This feature is currently under development. Check back soon!'}
        </p>
      </div>
    </div>
  )
}
