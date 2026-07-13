import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import AppLogoIcon from '@/components/app-logo-icon';

type AppLogoProps = {
    className?: string;
};

export default function AppLogo({ className }: AppLogoProps) {
    const { resolvedAppearance } = useAppearance();

    const logoSrc = resolvedAppearance === 'dark' ? '/brand/logo-dark.png' : '/brand/logo-light.png';

    return (
        <div className={cn('flex w-full items-center justify-center', className)}>
            <img
                src={logoSrc}
                alt="Vendora"
                className="h-auto w-full max-w-[180px] object-contain"
            />
        </div>
    );
}
