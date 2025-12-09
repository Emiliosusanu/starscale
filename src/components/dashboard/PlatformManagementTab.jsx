
import React from 'react';
import { Loader2, Users, DollarSign, Activity, BarChart3, Ban, Mail, ShoppingBag } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const PlatformManagementTab = ({ users = [], totalRevenue = 0, loading, orders = [], onUserUpdate, onViewClientOrders }) => {
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-cyan-500"/></div>;

	const { toast } = useToast();
	const safeUsers = Array.isArray(users) ? users : [];
	const safeOrders = Array.isArray(orders) ? orders : [];
	const revenueByUserId = safeOrders.reduce((acc, order) => {
		if (order?.payment_status === 'paid' && order?.profile_id) {
			const prev = acc[order.profile_id] || 0;
			acc[order.profile_id] = prev + (order.total_cost || 0);
		}
		return acc;
	}, {});
	const payingClientsCount = safeUsers.filter((u) => (revenueByUserId[u.id] || 0) > 0).length;
	const totalClientRevenue = Object.values(revenueByUserId).reduce(
		(sum, value) => sum + value,
		0,
	);

	const buildDailyStats = (days = 30) => {
		const today = new Date();
		const results = [];

		for (let i = days - 1; i >= 0; i -= 1) {
			const dayStart = new Date(today);
			dayStart.setHours(0, 0, 0, 0);
			dayStart.setDate(today.getDate() - i);
			const dayEnd = new Date(dayStart);
			dayEnd.setDate(dayStart.getDate() + 1);
		
			const newUsers = safeUsers.filter((u) => {
				if (!u?.created_at) return false;
				const created = new Date(u.created_at);
				return created >= dayStart && created < dayEnd;
			}).length;
		
			const revenueCents = safeOrders
				.filter((o) => {
					if (!o?.created_at || o?.payment_status !== 'paid') return false;
					const created = new Date(o.created_at);
					return created >= dayStart && created < dayEnd;
				})
				.reduce((sum, o) => sum + (o.total_cost || 0), 0);
		
			results.push({
				dateLabel: dayStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
				newUsers,
				revenue: Math.round(revenueCents) / 100,
			});
		}
		
		return results;
	};

	const RANGE_OPTIONS = [
		{ id: '7d', label: '7d' },
		{ id: '30d', label: '30d' },
		{ id: '60d', label: '60d' },
		{ id: 'lastMonth', label: 'Last M' },
		{ id: 'thisYear', label: 'This Y' },
	];

	const [range, setRange] = React.useState('30d');

	const buildStatsForRange = (rangeKey) => {
		if (rangeKey === '7d') return buildDailyStats(7);
		if (rangeKey === '30d') return buildDailyStats(30);
		if (rangeKey === '60d') return buildDailyStats(60);

		const today = new Date();
		const results = [];

		// Monthly aggregation for last month and this year
		if (rangeKey === 'thisYear') {
			const year = today.getFullYear();
			for (let m = 0; m <= today.getMonth(); m += 1) {
				const monthStart = new Date(year, m, 1);
				monthStart.setHours(0, 0, 0, 0);
				const monthEnd = new Date(year, m + 1, 1);
				monthEnd.setHours(0, 0, 0, 0);

				const newUsers = safeUsers.filter((u) => {
					if (!u?.created_at) return false;
					const created = new Date(u.created_at);
					return created >= monthStart && created < monthEnd;
				}).length;

				const revenueCents = safeOrders
					.filter((o) => {
						if (!o?.created_at || o?.payment_status !== 'paid') return false;
						const created = new Date(o.created_at);
						return created >= monthStart && created < monthEnd;
					})
					.reduce((sum, o) => sum + (o.total_cost || 0), 0);

				results.push({
					dateLabel: monthStart.toLocaleDateString(undefined, { month: 'short' }),
					newUsers,
					revenue: Math.round(revenueCents) / 100,
				});
			}
			return results;
		}

		if (rangeKey === 'lastMonth') {
			let year = today.getFullYear();
			let monthIndex = today.getMonth() - 1;
			if (monthIndex < 0) {
				monthIndex = 11;
				year -= 1;
			}
			const monthStart = new Date(year, monthIndex, 1);
			monthStart.setHours(0, 0, 0, 0);
			const monthEnd = new Date(year, monthIndex + 1, 1);
			monthEnd.setHours(0, 0, 0, 0);

			const newUsers = safeUsers.filter((u) => {
				if (!u?.created_at) return false;
				const created = new Date(u.created_at);
				return created >= monthStart && created < monthEnd;
			}).length;

			const revenueCents = safeOrders
				.filter((o) => {
					if (!o?.created_at || o?.payment_status !== 'paid') return false;
					const created = new Date(o.created_at);
					return created >= monthStart && created < monthEnd;
				})
				.reduce((sum, o) => sum + (o.total_cost || 0), 0);

			results.push({
				dateLabel: monthStart.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
				newUsers,
				revenue: Math.round(revenueCents) / 100,
			});
			return results;
		}

		// Fallback
		return buildDailyStats(30);
	};

	const stats = buildStatsForRange(range);
	const hasUserData = stats.some((d) => d.newUsers > 0);
	const hasRevenueData = stats.some((d) => d.revenue > 0);
	const isMonthly = range === 'lastMonth' || range === 'thisYear';
	const rangeLabelMap = {
		'7d': '7 days',
		'30d': '30 days',
		'60d': '60 days',
		'lastMonth': 'Last month',
		'thisYear': 'This year',
	};
	const chartsRangeLabel = rangeLabelMap[range] || '30 days';
	const [selectedClient, setSelectedClient] = React.useState(null);
	const [clientSheetOpen, setClientSheetOpen] = React.useState(false);
	const [blocking, setBlocking] = React.useState(false);

	const handleClientClick = (user) => {
		setSelectedClient(user);
		setClientSheetOpen(true);
	};

	const handleToggleBlock = async () => {
		if (!selectedClient) return;
		setBlocking(true);
		try {
			const nextBlocked = !selectedClient.is_blocked;
			const { error } = await supabase
				.from('profiles')
				.update({ is_blocked: nextBlocked })
				.eq('id', selectedClient.id);
			if (error) throw error;
			toast({
				title: nextBlocked ? 'Client blocked' : 'Client unblocked',
				description: selectedClient.email,
			});
			if (onUserUpdate) onUserUpdate();
			setSelectedClient({ ...selectedClient, is_blocked: nextBlocked });
		} catch (e) {
			console.error('Error updating client block status', e);
			toast({
				variant: 'destructive',
				title: 'Error updating client',
				description: e.message || 'Could not update block status.',
			});
		} finally {
			setBlocking(false);
		}
	};

	const handleViewOrders = () => {
		if (!selectedClient || !onViewClientOrders) return;
		onViewClientOrders(selectedClient);
	};

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#121212] border border-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-3 text-gray-300 mb-1">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.2em]">Total Users</span>
                </div>
                <p className="text-2xl md:text-3xl font-extrabold text-white leading-tight">{safeUsers.length}</p>
            </div>
            <div className="bg-[#121212] border border-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-3 text-gray-300 mb-1">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.2em]">Revenue</span>
                </div>
                <p className="text-2xl md:text-3xl font-extrabold text-emerald-400 leading-tight">{formatPrice(totalRevenue)}</p>
            </div>
             <div className="bg-[#121212] border border-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-3 text-gray-300 mb-1">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.2em]">Platform Health</span>
                </div>
                <p className="text-2xl md:text-3xl font-extrabold text-cyan-400 leading-tight">98%</p>
            </div>
        </div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="rounded-xl border border-white/10 bg-[#0b0b0b]/90 backdrop-blur-xl p-4 flex flex-col">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							<BarChart3 className="w-4 h-4 text-cyan-400" />
							<h3 className="text-sm font-bold text-white">New Users ({chartsRangeLabel})</h3>
						</div>
						<div className="flex items-center gap-2">
							<p className="text-[11px] text-gray-500 uppercase tracking-wide hidden md:block">
								{isMonthly ? 'Monthly signups' : 'Daily signups'}
							</p>
							<div className="flex items-center gap-1 rounded-full bg-black/40 border border-white/10 px-1 py-0.5">
								{RANGE_OPTIONS.map((opt) => (
									<button
										key={opt.id}
										onClick={() => setRange(opt.id)}
										className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
											range === opt.id
												? 'bg-white text-black'
												: 'text-gray-500 hover:text-white'
										}`}
									>
										{opt.label}
									</button>
								))}
							</div>
						</div>
					</div>
					<div className="h-52">
						{hasUserData ? (
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={stats} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
									<XAxis dataKey="dateLabel" stroke="#6b7280" tickLine={false} tickMargin={8} fontSize={10} />
									<YAxis stroke="#6b7280" tickLine={false} tickMargin={8} fontSize={10} allowDecimals={false} />
									<Tooltip
										contentStyle={{ backgroundColor: '#020617', borderColor: '#1f2937', borderRadius: 12 }}
										labelStyle={{ color: '#e5e7eb', fontSize: 12 }}
										formatter={(value) => [`${value} users`, 'New Users']}
									/>
									<Area type="monotone" dataKey="newUsers" stroke="#22d3ee" strokeWidth={2} fill="url(#usersGradient)" />
									<defs>
										<linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#22d3ee" stopOpacity={0.6} />
											<stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
										</linearGradient>
									</defs>
								</AreaChart>
							</ResponsiveContainer>
						) : (
							<div className="h-full flex items-center justify-center text-xs text-gray-500">
								No user signups in the last 14 days.
							</div>
						)}
					</div>
				</div>
				<div className="rounded-xl border border-white/10 bg-[#0b0b0b]/90 backdrop-blur-xl p-4 flex flex-col">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							<BarChart3 className="w-4 h-4 text-emerald-400" />
							<h3 className="text-sm font-bold text-white">Revenue ({chartsRangeLabel})</h3>
						</div>
						<p className="text-[11px] text-gray-500 uppercase tracking-wide">
							{isMonthly ? 'Monthly paid volume' : 'Daily paid volume'}
						</p>
					</div>
					<div className="h-52">
						{hasRevenueData ? (
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={stats} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
									<XAxis dataKey="dateLabel" stroke="#6b7280" tickLine={false} tickMargin={8} fontSize={10} />
									<YAxis
										stroke="#6b7280"
										tickLine={false}
										tickMargin={8}
										fontSize={10}
										tickFormatter={(v) => `$${v.toFixed(0)}`}
									/>
									<Tooltip
										contentStyle={{ backgroundColor: '#020617', borderColor: '#1f2937', borderRadius: 12 }}
										labelStyle={{ color: '#e5e7eb', fontSize: 12 }}
										formatter={(value) => [formatPrice(value * 100), 'Revenue']}
									/>
									<Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#revenueGradient)" />
									<defs>
										<linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
											<stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
										</linearGradient>
									</defs>
								</AreaChart>
							</ResponsiveContainer>
						) : (
							<div className="h-full flex items-center justify-center text-xs text-gray-500">
								No paid revenue in the last 14 days.
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="rounded-xl border border-white/10 bg-[#121212] overflow-hidden">
				<div className="p-4 border-b border-white/5 flex items-center justify-between gap-4">
					<div>
						<h3 className="text-base md:text-lg font-bold text-white tracking-tight">Clients</h3>
						<p className="text-xs md:text-sm text-gray-400">Last {Math.min(20, safeUsers.length)} signups with lifetime revenue</p>
					</div>
					<div className="flex flex-wrap gap-4 text-[11px] md:text-xs text-gray-300">
						<span>
							Clients: <span className="text-white font-semibold">{safeUsers.length}</span>
						</span>
						<span>
							Paying: <span className="text-emerald-400 font-semibold">{payingClientsCount}</span>
						</span>
						<span>
							Revenue:{' '}
							<span className="text-emerald-400 font-semibold">{formatPrice(totalClientRevenue || totalRevenue)}</span>
						</span>
					</div>
				</div>
				<div className="w-full text-[11px] md:text-xs uppercase tracking-[0.18em] text-gray-400 bg-black/40 border-b border-white/5 px-4 py-2 grid grid-cols-[1.4fr,1.8fr,1.4fr,1.2fr,0.9fr]">
					<span className="font-semibold">Name</span>
					<span className="font-semibold">Email</span>
					<span className="font-semibold">Joined</span>
					<span className="font-semibold">Revenue</span>
					<span className="text-right font-semibold">Role</span>
				</div>
				<div className="divide-y divide-white/5">
					{safeUsers.slice(0, 20).map((user) => {
						const userRevenueCents = revenueByUserId[user.id] || 0;
						const displayName =
							user.full_name || user.name || (user.email ? user.email.split('@')[0] : '—');
						return (
							<div
								key={user.id}
								className="grid grid-cols-[1.4fr,1.8fr,1.4fr,1.2fr,0.9fr] items-center px-4 py-3 text-xs md:text-sm gap-2 cursor-pointer hover:bg-white/[0.02]"
								onClick={() => handleClientClick(user)}
							>
								<div className="truncate text-white font-medium">{displayName}</div>
								<div className="truncate text-gray-300">{user.email}</div>
								<div className="text-[11px] text-gray-400">
									{user.created_at
											? new Date(user.created_at).toLocaleString(undefined, {
												month: '2-digit',
												day: '2-digit',
												year: '2-digit',
												hour: '2-digit',
												minute: '2-digit',
											})
											: '—'}
								</div>
								<div
									className={`font-mono text-[11px] ${
										userRevenueCents > 0 ? 'text-emerald-400' : 'text-gray-500'
									}`}
								>
									{formatPrice(userRevenueCents)}
								</div>
								<div className="flex justify-end">
									<span
										className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
											user.role === 'admin'
												? 'bg-purple-500/20 text-purple-300'
												: 'bg-gray-700/50 text-gray-400'
										}`}
									>
										{user.role || 'user'}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{selectedClient && (
				<Sheet open={clientSheetOpen} onOpenChange={setClientSheetOpen}>
					<SheetContent className="w-full sm:max-w-md bg-[#0b0b0b] border-l border-white/10 text-white">
						<SheetHeader>
							<SheetTitle className="flex items-center gap-2">
								<Users className="w-4 h-4 text-cyan-400" />
								<span>Client: {selectedClient.full_name || selectedClient.email}</span>
							</SheetTitle>
							<SheetDescription>
								ID: {selectedClient.id}
							</SheetDescription>
						</SheetHeader>
						<div className="mt-4 space-y-4">
							<div className="text-xs text-gray-400 space-y-1">
								<p>Email: <span className="text-gray-200">{selectedClient.email}</span></p>
								<p>
									Joined:{' '}
									<span className="text-gray-200">
										{selectedClient.created_at
												? new Date(selectedClient.created_at).toLocaleString()
												: '—'}
									</span>
								</p>
								<p>
									Lifetime revenue:{' '}
									<span className="text-emerald-400 font-semibold">
										{formatPrice(revenueByUserId[selectedClient.id] || 0)}
									</span>
								</p>
							</div>
							<div className="space-y-2">
								<Button
									className="w-full justify-start gap-2 bg-cyan-600 hover:bg-cyan-500 text-sm"
									onClick={handleViewOrders}
								>
									<ShoppingBag className="w-4 h-4" />
									View all orders & actions
								</Button>
								<Button
									variant="outline"
									className="w-full justify-start gap-2 text-sm border-white/20 hover:border-white/40"
									asChild
								>
									<a href={`mailto:${selectedClient.email}`}>
										<Mail className="w-4 h-4" /> Send email
									</a>
								</Button>
								<Button
									variant={selectedClient.is_blocked ? 'outline' : 'destructive'}
									className="w-full justify-start gap-2 text-sm"
									onClick={handleToggleBlock}
									disabled={blocking}
								>
									<Ban className="w-4 h-4" />
									{blocking
										? 'Updating...'
										: selectedClient.is_blocked
											? 'Unblock client'
											: 'Block client'}
								</Button>
							</div>
						</div>
					</SheetContent>
				</Sheet>
			)}
    </div>
  );
};

export default PlatformManagementTab;
