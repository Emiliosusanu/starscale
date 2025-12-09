import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  Package,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  ArrowRight,
  Truck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatPrice, cn, playNotificationSound } from "@/lib/utils";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";

const PaymentBadge = ({ status }) => {
  const config = {
    paid: {
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      icon: ShieldCheck,
      text: "Paid",
    },
    unpaid: {
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      icon: Clock,
      text: "Pending",
    },
    refunded: {
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      icon: RefreshCw,
      text: "Refunded",
    },
    default: {
      color: "text-gray-400 bg-gray-500/10 border-gray-500/20",
      icon: CreditCard,
      text: status,
    },
  };
  const { color, icon: Icon, text } = config[status] || config.default;

  return (
    <span
      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold border ${color}`}
    >
      <Icon className="w-3 h-3" /> {text}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    completed: { color: "text-emerald-400", text: "Completed" },
    processing: { color: "text-blue-400", text: "Processing" },
    pending: { color: "text-amber-400", text: "Pending" },
    shipped: { color: "text-purple-400", text: "Shipped" },
    delivered: { color: "text-emerald-400", text: "Delivered" },
    cancelled: { color: "text-rose-400", text: "Cancelled" },
    default: { color: "text-gray-400", text: status },
  };
  const { color, text } = config[status] || config.default;
  return (
    <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>
      {text}
    </span>
  );
};

const OrderCommentsList = ({ comments }) => {
  if (!comments || comments.length === 0) return null;
  return (
    <div className="mt-4 bg-white/5 rounded-lg p-4 border border-white/5">
      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <MessageSquare className="w-3 h-3" /> Updates from Support
      </h5>
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 text-sm">
            <div
              className={cn(
                "w-1 rounded-full self-stretch shrink-0",
                comment.is_read
                  ? "bg-gray-700"
                  : "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
              )}
            />
            <div>
              <p className="text-gray-200">{comment.comment}</p>
              <p className="text-[10px] text-gray-500 mt-1">
                {new Date(comment.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OrdersTab = ({ orders, loading, highlightedOrderId }) => {
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const { profile, user } = useAuth();
  const [trackingData, setTrackingData] = useState({});
  const { toast } = useToast();
  const rowRefs = useRef({});

  const fetchTracking = useCallback(async (orderId) => {
    const { data, error } = await supabase
      .from("order_tracking")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching tracking:", error);
    } else {
      setTrackingData((prev) => ({ ...prev, [orderId]: data || [] }));
    }
  }, []);

  const markCommentsAsRead = useCallback(
    async (orderId) => {
      const unreadComments = orders
        .find((o) => o.id === orderId)
        ?.order_comments?.filter((c) => !c.is_read);
      if (!unreadComments || unreadComments.length === 0) return;

      const { error } = await supabase
        .from("order_comments")
        .update({ is_read: true })
        .eq("order_id", orderId)
        .eq("is_read", false);

      if (error) {
        console.error("Error marking comments as read:", error);
      }
    },
    [orders]
  );

  const toggleOrder = useCallback(
    (orderId) => {
      const isExpanding = expandedOrderId !== orderId;
      setExpandedOrderId(isExpanding ? orderId : null);

      if (isExpanding) {
        fetchTracking(orderId);
        markCommentsAsRead(orderId);
      }
    },
    [expandedOrderId, fetchTracking, markCommentsAsRead]
  );

  // Handle smart nav scrolling - only run once per highlightedOrderId change
  const processedHighlight = useRef(null);

  useEffect(() => {
    if (
      highlightedOrderId &&
      !loading &&
      orders.length > 0 &&
      processedHighlight.current !== highlightedOrderId
    ) {
      const targetOrder = orders.find((o) => o.id === highlightedOrderId);
      if (targetOrder) {
        processedHighlight.current = highlightedOrderId;

        // Expand the order
        setExpandedOrderId(highlightedOrderId);
        fetchTracking(highlightedOrderId);
        markCommentsAsRead(highlightedOrderId);

        // Scroll to it
        if (rowRefs.current[highlightedOrderId]) {
          setTimeout(() => {
            rowRefs.current[highlightedOrderId].scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 300);
        }
      }
    }
  }, [highlightedOrderId, loading, orders, fetchTracking, markCommentsAsRead]);

  const getUnreadCount = (order) => {
    return order.order_comments?.filter((c) => !c.is_read).length || 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
        <Package className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
        <p className="text-gray-400 text-sm mb-4">
          You haven't placed any orders yet.
        </p>
        <Button
          variant="outline"
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          asChild
        >
          <Link to="/store">Browse Store</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-white/10 bg-[#121212] overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-white/5 border-b border-white/5">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="text-gray-400 text-xs uppercase tracking-wider h-12 w-[140px]">
                Order ID
              </TableHead>
              <TableHead className="text-gray-400 text-xs uppercase tracking-wider h-12">
                Product / Service
              </TableHead>
              <TableHead className="text-gray-400 text-xs uppercase tracking-wider h-12">
                Status
              </TableHead>
              <TableHead className="text-gray-400 text-xs uppercase tracking-wider h-12 text-right">
                Amount
              </TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const unread = getUnreadCount(order);
              const isHighlighted = highlightedOrderId === order.id;
              return (
                <React.Fragment key={order.id}>
                  <TableRow
                    ref={(el) => (rowRefs.current[order.id] = el)}
                    className={`border-b border-white/5 cursor-pointer transition-all duration-200 ${
                      expandedOrderId === order.id
                        ? "bg-white/[0.02]"
                        : "hover:bg-white/[0.02]"
                    } ${
                      isHighlighted
                        ? "bg-cyan-500/5 border-l-2 border-l-cyan-500"
                        : ""
                    }`}
                    onClick={() => toggleOrder(order.id)}
                  >
                    <TableCell className="py-4 font-medium relative">
                      {unread > 0 && (
                        <span
                          className="absolute top-3 left-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                          title={`${unread} new messages`}
                        />
                      )}
                      <div className="flex flex-col ml-2">
                        <span className="font-mono text-white text-sm">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] text-gray-500 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-200 font-medium truncate max-w-[250px]">
                          {order.items?.[0]?.product_title ||
                            order.product_url ||
                            "Service Package"}
                        </span>
                        {order.items?.length > 1 && (
                          <span className="text-[10px] text-gray-500">
                            +{order.items.length - 1} other items
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <StatusBadge status={order.status} />
                        <PaymentBadge status={order.payment_status} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4 font-mono text-sm text-white font-bold tracking-tight">
                      {formatPrice(order.total_cost)}
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      {order.payment_status === "unpaid" ? (
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-8 px-3 text-xs"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link to={`/order/${order.id}`}>Pay Now</Link>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrder(order.id);
                          }}
                        >
                          {expandedOrderId === order.id ? (
                            <ChevronUp className="h-4 w-4 text-cyan-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedOrderId === order.id && (
                    <TableRow className="bg-[#080808] border-b border-white/5 hover:bg-[#080808]">
                      <TableCell colSpan={5} className="p-0">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-4">
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Order Details
                              </h4>
                              <div className="bg-white/5 rounded-lg border border-white/5 divide-y divide-white/5">
                                {order.items?.map((item, i) => (
                                  <div
                                    key={i}
                                    className="flex justify-between items-center p-3 text-sm"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded bg-gray-800 flex items-center justify-center text-gray-500">
                                        <Package className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-gray-200">
                                          {item.product_title}
                                        </p>
                                        {item.variant_title && (
                                          <p className="text-xs text-gray-500">
                                            {item.variant_title}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-gray-300">
                                        {item.quantity}x
                                      </p>
                                      <p className="text-white font-mono">
                                        {formatPrice(item.price_in_cents)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {trackingData[order.id]?.length > 0 && (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                  <h5 className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center">
                                    <Truck className="w-3 h-3 mr-2" /> Tracking
                                    Information
                                  </h5>
                                  {trackingData[order.id].map((t) => (
                                    <div
                                      key={t.id}
                                      className="flex justify-between items-center text-sm text-gray-300"
                                    >
                                      <span>{t.sheet_name || t.carrier}</span>
                                      {t.sheet_url ? (
                                        <a
                                          href={t.sheet_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-xs text-cyan-300 hover:text-cyan-200 underline"
                                        >
                                          Open Sheet
                                        </a>
                                      ) : (
                                        <span className="font-mono text-white">
                                          {t.tracking_number}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Comments / Updates Section */}
                              <OrderCommentsList
                                comments={order.order_comments}
                              />
                            </div>

                            <div className="space-y-6 border-l border-white/5 pl-6 md:pl-8">
                              <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                  Quick Actions
                                </h4>
                                <div className="space-y-2">
                                  {order.payment_status === "unpaid" && (
                                    <Button
                                      className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
                                      asChild
                                    >
                                      <Link to={`/order/${order.id}`}>
                                        Complete Payment{" "}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                      </Link>
                                    </Button>
                                  )}
                                  {order.product_url && (
                                    <a
                                      href={order.product_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center justify-center w-full px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-sm text-cyan-400 border border-white/10 transition-colors"
                                    >
                                      Open Product Link{" "}
                                      <ExternalLink className="w-3 h-3 ml-2" />
                                    </a>
                                  )}
                                  <Button
                                    variant="outline"
                                    className="w-full border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                                    asChild
                                  >
                                    <Link
                                      to={`/dashboard?tab=support&order_id=${order.id}`}
                                    >
                                      Contact Support
                                    </Link>
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                  Summary
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(order.total_cost)}</span>
                                  </div>
                                  <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10 mt-2">
                                    <span>Total</span>
                                    <span>{formatPrice(order.total_cost)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => {
          const unread = getUnreadCount(order);
          const isHighlighted = highlightedOrderId === order.id;
          return (
            <div
              key={order.id}
              ref={(el) => (rowRefs.current[order.id] = el)}
              className={`bg-[#121212] border rounded-xl overflow-hidden shadow-lg relative transition-colors duration-300 ${
                isHighlighted
                  ? "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "border-white/10"
              }`}
            >
              {unread > 0 && (
                <div className="absolute top-3 left-3 z-10 w-3 h-3 bg-red-500 rounded-full animate-pulse ring-2 ring-[#121212]" />
              )}
              <div className="p-4" onClick={() => toggleOrder(order.id)}>
                <div className="flex justify-between items-start mb-3 pl-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white line-clamp-1">
                      {order.items?.[0]?.product_title || "Order"}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-white">
                      {formatPrice(order.total_cost)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3 pl-3">
                  <div className="flex gap-2">
                    <StatusBadge status={order.status} />
                    <PaymentBadge status={order.payment_status} />
                  </div>

                  {order.payment_status === "unpaid" ? (
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-amber-500 text-black font-bold hover:bg-amber-600"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link to={`/order/${order.id}`}>Pay Now</Link>
                    </Button>
                  ) : (
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        expandedOrderId === order.id ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedOrderId === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-[#0A0A0A] border-t border-white/5"
                  >
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        {order.items?.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between text-sm py-2 border-b border-white/5 last:border-0"
                          >
                            <span className="text-gray-300">
                              {item.quantity}x {item.product_title}
                            </span>
                            <span className="text-white font-mono">
                              {formatPrice(item.price_in_cents)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {trackingData[order.id]?.length > 0 && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
                          <h5 className="text-xs font-bold text-blue-400 uppercase mb-2">
                            Tracking
                          </h5>
                          {trackingData[order.id].map((t) => (
                            <div key={t.id} className="flex justify-between items-center">
                              <span className="text-gray-300">{t.sheet_name || t.carrier}</span>
                              {t.sheet_url ? (
                                <a
                                  href={t.sheet_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-cyan-300 hover:text-cyan-200 underline"
                                >
                                  Open Sheet
                                </a>
                              ) : (
                                <span className="font-mono text-white">
                                  {t.tracking_number}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <OrderCommentsList comments={order.order_comments} />

                      {order.payment_status === "unpaid" && (
                        <Button
                          size="sm"
                          className="w-full bg-amber-500 text-black font-bold"
                          asChild
                        >
                          <Link to={`/order/${order.id}`}>
                            Complete Payment
                          </Link>
                        </Button>
                      )}

                      {order.product_url && (
                        <a
                          href={order.product_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center w-full px-4 py-2 rounded-md bg-white/5 text-xs text-cyan-400 border border-white/10"
                        >
                          Open Product Link{" "}
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersTab;
