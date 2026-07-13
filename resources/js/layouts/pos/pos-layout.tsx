import { Head } from '@inertiajs/react';
import AssistantChat from '@/components/assistant-chat';

export default function PosLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen flex-col bg-background">
            <Head title="POS" />
            {children}
            <AssistantChat hide />
        </div>
    );
}
