import { useState, useRef, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    Search, ShoppingCart, X, Plus, Minus, Trash2, User,
    CreditCard, Smartphone, Banknote, Pause, Play, Printer,
    Package, ArrowLeft, Lock, Keyboard, Ban, XCircle, Maximize2, Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import ReceiptPrint, { buildReceiptHtml } from '@/components/receipt-print';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import pos from '@/routes/pos';
import type { Product, Category, Customer, CartItem, HeldTransaction, Transaction } from '@/types';

interface PosPageProps {
    products: { data: Product[]; current_page: number; last_page: number; total: number };
    categories: (Category & { products_count: number })[];
    customers: Pick<Customer, 'id' | 'name' | 'phone' | 'email'>[];
    heldTransactions: HeldTransaction[];
    completedTransaction?: Transaction | null;
    storeSettings?: Record<string, string>;
    resumeCart?: CartItem[];
    resumeCustomer?: { customer_id?: number; customer_name?: string } | null;
    resumeNotes?: string;
    currentShift?: { id: number; opened_at: string; opening_balance: number; status: string } | null;
    todaySales?: number;
    recentTransactions?: Transaction[];
    cashIn?: number;
    cashOut?: number;
}

export default function PosIndex({ products, categories, customers, heldTransactions, completedTransaction, storeSettings, resumeCart, resumeCustomer, resumeNotes, currentShift, todaySales, recentTransactions, cashIn, cashOut }: PosPageProps) {
    const { props: pageProps } = usePage();
    const { resolvedAppearance } = useAppearance();
    const logoSrc = resolvedAppearance === 'dark' ? '/brand/logo-dark.png' : '/brand/logo-light.png';
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [showCustomerSelect, setShowCustomerSelect] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; name: string } | null>(null);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showHoldDialog, setShowHoldDialog] = useState(false);
    const [holdLabel, setHoldLabel] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);
    const receiptPrintRef = useRef<{ print: () => void }>(null);
    const lastAutoAdd = useRef('');
    const [displayProducts, setDisplayProducts] = useState<Product[]>(products.data);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<Transaction | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showShiftDialog, setShowShiftDialog] = useState(false);
    const [openingBalance, setOpeningBalance] = useState('0');
    const [closingBalance, setClosingBalance] = useState('0');
    const [showVoidList, setShowVoidList] = useState(false);
    const [voidTarget, setVoidTarget] = useState<Transaction | null>(null);
    const [voidItemTarget, setVoidItemTarget] = useState<{ id: number; name: string; transactionId: number } | null>(null);
    const [voidReason, setVoidReason] = useState('');
    const [voidPin, setVoidPin] = useState('');
    const [voidingTrans, setVoidingTrans] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }

    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'maya' | 'mixed'>('cash');
    const [tenderedAmount, setTenderedAmount] = useState(0);
    const [payments, setPayments] = useState<{ method: string; amount: number; reference: string }[]>([]);
    const cashInputRef = useRef<HTMLInputElement>(null);
    const refInputRef = useRef<HTMLInputElement>(null);

    const searchTerm = searchQuery.replace(/^@\d{1,3}\s*/, '');
    const presetQty = (() => {
        const match = searchQuery.match(/^@(\d{1,3})/);
        return match ? parseInt(match[1]) : 0;
    })();

    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const calculatedDiscount = discountAmount > 0 ? discountAmount : (subtotal * discountPercent / 100);
    const taxRate = 0;
    const taxAmount = (subtotal - calculatedDiscount) * taxRate / 100;
    const total = subtotal - calculatedDiscount + taxAmount;
    const change = Math.max(0, tenderedAmount - total);

    useEffect(() => {
        let filtered = products.data;
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.sku && p.sku.toLowerCase().includes(q)) ||
                (p.barcode && p.barcode.toLowerCase().includes(q))
            );
        }
        if (selectedCategory) {
            filtered = filtered.filter(p => p.category_id === selectedCategory);
        }
        setDisplayProducts(filtered);
        setSelectedIndex(-1);
    }, [searchTerm, selectedCategory, products.data]);

    useEffect(() => {
        if (completedTransaction) {
            setReceiptData(completedTransaction);
            setReceiptOpen(true);
        }
    }, [completedTransaction]);

    useEffect(() => {
        if (resumeCart) {
            setCart(resumeCart);
        }
        if (resumeCustomer && resumeCustomer.customer_id) {
            setSelectedCustomer({ id: resumeCustomer.customer_id, name: resumeCustomer.customer_name || '' });
        }
        if (resumeNotes) {
            setNotes(resumeNotes);
        }
    }, [resumeCart, resumeCustomer, resumeNotes]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFs);
        return () => document.removeEventListener('fullscreenchange', handleFs);
    }, []);

    useEffect(() => {
        if (showPayment && paymentMethod === 'cash') {
            setTimeout(() => cashInputRef.current?.focus(), 100);
        }
        if (showPayment && (paymentMethod === 'gcash' || paymentMethod === 'maya')) {
            setTimeout(() => refInputRef.current?.focus(), 100);
        }
    }, [showPayment, paymentMethod]);

    useEffect(() => {
        if (!showPayment) return;
        function handlePaymentKey(e: KeyboardEvent) {
            if (!e.altKey && e.key !== 'Enter') return;
            if (e.altKey) {
                if (e.key === 'c' || e.key === 'C') { setPaymentMethod('cash'); e.preventDefault(); }
                if (e.key === 'g' || e.key === 'G') { setPaymentMethod('gcash'); e.preventDefault(); }
                if (e.key === 'm' || e.key === 'M') { setPaymentMethod('maya'); e.preventDefault(); }
                if (e.key === 'x' || e.key === 'X') { handleExactAmount(); e.preventDefault(); }
            }
            if (e.key === 'Enter' && !processing && total > 0 && (paymentMethod !== 'cash' || tenderedAmount >= total)) {
                e.preventDefault();
                processPayment();
            }
        }
        window.addEventListener('keydown', handlePaymentKey);
        return () => window.removeEventListener('keydown', handlePaymentKey);
    }, [showPayment, paymentMethod, total, tenderedAmount, processing]);

    useEffect(() => {
        const flash = (pageProps as Record<string, unknown>).flash as Record<string, string> | undefined;
        if (flash?.success) toast.success(flash.success, { position: 'bottom-left' });
        if (flash?.error) toast.error(flash.error, { position: 'bottom-left' });
    }, []);

    useEffect(() => {
        const isBarcode = /^\d{8,}$/.test(searchQuery);
        if (isBarcode && displayProducts.length === 1 && searchQuery !== lastAutoAdd.current) {
            lastAutoAdd.current = searchQuery;
            addToCart(displayProducts[0]);
            setSearchQuery('');
            searchRef.current?.focus();
        }
    }, [displayProducts, searchQuery, searchTerm]);

    useEffect(() => {
        searchRef.current?.focus();
    }, []);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            const target = e.target as HTMLElement;
            if (target.closest('button, input, textarea, select, a, [role="button"]')) return;
            if (target.closest('[data-search-lock]')) return;
            searchRef.current?.focus();
        }
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (showPayment || showHoldDialog || showCustomerSelect || showShiftDialog || receiptOpen) return;
            if (e.key >= 'F1' && e.key <= 'F8') {
                e.preventDefault();
                const idx = parseInt(e.key.replace('F', '')) - 1;
                if (categories[idx]) {
                    setSelectedCategory(selectedCategory === categories[idx].id ? null : categories[idx].id);
                }
            }
            if (e.key === 'Escape') {
                setSearchQuery('');
                setSelectedCategory(null);
                searchRef.current?.focus();
            }
            if (e.key === 'F9' && cart.length > 0) {
                e.preventDefault();
                setShowPayment(true);
            }
            if (e.key === 'F10' && cart.length > 0) {
                e.preventDefault();
                setShowHoldDialog(true);
            }
            // Arrow key navigation in product grid
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, displayProducts.length - 1));
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            }
            // Enter to add product (arrow selection, barcode, or single match)
            if (e.key === 'Enter' && displayProducts.length === 1) {
                e.preventDefault();
                addToCart(displayProducts[0]);
                setSearchQuery('');
            } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < displayProducts.length) {
                e.preventDefault();
                addToCart(displayProducts[selectedIndex]);
                setSearchQuery('');
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, selectedCategory, categories, displayProducts, selectedIndex, presetQty, showPayment, showHoldDialog, showCustomerSelect, showShiftDialog, receiptOpen]);

    function addToCart(product: Product, qty?: number) {
        const quantity = qty && qty > 0 ? qty : presetQty > 0 ? presetQty : 1;
        const price = Number(product.selling_price);

        if (product.track_inventory) {
            const existingQty = cart.find(item => item.product_id === product.id)?.quantity || 0;
            const totalRequested = existingQty + quantity;
            if (totalRequested > product.stock_quantity) {
                toast.error(`Only ${product.stock_quantity} available, ${totalRequested} requested`, { position: 'bottom-left' });
                return;
            }
        }

        setCart(prev => {
            const existing = prev.find(item => item.product_id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product_id === product.id
                        ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * price }
                        : item
                );
            }
            return [...prev, {
                product_id: product.id,
                name: product.name,
                brand: product.brand || null,
                sku: product.sku,
                barcode: product.barcode,
                unit_price: price,
                quantity,
                subtotal: price * quantity,
                image: product.image,
                stock_quantity: product.stock_quantity,
            }];
        });
        setSearchQuery('');
        searchRef.current?.focus();
        toast.success(`${quantity}x ${product.name} added to cart`, { position: 'bottom-left' });
    }

    function updateQuantity(productId: number, delta: number) {
        setCart(prev => {
            const item = prev.find(i => i.product_id === productId);
            if (item && delta > 0 && item.stock_quantity !== undefined && (item.quantity + delta) > item.stock_quantity) {
                toast.error(`Only ${item.stock_quantity} available`, { position: 'bottom-left' });
                return prev;
            }
            return prev.map(i => {
                if (i.product_id === productId) {
                    const newQty = Math.max(0.01, i.quantity + delta);
                    return { ...i, quantity: newQty, subtotal: newQty * i.unit_price };
                }
                return i;
            }).filter(i => i.quantity > 0);
        });
    }

    function removeFromCart(productId: number) {
        setCart(prev => prev.filter(item => item.product_id !== productId));
    }

    function handleQuickAmount(amount: number) {
        setTenderedAmount(amount);
    }

    function handleExactAmount() {
        setTenderedAmount(total);
    }

    function processPayment() {
        if (total <= 0) {
            toast.error('Invalid total amount', { position: 'bottom-left' });
            return;
        }
        setProcessing(true);

        const isMixed = paymentMethod === 'mixed';
        const totalTendered = isMixed
            ? payments.reduce((sum, p) => sum + p.amount, 0)
            : tenderedAmount;

        router.post(pos.process.url(), {
            items: cart.map(item => ({
                product_id: item.product_id,
                product_variant_id: item.product_variant_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                notes: item.notes,
            })),
            customer_id: selectedCustomer?.id || null,
            discount_amount: calculatedDiscount,
            discount_percentage: discountPercent,
            tax_rate: taxRate,
            tendered_amount: totalTendered,
            payment_method: paymentMethod,
            payments: isMixed ? payments.map(p => ({
                method: p.method,
                amount: p.amount,
                reference_number: p.reference || null,
            })) : [{ method: paymentMethod, amount: total, reference_number: null }],
            notes: notes || null,
        }, {
            onSuccess: () => {
                setCart([]);
                setSelectedCustomer(null);
                setDiscountAmount(0);
                setDiscountPercent(0);
                setNotes('');
                setShowPayment(false);
                setTenderedAmount(0);
                setPayments([]);
                toast.success('Transaction completed!', { position: 'bottom-left' });
            },
            onError: (errors) => {
                console.error(errors);
                toast.error('Failed to process transaction', { position: 'bottom-left' });
            },
            onFinish: () => setProcessing(false),
        });
    }

    function handleHold() {
        if (!holdLabel.trim()) {
            toast.error('Please enter a label for this held transaction', { position: 'bottom-left' });
            return;
        }
        setShowHoldDialog(false);
        setProcessing(true);
        router.post(pos.hold.url(), {
            label: holdLabel,
            cart_data: cart,
            customer_data: selectedCustomer ? { customer_id: selectedCustomer.id, customer_name: selectedCustomer.name } : null,
            notes: notes,
        }, {
            onFinish: () => setProcessing(false),
        });
    }

    function resumeTransaction(held: HeldTransaction) {
        router.visit(pos.resume.url(held.id));
    }

    return (
        <div className="flex h-screen flex-col bg-background">
            <Head title="POS" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-card px-4 sm:px-6 py-3 shadow-sm gap-2">
                <div className="flex items-center gap-3">
                    <img src={logoSrc} alt="Vendora" className="h-7 w-auto" />
                    <span className="text-muted-foreground/50 text-lg font-light">|</span>
                    <span className="text-sm font-medium text-muted-foreground">POS Terminal</span>
                    <Badge variant="secondary" className="ml-2 text-xs font-medium">
                        {cart.length} item{cart.length !== 1 ? 's' : ''}
                    </Badge>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                        {currentTime.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' '}
                        {currentTime.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="relative">
                                <Play className="mr-1 size-3" />
                                Held
                                {heldTransactions.length > 0 && (
                                    <span className="ml-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                        {heldTransactions.length}
                                    </span>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-96 sm:max-w-md">
                            <SheetHeader>
                                <SheetTitle>Held Transactions</SheetTitle>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto px-4 pb-4">
                            <div className="space-y-3">
                                {heldTransactions.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-muted-foreground">No held transactions</p>
                                ) : (
                                    heldTransactions.map(held => (
                                        <div key={held.id} className="group rounded-lg border bg-card">
                                            <div className="flex items-center justify-between border-b px-3 py-2">
                                                <div className="flex-1 cursor-pointer min-w-0" onClick={() => resumeTransaction(held)}>
                                                    <p className="text-sm font-medium truncate">{held.label}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(held.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-xs font-semibold">
                                                        ₱{Array.isArray(held.cart_data)
                                                            ? held.cart_data.reduce((sum: number, item: CartItem) => sum + item.subtotal, 0).toFixed(2)
                                                            : '0.00'}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-6 text-muted-foreground opacity-0 group-hover:opacity-100"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.delete(pos.held.destroy.url(held.id));
                                                        }}
                                                    >
                                                        <X className="size-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {Array.isArray(held.cart_data) && held.cart_data.length > 0 && (
                                                <div className="p-2">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="text-muted-foreground border-b">
                                                                <td className="pb-1 font-medium">Item</td>
                                                                <td className="pb-1 text-right font-medium">Price</td>
                                                                <td className="pb-1 text-right font-medium">Qty</td>
                                                                <td className="pb-1 text-right font-medium">Total</td>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {held.cart_data.slice(0, 5).map((item: CartItem, i: number) => (
                                                                <tr key={i} className="border-b last:border-0">
                                                                    <td className="py-0.5 truncate max-w-[140px]">{item.name}</td>
                                                                    <td className="py-0.5 text-right">₱{Number(item.unit_price).toFixed(2)}</td>
                                                                     <td className="py-0.5 text-right">{parseFloat(String(item.quantity)).toString()}</td>
                                                                     <td className="py-0.5 text-right">₱{Number(item.subtotal).toFixed(2)}</td>
                                                                 </tr>
                                                             ))}
                                                             {Array.isArray(held.cart_data) && held.cart_data.length > 5 && (
                                                                <tr>
                                                                    <td colSpan={4} className="pt-0.5 text-center text-[10px] text-muted-foreground">
                                                                        +{held.cart_data.length - 5} more items
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            <div className="flex gap-2 border-t px-3 py-1.5">
                                                <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => resumeTransaction(held)}>
                                                    <Play className="mr-1 size-3" />
                                                    Resume
                                                </Button>
                                                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.delete(pos.held.destroy.url(held.id));
                                                    }}>
                                                    <X className="mr-1 size-3" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        </SheetContent>
                    </Sheet>
                    <Button
                        variant={currentShift ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => setShowShiftDialog(true)}
                        className="relative"
                    >
                        <Banknote className="mr-1 size-3" />
                        {currentShift ? 'Close Shift' : 'Open Shift'}
                    </Button>
                    {currentShift && recentTransactions && recentTransactions.length > 0 && (
                        <Sheet open={showVoidList} onOpenChange={setShowVoidList}>
                            <Button variant="outline" size="sm" className="relative" onClick={() => setShowVoidList(true)}>
                                <Ban className="mr-1 size-3" />
                                Void
                                {recentTransactions.filter(t => t.status === 'completed').length > 0 && (
                                    <span className="ml-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                                        {recentTransactions.filter(t => t.status === 'completed').length}
                                    </span>
                                )}
                            </Button>
                            <SheetContent className="w-96 sm:max-w-md">
                                <SheetHeader>
                                    <SheetTitle>Void Transaction</SheetTitle>
                                </SheetHeader>
                                <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4">
                                    <div className="space-y-3">
                                        {recentTransactions.filter(t => t.status === 'completed').map(t => (
                                            <div key={t.id} className="rounded-lg border bg-card">
                                                <div className="flex items-center justify-between border-b px-3 py-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium truncate">{t.reference_number}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <span className="text-xs font-semibold">₱{Number(t.total).toFixed(2)}</span>
                                                        <Button variant="destructive" size="sm" className="h-7 text-xs"
                                                            onClick={() => { setVoidTarget(t); setVoidReason(''); setVoidPin(''); setShowVoidList(false); }}>
                                                            Void All
                                                        </Button>
                                                    </div>
                                                </div>
                                                {t.items && t.items.length > 0 && (
                                                    <div className="p-2">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-muted-foreground border-b">
                                                                    <td className="pb-1 font-medium">Item</td>
                                                                    <td className="pb-1 text-right font-medium">Qty</td>
                                                                    <td className="pb-1 text-right font-medium">Total</td>
                                                                    <td className="pb-1 w-8" />
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {t.items.map(item => (
                                                                    <tr key={item.id} className="border-b last:border-0">
                                                        <td className="py-0.5 truncate max-w-[120px]">{item.product_name}</td>
                                                        <td className="py-0.5 text-right">{parseFloat(String(item.quantity)).toString()}</td>
                                                        <td className="py-0.5 text-right">₱{Number(item.total).toFixed(2)}</td>
                                                        <td className="py-0.5 text-right">
                                                            <Button variant="ghost" size="icon" className="size-5 text-destructive"
                                                                onClick={() => { setVoidItemTarget({ id: item.id, name: item.product_name, transactionId: t.id }); setVoidReason(''); setVoidPin(''); setShowVoidList(false); }}>
                                                                <XCircle className="size-3" />
                                                            </Button>
                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <Keyboard className="size-3.5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-80">
                            <SheetHeader>
                                <SheetTitle>Keyboard Shortcuts</SheetTitle>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto px-4 pb-4">
                                <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">Search</p>
                                    <div className="flex justify-between text-sm"><span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">@</kbd> + number</span><span className="text-muted-foreground text-xs">Set quantity prefix</span></div>
                                    <div className="flex justify-between text-sm"><span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">Esc</kbd></span><span className="text-muted-foreground text-xs">Clear search</span></div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">Navigation</p>
                                    <div className="flex justify-between text-sm"><span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">↑↓←→</kbd></span><span className="text-muted-foreground text-xs">Navigate products</span></div>
                                    <div className="flex justify-between text-sm"><span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">Enter</kbd></span><span className="text-muted-foreground text-xs">Add to cart</span></div>
                                    <div className="flex justify-between text-sm"><span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">F1-F8</kbd></span><span className="text-muted-foreground text-xs">Select category</span></div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">Actions</p>
                                    <div className="flex justify-between text-sm"><span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">F9</kbd></span><span className="text-muted-foreground text-xs">Pay</span></div>
                                    <div className="flex justify-between text-sm"><span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">F10</kbd></span><span className="text-muted-foreground text-xs">Hold</span></div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">Payment</p>
                                    <div className="flex justify-between text-sm"><span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">Alt+C</kbd></span><span className="text-muted-foreground text-xs">Cash</span></div>
                                    <div className="flex justify-between text-sm"><span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">Alt+G</kbd></span><span className="text-muted-foreground text-xs">GCash</span></div>
                                    <div className="flex justify-between text-sm"><span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">Alt+M</kbd></span><span className="text-muted-foreground text-xs">Maya</span></div>
                                    <div className="flex justify-between text-sm"><span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">Alt+X</kbd></span><span className="text-muted-foreground text-xs">Exact amount</span></div>
                                </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                    {cart.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => {
                            setCart([]);
                            setSelectedCustomer(null);
                            setDiscountAmount(0);
                            setDiscountPercent(0);
                            setNotes('');
                        }}>
                            <Trash2 className="mr-1 size-3" />
                            Clear
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                        {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={dashboard.url()}>
                            <ArrowLeft className="mr-1 size-3" />
                            Exit
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
                {!currentShift && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/95">
                        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                            <Lock className="size-8 text-muted-foreground/50" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-semibold">Shift Not Open</p>
                            <p className="text-sm text-muted-foreground">Open a shift to start accepting transactions</p>
                        </div>
                        <Button onClick={() => setShowShiftDialog(true)}>
                            Open Shift
                        </Button>
                    </div>
                )}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="border-b bg-background p-3">
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                ref={searchRef}
                                placeholder="Search products by name, SKU, or barcode... (Esc to clear)"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 text-base"
                            />
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            <Button
                                key="all"
                                variant={selectedCategory === null ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedCategory(null)}
                                className="shrink-0"
                            >
                                All
                            </Button>
                            {categories.slice(0, 12).map(cat => (
                                <Button
                                    key={cat.id}
                                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                    className="shrink-0"
                                >
                                    {cat.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <ScrollArea className="flex-1 bg-[#F5F3EE] dark:bg-[#121212]">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 p-3">
                            {displayProducts.map((product, i) => {
                                const isOos = product.stock_quantity <= 0 && product.track_inventory;
                                const isLow = product.stock_quantity <= product.low_stock_threshold && product.track_inventory && product.stock_quantity > 0;
                                const isHealthy = product.track_inventory && product.stock_quantity > product.low_stock_threshold;
                                return (
                                <div
                                    key={product.id}
                                    className={cn(
                                        "group cursor-pointer rounded-xl bg-white dark:bg-[#1A1A1A] shadow-sm transition-all duration-150 overflow-hidden",
                                        "hover:shadow-md hover:-translate-y-0.5",
                                        !product.is_active && "opacity-50",
                                        isOos && "opacity-50",
                                        selectedIndex === i && "ring-2 ring-[#243F14] shadow-md",
                                    )}
                                    onClick={() => {
                                        if (product.status && product.status !== 'active') {
                                            toast.error(`This product is ${product.status} and cannot be sold.`, { position: 'bottom-left' });
                                            return;
                                        }
                                        if (isOos) {
                                            toast.error(`${product.name} is out of stock`, { position: 'bottom-left' });
                                            return;
                                        }
                                        addToCart(product);
                                    }}
                                >
                                    <div className="relative overflow-hidden">
                                        {product.image ? (
                                            <>
                                                <img src={`/storage/${product.image}`} alt={product.name} className="w-full aspect-[4/3] object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white dark:from-[#1A1A1A] to-transparent pointer-events-none" />
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center aspect-[4/3]">
                                                <Package className="size-8 text-[#243F14]/15 dark:text-white/15" />
                                            </div>
                                        )}

                                    </div>
                                    <div className="px-2.5 pb-2.5 pt-1.5 flex flex-col gap-0.5">
                                        <p className="text-xs font-semibold leading-tight text-[#1A1A1A] dark:text-[#EDEDED] line-clamp-2">{product.name}</p>
                                        {product.category && (
                                            <p className="text-[10px] text-[#9CA3AF] truncate">{product.category.name}</p>
                                        )}
                                        <div className="flex items-end justify-between mt-0.5 gap-1">
                                            {product.track_inventory && (
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 text-[10px] leading-none",
                                                    isHealthy && "text-emerald-600 dark:text-emerald-400",
                                                    isLow && "text-amber-600 dark:text-amber-400",
                                                    isOos && "text-red-600 dark:text-red-400",
                                                )}>
                                                    <span className={cn(
                                                        "size-1.5 rounded-full shrink-0",
                                                        isHealthy && "bg-emerald-500",
                                                        isLow && "bg-amber-500",
                                                        isOos && "bg-red-500",
                                                    )} />
                                                    {isOos ? 'Out' : product.stock_quantity}
                                                </span>
                                            )}
                                            <p className="text-xs font-bold text-[#243F14] dark:text-[#3A6B2A] text-right ml-auto">₱{Number(product.selling_price).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>

                        {displayProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Package className="text-muted-foreground/40 size-12 mb-3" />
                                <p className="text-muted-foreground">No products found</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <div data-search-lock className="flex w-full lg:w-96 flex-col border-t lg:border-t-0 lg:border-l bg-background lg:max-h-none max-h-[40vh]">
                    <div className="border-b p-3">
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setShowCustomerSelect(true)}
                        >
                            <User className="mr-2 size-4" />
                            {selectedCustomer ? selectedCustomer.name : 'Select customer (optional)'}
                            {selectedCustomer && (
                                <X className="ml-auto size-3" onClick={e => {
                                    e.stopPropagation();
                                    setSelectedCustomer(null);
                                }} />
                            )}
                        </Button>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="divide-y">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <ShoppingCart className="text-muted-foreground/30 size-12 mb-3" />
                                    <p className="text-muted-foreground text-sm">Cart is empty</p>
                                    <p className="text-muted-foreground/60 text-xs">Search and click products to add</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.product_id} className="flex items-center gap-2 p-2">
                                        {item.image ? (
                                            <div className="size-10 shrink-0 flex items-center justify-center rounded border bg-muted/30 overflow-hidden">
                                                <img src={`/storage/${item.image}`} alt={item.name} className="max-h-10 max-w-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="size-10 shrink-0 flex items-center justify-center rounded border bg-muted/30">
                                                <Package className="size-5 text-muted-foreground/40" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.name}</p>
                                            {item.brand && <p className="text-[10px] text-muted-foreground">{item.brand}</p>}
                                            <p className="text-xs text-muted-foreground">&#x20B1;{item.unit_price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="size-7" onClick={() => updateQuantity(item.product_id, -1)}>
                                                <Minus className="size-3" />
                                            </Button>
                                            <span className="w-8 text-center text-sm font-medium">{parseFloat(String(item.quantity)).toString()}</span>
                                            <Button variant="ghost" size="icon" className="size-7" onClick={() => updateQuantity(item.product_id, 1)}>
                                                <Plus className="size-3" />
                                            </Button>
                                        </div>
                                        <p className="w-20 text-right text-sm font-bold">&#x20B1;{item.subtotal.toFixed(2)}</p>
                                        <Button variant="ghost" size="icon" className="size-7 shrink-0 text-destructive" onClick={() => removeFromCart(item.product_id)}>
                                            <Trash2 className="size-3" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    <div className="border-t p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>&#x20B1;{subtotal.toFixed(2)}</span>
                        </div>
                        {calculatedDiscount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Discount</span>
                                <span>-&#x20B1;{calculatedDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>&#x20B1;{total.toFixed(2)}</span>
                        </div>

                        {cart.length > 0 && (
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        type="number"
                                        placeholder="Discount %"
                                        value={discountPercent || ''}
                                        onChange={e => { setDiscountPercent(Number(e.target.value)); setDiscountAmount(0); }}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        type="number"
                                        placeholder="Discount &#x20B1;"
                                        value={discountAmount || ''}
                                        onChange={e => { setDiscountAmount(Number(e.target.value)); setDiscountPercent(0); }}
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>
                        )}

                        <Input
                            placeholder="Notes (optional)"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="h-8 text-xs"
                        />

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                disabled={cart.length === 0}
                                onClick={() => {
                                    setShowHoldDialog(true);
                                    setHoldLabel(`Cart - ${new Date().toLocaleTimeString()}`);
                                }}
                            >
                                <Pause className="mr-1 size-3" />
                                Hold
                            </Button>
                            <Button
                                className="flex-1"
                                size="lg"
                                disabled={cart.length === 0}
                                onClick={() => setShowPayment(true)}
                            >
                                <CreditCard className="mr-1 size-4" />
                                Pay (F9)
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <Dialog open={showCustomerSelect} onOpenChange={setShowCustomerSelect}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select Customer</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-60 space-y-1 overflow-y-auto">
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => { setSelectedCustomer(null); setShowCustomerSelect(false); }}
                        >
                            <User className="mr-2 size-4" />
                            Walk-in Customer
                        </Button>
                        {customers.map(c => (
                            <Button
                                key={c.id}
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => { setSelectedCustomer({ id: c.id, name: c.name }); setShowCustomerSelect(false); }}
                            >
                                <User className="mr-2 size-4" />
                                <div className="text-left">
                                    <p className="text-sm font-medium">{c.name}</p>
                                    <p className="text-xs text-muted-foreground">{c.phone || c.email || 'No contact'}</p>
                                </div>
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showPayment} onOpenChange={setShowPayment}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Process Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-muted-foreground text-sm">Total Amount</p>
                            <p className="text-4xl font-bold">&#x20B1;{total.toFixed(2)}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                                className="flex-col py-3 h-auto"
                                onClick={() => setPaymentMethod('cash')}
                            >
                                <Banknote className="size-5 mb-1" />
                                <span className="text-xs">Cash</span>
                            </Button>
                            <Button
                                variant={paymentMethod === 'gcash' ? 'default' : 'outline'}
                                className="flex-col py-3 h-auto"
                                onClick={() => setPaymentMethod('gcash')}
                            >
                                <img src="/assets/Gcash.png" alt="GCash" className="h-5 mb-1" />
                                <span className="text-xs">GCash</span>
                            </Button>
                            <Button
                                variant={paymentMethod === 'maya' ? 'default' : 'outline'}
                                className="flex-col py-3 h-auto"
                                onClick={() => setPaymentMethod('maya')}
                            >
                                <img src="/assets/Maya.png" alt="Maya" className="h-5 mb-1" />
                                <span className="text-xs">Maya</span>
                            </Button>
                        </div>

                        {paymentMethod === 'cash' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount Tendered</label>
                                <Input
                                    ref={cashInputRef}
                                    type="number"
                                    placeholder="Enter amount"
                                    value={tenderedAmount || ''}
                                    onChange={e => setTenderedAmount(Number(e.target.value))}
                                    className="h-12 text-xl text-center"
                                />
                                <div className="grid grid-cols-4 gap-1">
                                    {[1000, 500, 200, 100, 50, 20].map(amt => (
                                        <Button key={amt} variant="outline" size="sm" onClick={() => handleQuickAmount(amt)}>
                                            &#x20B1;{amt}
                                        </Button>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={handleExactAmount} className="col-span-2">
                                        Exact Amount
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setTenderedAmount(0)}>
                                        Clear
                                    </Button>
                                </div>
                                {tenderedAmount >= total && (
                                    <div className="rounded-lg bg-green-50 p-2 text-center dark:bg-green-950">
                                        <p className="text-sm text-muted-foreground">Change</p>
                                        <p className="text-2xl font-bold text-green-600">&#x20B1;{change.toFixed(2)}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {(paymentMethod === 'gcash' || paymentMethod === 'maya') && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Reference Number</label>
                                <Input
                                    ref={refInputRef}
                                    placeholder="Enter reference number"
                                    value={payments[0]?.reference || ''}
                                    onChange={e => setPayments([{ method: paymentMethod, amount: total, reference: e.target.value }])}
                                />
                                <Button variant="outline" className="w-full" onClick={handleExactAmount}>
                                    Amount: &#x20B1;{total.toFixed(2)}
                                </Button>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowPayment(false)}>
                            Cancel
                        </Button>
                        <Button
                            size="lg"
                            disabled={processing || total <= 0 || (paymentMethod === 'cash' && tenderedAmount < total)}
                            onClick={processPayment}
                        >
                            {processing ? 'Processing...' : `Complete Payment (₱${total.toFixed(2)})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showHoldDialog} onOpenChange={setShowHoldDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hold Transaction</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Transaction Label</label>
                        <Input
                            value={holdLabel}
                            onChange={e => setHoldLabel(e.target.value)}
                            placeholder="e.g., Customer waiting for payment"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowHoldDialog(false)}>Cancel</Button>
                        <Button onClick={handleHold} disabled={processing}>
                            {processing ? 'Holding...' : 'Hold Transaction'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Receipt</DialogTitle>
                    </DialogHeader>

                    {receiptData && (
                        <div className="space-y-3 text-sm">
                            <div className="text-center">
                                <img src={logoSrc} alt="Vendora" className="mx-auto mb-2 h-8 w-auto" />
                                <p className="text-muted-foreground text-xs">Thank you for your purchase!</p>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{receiptData.reference_number}</span>
                                <span>{new Date(receiptData.created_at).toLocaleString()}</span>
                            </div>
                            <Separator />
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b font-medium">
                                        <td className="pb-1">Item</td>
                                        <td className="pb-1 text-right">Price</td>
                                        <td className="pb-1 text-right">Qty</td>
                                        <td className="pb-1 text-right">Total</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receiptData.items?.map(item => (
                                        <tr key={item.id}>
                                            <td className="py-0.5">
                                                <span>{item.product_name}</span>
                                                {(item as Record<string, unknown>).product_brand && <span className="ml-1 text-[10px] text-muted-foreground">{(item as Record<string, unknown>).product_brand as string}</span>}
                                            </td>
                                            <td className="py-0.5 text-right">₱{Number(item.unit_price).toFixed(2)}</td>
                                            <td className="py-0.5 text-right">{parseFloat(String(item.quantity)).toString()}</td>
                                            <td className="py-0.5 text-right">₱{Number(item.total).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {Number(receiptData.discount_amount) > 0 && (
                                <div className="flex justify-between text-xs text-green-600">
                                        <span>Discount</span>
                                        <span>-₱{Number(receiptData.discount_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm font-bold">
                                    <span>Total</span>
                                    <span>₱{Number(receiptData.total).toFixed(2)}</span>
                                </div>
                            <Separator />
                            <div className="text-xs text-muted-foreground">
                                <p>Paid via: {receiptData.payment_method?.toUpperCase()}</p>
                                <p>Tendered: ₱{Number(receiptData.tendered_amount).toFixed(2)}</p>
                                <p>Change: ₱{Number(receiptData.change_amount).toFixed(2)}</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 no-print">
                        <Button variant="outline" onClick={() => receiptPrintRef.current?.print()}>
                            <Printer className="mr-1 size-4" />
                            Print Receipt
                        </Button>
                        <Button onClick={() => setReceiptOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {receiptData && (
                <ReceiptPrint ref={receiptPrintRef} transaction={receiptData} settings={storeSettings} />
            )}

            <Dialog open={voidTarget !== null || voidItemTarget !== null} onOpenChange={() => { setVoidTarget(null); setVoidItemTarget(null); setVoidPin(''); }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{voidItemTarget ? 'Void Item' : 'Void Transaction'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        {voidTarget && (
                            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                                <p className="font-medium">{voidTarget.reference_number}</p>
                                <p className="text-xs text-muted-foreground">
                                    {voidTarget.item_count} items · ₱{Number(voidTarget.total).toFixed(2)} · {new Date(voidTarget.created_at).toLocaleString()}
                                </p>
                            </div>
                        )}
                        {voidItemTarget && (
                            <div className="rounded-lg bg-muted p-3 text-sm">
                                <p className="font-medium">{voidItemTarget.name}</p>
                                <p className="text-xs text-muted-foreground">Void this item from the transaction</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason for voiding</label>
                            <textarea
                                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Enter reason..."
                                value={voidReason}
                                onChange={e => setVoidReason(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Manager Password</label>
                            <input
                                type="password"
                                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Enter manager password..."
                                value={voidPin}
                                onChange={e => setVoidPin(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => { setVoidTarget(null); setVoidItemTarget(null); setVoidPin(''); }} disabled={voidingTrans}>Cancel</Button>
                        <Button variant="destructive" disabled={voidingTrans || !voidReason.trim() || !voidPin.trim()}
                            onClick={() => {
                                if ((!voidTarget && !voidItemTarget) || !voidReason.trim() || !voidPin.trim()) return;
                                setVoidingTrans(true);
                                if (voidItemTarget) {
                                    router.post('/sales/items/' + voidItemTarget.id + '/void', {
                                        reason: voidReason,
                                        password: voidPin,
                                    }, {
                                        onSuccess: () => {
                                            toast.success('Item voided successfully');
                                            setVoidItemTarget(null);
                                            setVoidReason('');
                                            setVoidPin('');
                                        },
                                        onError: (errors) => {
                                            const errMsg = typeof errors === 'string' ? errors : Object.values(errors).flat().join(', ');
                                            toast.error(errMsg || 'Failed to void item');
                                        },
                                        onFinish: () => setVoidingTrans(false),
                                    });
                                } else if (voidTarget) {
                                    router.post('/sales/' + voidTarget.id + '/void', {
                                        reason: voidReason,
                                        password: voidPin,
                                    }, {
                                        onSuccess: () => {
                                            toast.success('Transaction voided successfully');
                                            setVoidTarget(null);
                                            setVoidReason('');
                                            setVoidPin('');
                                        },
                                        onError: (errors) => {
                                            const errMsg = typeof errors === 'string' ? errors : Object.values(errors).flat().join(', ');
                                            toast.error(errMsg || 'Failed to void transaction');
                                        },
                                        onFinish: () => setVoidingTrans(false),
                                    });
                                }
                            }}>
                            {voidingTrans ? 'Voiding...' : voidItemTarget ? 'Void Item' : 'Void Transaction'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{currentShift ? 'Close Shift' : 'Open Shift'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {currentShift ? (
                            <>
                                <div className="rounded-lg bg-muted p-3 space-y-1.5 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Opened</span><span className="font-medium">{new Date(currentShift.opened_at).toLocaleTimeString()}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Opening Balance</span><span className="font-medium">₱{Number(currentShift.opening_balance).toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Sales Today</span><span className="font-medium">₱{Number(todaySales || 0).toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Cash In</span><span className="font-medium text-green-600">+₱{Number(cashIn || 0).toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Cash Out</span><span className="font-medium text-red-600">-₱{Number(cashOut || 0).toFixed(2)}</span></div>
                                    <Separator />
                                    <div className="flex justify-between font-bold">
                                        <span>Expected</span>
                                        <span>₱{(Number(currentShift.opening_balance) + Number(todaySales || 0) + Number(cashIn || 0) - Number(cashOut || 0)).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Closing Balance</Label>
                                    <Input type="number" step="0.01" value={closingBalance} onChange={e => setClosingBalance(e.target.value)} placeholder="Enter actual cash count" />
                                </div>
                                <Button
                                    className="w-full"
                                    disabled={processing || !closingBalance}
                                    onClick={() => {
                                        setShowShiftDialog(false);
                                        setProcessing(true);
                                        router.post('/shifts/' + currentShift.id + '/close', {
                                            closing_balance: parseFloat(closingBalance),
                                        }, {
                                            onFinish: () => setProcessing(false),
                                        });
                                    }}
                                >
                                    {processing ? 'Closing...' : 'Close Shift'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label>Opening Balance</Label>
                                    <Input type="number" step="0.01" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} placeholder="0.00" />
                                </div>
                                <Button
                                    className="w-full"
                                    disabled={processing}
                                    onClick={() => {
                                        setShowShiftDialog(false);
                                        setProcessing(true);
                                        router.post('/shifts/open', {
                                            opening_balance: parseFloat(openingBalance || '0'),
                                        }, {
                                            onFinish: () => setProcessing(false),
                                        });
                                    }}
                                >
                                    {processing ? 'Opening...' : 'Open Shift'}
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
