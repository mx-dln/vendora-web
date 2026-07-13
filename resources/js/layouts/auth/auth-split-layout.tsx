import { Link, usePage } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative grid min-h-dvh flex-col items-center justify-center px-4 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            {/* Left panel — background image */}
            <div className="relative hidden h-full min-h-dvh flex-col bg-muted lg:flex">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/assets/backgrounds/login.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="relative z-10 mt-auto p-10 text-white">
                    <p className="text-2xl font-semibold tracking-tight">Vendora POS</p>
                    <p className="mt-2 text-sm text-white/70 max-w-md">
                        Complete retail management system — point of sale, inventory, purchasing, reporting, and AI-powered business insights.
                    </p>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex w-full items-center justify-center p-4 lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
                    <div className="flex flex-col items-center gap-4">
                        <Link href={home()}>
                            <img src="/brand/logo-dark.png" alt="Vendora" className="h-[84px] w-auto" />
                        </Link>
                        <div className="space-y-1 text-center">
                            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
