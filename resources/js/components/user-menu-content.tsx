import { Link, router } from '@inertiajs/react';
import { LogOut, Sun, Moon, Monitor, Check, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useAppearance } from '@/hooks/use-appearance';
import { logout } from '@/routes';
import type { User } from '@/types';

type Props = {
    user: User;
    onOpenSettings?: () => void;
};

export function UserMenuContent({ user, onOpenSettings }: Props) {
    const cleanup = useMobileNavigation();
    const { appearance, updateAppearance } = useAppearance();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    const themeOptions = [
        { value: 'light' as const, label: 'Light', icon: Sun },
        { value: 'dark' as const, label: 'Dark', icon: Moon },
        { value: 'system' as const, label: 'System', icon: Monitor },
    ];

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-2 py-2 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                {onOpenSettings && (
                    <DropdownMenuItem onClick={onOpenSettings} className="cursor-pointer">
                        <Settings className="size-4" />
                        Settings
                    </DropdownMenuItem>
                )}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Sun className="size-4" />
                        <span>Theme</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {themeOptions.map(({ value, label, icon: Icon }) => (
                            <DropdownMenuItem
                                key={value}
                                onClick={() => updateAppearance(value)}
                                className="cursor-pointer"
                            >
                                <Icon className="size-4" />
                                <span className="flex-1">{label}</span>
                                {appearance === value && (
                                    <Check className="size-3.5 text-primary" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild variant="destructive">
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="size-4" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
