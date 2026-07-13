import { Link } from '@inertiajs/react';
import { PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateProps = {
    title?: string;
    description?: string;
    action?: { label: string; href: string };
};

export function EmptyState({
    title = 'No data found',
    description = 'Get started by creating your first entry.',
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <PackageOpen className="text-muted-foreground/40 size-16 mb-4" />
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-muted-foreground mt-1 mb-6 max-w-sm text-sm">{description}</p>
            {action && (
                <Button asChild>
                    <Link href={action.href}>{action.label}</Link>
                </Button>
            )}
        </div>
    );
}
