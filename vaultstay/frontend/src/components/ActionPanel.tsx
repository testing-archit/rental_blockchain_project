import { useState } from "react";
import { useAccount } from "wagmi";
import {
  useFundRental,
  useActivateRental,
  useConfirmCompletion,
  useCancelRental,
  useRaiseDispute,
} from "../hooks/useVaultStay";
import { formatEther } from "viem";
import type { Rental } from "../lib/types";
import { Loader2, AlertCircle } from "lucide-react";

interface ActionPanelProps {
  rental: Rental;
  onTxSuccess?: () => void;
}

export function ActionPanel({ rental, onTxSuccess }: ActionPanelProps) {
  const { address } = useAccount();
  const { fund, isConfirming: isFunding } = useFundRental();
  const { activate, isConfirming: isActivating } = useActivateRental();
  const { confirm, isConfirming: isConfirmingCompletion } = useConfirmCompletion();
  const { cancel, isConfirming: isCancelling } = useCancelRental();
  const { dispute, isConfirming: isDisputing } = useRaiseDispute();

  const [txError, setTxError] = useState<string | null>(null);
  const [txPending, setTxPending] = useState(false);

  const handleTx = async (txFn: () => Promise<unknown>) => {
    setTxError(null);
    setTxPending(true);
    try {
      await txFn();
      onTxSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setTxError(msg.split("\n")[0].slice(0, 180));
    } finally {
      setTxPending(false);
    }
  };

  if (!address) {
    return (
      <div className="p-6 border-t border-border text-center">
        <p className="text-muted text-sm">Connect your wallet to interact with this rental.</p>
      </div>
    );
  }

  const isLandlord = rental.landlord.toLowerCase() === address.toLowerCase();
  const isTenant =
    rental.tenant !== "0x0000000000000000000000000000000000000000" &&
    rental.tenant.toLowerCase() === address.toLowerCase();
  const isNobody = !isLandlord && !isTenant;
  const state = rental.state;

  const totalWei = rental.rentAmount + rental.depositAmount;
  const totalEth = formatEther(totalWei);

  const isAnyPending = isFunding || isActivating || isConfirmingCompletion || isCancelling || isDisputing || txPending;

  return (
    <div className="p-6 border-t border-border flex flex-col space-y-4">
      {/* Error Banner */}
      {txError && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span className="break-words">{txError}</span>
        </div>
      )}

      {/* Loading indicator */}
      {isAnyPending && (
        <div className="flex items-center justify-center gap-2 py-2 text-accent text-sm">
          <Loader2 size={16} className="animate-spin" />
          <span>Transaction pending on-chain...</span>
        </div>
      )}

      {/* STATE 0: CREATED */}
      {state === 0 && !isAnyPending && (
        <>
          {!isLandlord && (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted">
                Total Required: <span className="text-text font-mono font-bold">{totalEth} ETH</span> (Rent + Deposit)
              </p>
              <button
                onClick={() => handleTx(() => fund(rental.id, totalEth))}
                disabled={isFunding}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
              >
                💰 Fund Escrow & Book Property
              </button>
            </div>
          )}
          {isLandlord && (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted">Waiting for a tenant to fund the escrow.</p>
              <button
                onClick={() => handleTx(() => cancel(rental.id))}
                disabled={isCancelling}
                className="btn-danger w-full py-3"
              >
                Cancel Listing
              </button>
            </div>
          )}
        </>
      )}

      {/* STATE 1: FUNDED */}
      {state === 1 && !isAnyPending && (
        <>
          {isLandlord && (
            <div className="text-center space-y-3">
              <p className="text-sm text-accent2 font-medium">
                ✅ Escrow Funded! Activate when tenant is ready to check in.
              </p>
              <button
                onClick={() => handleTx(() => activate(rental.id))}
                disabled={isActivating}
                className="w-full py-3.5 bg-accent2 hover:bg-accent2/90 text-background font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,212,170,0.3)] flex items-center justify-center gap-2"
              >
                🔑 Activate Rental
              </button>
              <button
                onClick={() => handleTx(() => cancel(rental.id))}
                disabled={isCancelling}
                className="btn-danger w-full py-2 text-sm"
              >
                Cancel & Refund Tenant
              </button>
            </div>
          )}
          {isTenant && (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted">You have funded the escrow. Waiting for landlord to activate.</p>
              <button
                onClick={() => handleTx(() => cancel(rental.id))}
                disabled={isCancelling}
                className="btn-danger w-full py-3"
              >
                Cancel & Get Refund
              </button>
            </div>
          )}
          {isNobody && (
            <p className="text-sm text-center text-muted">This rental has been booked and is awaiting activation.</p>
          )}
        </>
      )}

      {/* STATE 2: ACTIVE */}
      {state === 2 && (isLandlord || isTenant) && !isAnyPending && (
        <div className="space-y-3">
          <p className="text-sm text-center text-muted">
            Rental is active. Both parties must confirm completion to release funds.
          </p>

          {(rental.landlordConfirmed || rental.tenantConfirmed) && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning text-center">
              ⏳ Waiting for the other party to confirm to release payout.
              {rental.landlordConfirmed && " (Landlord confirmed)"}
              {rental.tenantConfirmed && " (Tenant confirmed)"}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => handleTx(() => confirm(rental.id))}
              disabled={
                isConfirmingCompletion ||
                (isLandlord && rental.landlordConfirmed) ||
                (isTenant && rental.tenantConfirmed)
              }
              className="btn-success flex-1 py-3 flex items-center justify-center gap-1.5 text-sm"
            >
              {(isLandlord && rental.landlordConfirmed) || (isTenant && rental.tenantConfirmed)
                ? "✓ Confirmed"
                : "Confirm Completion"}
            </button>
            <button
              onClick={() => handleTx(() => dispute(rental.id))}
              disabled={isDisputing}
              className="flex-1 py-3 border border-warning text-warning hover:bg-warning/10 font-bold rounded-xl transition-all text-sm disabled:opacity-50"
            >
              ⚖️ Raise Dispute
            </button>
          </div>
        </div>
      )}

      {state === 2 && isNobody && !isAnyPending && (
        <p className="text-sm text-center text-muted">This rental is currently active.</p>
      )}

      {/* STATES 3, 4, 5: Terminal */}
      {state >= 3 && !isAnyPending && (
        <div className="text-center py-2">
          <p className="text-sm text-muted">No further actions available.</p>
        </div>
      )}
    </div>
  );
}
