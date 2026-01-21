import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { Ticket, TicketCheck, TicketSlash, AlertCircle } from "lucide-react";
import { RedeemedTransferBalanceCode, SubscriptionBalanceResponse } from "../services/types";
import { fetchNetworkTransferBalanceCodes, fetchSubscriptionBalance } from "../services/api";
import RedeemTransferBalanceCodeModal from "./RedeemTransferBalanceCodeModal";
import { maskSecret, formatDate, formatDataBalance } from "../utils/balanceCodeUtils";

const COLOR_CLASSES = {
  iconBg: "p-2 bg-gradient-to-r from-emerald-600 to-emerald-600 rounded-xl",
  headerBg: "bg-gradient-to-r from-emerald-600 to-emerald-600 px-6 py-4 border-b border-gray-600",
  headerText: "text-emerald-100 text-sm mt-1",
  buttonBg: "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 hover:shadow-lg transform hover:scale-[1.02]",
} as const;

const BalanceCodesSection: React.FC = () => {
    const { token } = useAuth();
    const [transferBalanceCodes, setTransferBalanceCodes] = useState<RedeemedTransferBalanceCode[]>([]);
    const [isAddTransferBalanceCodeModalOpen, setIsAddTransferBalanceCodeModalOpen] = useState(false);
    const [isLoadingTransferBalanceCodes, setIsLoadingTransferBalanceCodes] = useState(true);
    const [isLoadingSubscriptionBalance, setIsLoadingSubscriptionBalance] = useState(true);
    const [subscriptionBalance, setSubscriptionBalance] = useState<SubscriptionBalanceResponse | null>(null);
    const [balanceCodesError, setBalanceCodesError] = useState<string | null>(null);
    const [subscriptionBalanceError, setSubscriptionBalanceError] = useState<string | null>(null);

    const loadTransferBalanceCodes = useCallback(async () => {
        if (!token) {
            setIsLoadingTransferBalanceCodes(false);
            return;
        }

        setIsLoadingTransferBalanceCodes(true);
        setBalanceCodesError(null);

        try {
            const response = await fetchNetworkTransferBalanceCodes(token);
            if (response.error?.message) {
              setBalanceCodesError(response.error.message);
              setTransferBalanceCodes([]);
            } else if (response.balance_codes) {
              setTransferBalanceCodes(response.balance_codes);
            }
        } catch (error) {
            console.error('Failed to fetch network transfer balance codes:', error);
            setBalanceCodesError(error instanceof Error ? error.message : 'Failed to load balance codes');
            setTransferBalanceCodes([]);
        } finally {
            setIsLoadingTransferBalanceCodes(false);
        }
    }, [token]);

    const loadSubscriptionBalance = useCallback(async () => {
      if (!token) {
        setIsLoadingSubscriptionBalance(false);
        return;
      }

      setIsLoadingSubscriptionBalance(true);
      setSubscriptionBalanceError(null);

      try {
        const response = await fetchSubscriptionBalance(token);
        if (response.error?.message) {
          setSubscriptionBalanceError(response.error.message);
          setSubscriptionBalance(null);
        } else {
          setSubscriptionBalance(response);
        }
      } catch (error) {
        console.error('Failed to fetch subscription balance:', error);
        setSubscriptionBalanceError(error instanceof Error ? error.message : 'Failed to load subscription balance');
        setSubscriptionBalance(null);
      } finally {
        setIsLoadingSubscriptionBalance(false);
      }
    }, [token]);

    useEffect(() => {
      loadTransferBalanceCodes();
      loadSubscriptionBalance();
    }, [token, loadTransferBalanceCodes, loadSubscriptionBalance]);

    const reloadAllData = useCallback(() => {
      loadTransferBalanceCodes();
      loadSubscriptionBalance();
    }, [loadTransferBalanceCodes, loadSubscriptionBalance]);

    const isLoading = useMemo(() => {
      return isLoadingTransferBalanceCodes || isLoadingSubscriptionBalance;
    }, [isLoadingTransferBalanceCodes, isLoadingSubscriptionBalance]);

    return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-staggerFadeUp" style={{ animationDelay: '0.05s' }}>
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className={COLOR_CLASSES.iconBg}>
              <Ticket className="text-white" size={28} />
            </div>
            Balance Codes
          </h2>
          <p className="text-gray-400 mt-2">
            Manage your account balance codes for more data.
          </p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700 animate-staggerFadeUp" style={{ animationDelay: '0.1s' }}>
        <div className={COLOR_CLASSES.headerBg}>
          <div className="flex items-center gap-3">
            <TicketCheck size={20} className="text-white" />
            <div>
              <h3 className="font-medium text-white">Account Transfer Balance Codes</h3>
              <p className={COLOR_CLASSES.headerText}>Redeem a transfer balance code to add data to your account.</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-700">
          <p className="flex items-center gap-2">
            <span>Total Data Balance:</span>
            <span className="font-semibold">
              {isLoadingSubscriptionBalance
                ? "Loading..."
                : subscriptionBalanceError
                  ? (
                    <span className="flex items-center gap-1 text-red-400 text-sm">
                      <AlertCircle size={14} />
                      Error loading balance
                    </span>
                  )
                  : subscriptionBalance
                    ? formatDataBalance(subscriptionBalance.balance_byte_count)
                    : "-"
              }
            </span>
          </p>
        </div>

        {balanceCodesError ? (
          <div className="p-6">
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-red-300 font-medium mb-1">Error Loading Balance Codes</h4>
                <p className="text-red-200 text-sm">{balanceCodesError}</p>
              </div>
            </div>
          </div>
        ) : transferBalanceCodes.length > 0 ? (
          <div className="max-h-80 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-700" role="table" aria-label="Balance codes history">
            <thead className="bg-gray-900 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Secret</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Redeemed</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Valid Until</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
                {transferBalanceCodes.map((code) => (
                <tr key={code.balance_code_id}>
                  <td className="px-6 py-4 whitespace-nowrap">{maskSecret(code.secret)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {typeof code.balance_byte_count === "number" && !isNaN(code.balance_byte_count)
                      ? `+${formatDataBalance(code.balance_byte_count)}`
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(code.redeem_time)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(code.end_time)}</td>
                </tr>
                ))}
            </tbody>
            </table>
          </div>
        ) : isLoadingTransferBalanceCodes ? (
          <div className="p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <TicketCheck className="text-gray-500" size={24} />
              </div>
              <p className="text-gray-400">Loading balance codes...</p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <TicketSlash className="text-gray-500" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-200 mb-2">No Transfer Balance Codes Redeemed</h3>
              <p className="text-gray-400 italic">No transfer balance codes found for your network.</p>
            </div>
          </div>
        )}

        <div className="p-6">
          <button
              onClick={() => setIsAddTransferBalanceCodeModalOpen(true)}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-all duration-200 ${
              isLoading
                  ? 'bg-gray-600 cursor-not-allowed border border-gray-600 text-gray-400'
                  : COLOR_CLASSES.buttonBg
              }`}
          >
              <TicketCheck size={20} />
              <span>Redeem Transfer Balance Code</span>
          </button>
        </div>
      </div>

      <RedeemTransferBalanceCodeModal
        isOpen={isAddTransferBalanceCodeModalOpen}
        onClose={() => setIsAddTransferBalanceCodeModalOpen(false)}
        onSuccess={reloadAllData}
      />
    </div>
    )

}
export default BalanceCodesSection;
