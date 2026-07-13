import { useState } from 'react';
import { Form, Head, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Shield, UserCircle, Briefcase, ShoppingBag } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

function getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

const demoAccounts = [
    { email: 'owner@vendora.test', label: 'Owner', icon: Shield, desc: 'Full access' },
    { email: 'manager@vendora.test', label: 'Manager', icon: Briefcase, desc: 'Operations' },
    { email: 'cashier@vendora.test', label: 'Cashier', icon: ShoppingBag, desc: 'POS only' },
];

export default function Login({ status, canResetPassword }: Props) {
    const { app_env } = usePage().props as { app_env?: string };
    const isLocal = app_env === 'local';
    const [quickLogging, setQuickLogging] = useState<string | null>(null);

    async function quickLogin(email: string) {
        setQuickLogging(email);
        try {
            const res = await fetch('/auth/quick-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                window.location.href = '/dashboard';
            } else {
                toast.error('Quick login failed');
            }
        } catch {
            toast.error('Quick login failed');
        }
        setQuickLogging(null);
    }

    return (
        <>
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot your password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox id="remember" name="remember" tabIndex={3} />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing} data-test="login-button">
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>


                    </>
                )}
            </Form>

            {isLocal && (
                <div className="mt-6 pt-6 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-3">Quick Sign In (Development)</p>
                    <div className="grid gap-2">
                        {demoAccounts.map(({ email, label, icon: Icon, desc }) => (
                            <button
                                key={email}
                                onClick={() => quickLogin(email)}
                                disabled={quickLogging === email}
                                className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5 text-left text-sm hover:bg-muted/50 hover:border-foreground/20 transition-all disabled:opacity-50"
                            >
                                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                                    <Icon className="size-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium">{label}</p>
                                    <p className="text-xs text-muted-foreground">{email} · {desc}</p>
                                </div>
                                <span className="text-xs font-medium text-primary shrink-0">
                                    {quickLogging === email ? 'Signing in...' : 'Sign In →'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
