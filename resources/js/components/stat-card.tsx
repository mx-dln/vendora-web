import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
    title: string;
    value: string | number;
    icon?: ReactNode;
    description?: string;
    trend?: { value: number; isUp: boolean };
    className?: string;
};

export function StatCard({ title, value, icon, description, trend, className }: StatCardProps) {
    return (
        <Card className={cn("", className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-sm font-medium">{title}</p>
                        <p className="text-3xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                        {description && (
                            <p className="text-muted-foreground text-xs">{description}</p>
                        )}
                        {trend && (
                            <div className={cn(
                                "flex items-center gap-1 text-xs font-medium",
                                trend.isUp ? "text-green-600" : "text-red-600"
                            )}>
                                {trend.isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                                <span>{Math.abs(trend.value)}% from last period</span>
                            </div>
                        )}
                    </div>
                    {icon && (
                        <div className="text-muted-foreground/30">{icon}</div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
