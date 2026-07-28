"use client";

import { useEffect, useState } from "react";
import { hasPiSDK, isPiBrowserUA } from "@/lib/isPi";
import { apiFetch } from "@/lib/api";
import { Button } from "./ui/button";
import { Loader2, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { savePpxToken, savePpxUser, useAuth } from "@/context/AuthContext";

export default function LoginWithPi() {
  const { toast } = useToast();
  const { ppxUser, setPpxUser, setPpxToken, logout } = useAuth();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && window.Pi) {
        // alert("Pi SDK Loaded")
        toast({
          title: "Pi SDK Loaded",
          description: "The Pi SDK was successfully loaded.",
          variant: "success",
          duration: 3000
        });

        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  async function onLogin() {
    try {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === "development") {
        setPpxToken("test_token");
        savePpxToken("test_token");
        setPpxUser({ id: "1", username: "superadmin", role: "superadmin" });
        savePpxUser({ id: "1", username: "superadmin", role: "superadmin" });
        // _ppxUser = { id: "3", username: "dev_user", role: "user" };
        return;
      }

      if (!window?.Pi) {
        alert("Pi SDK NOT LOADED!");
        toast({
          title: "Pi SDK NOT LOADED",
          description: "Please open this page in Pi Browser. The Pi SDK isn't available here.",
          variant: "destructive",
        });
        return
      }

      const Pi: any = window.Pi;

      if (!isPiBrowserUA() || !hasPiSDK()) {
        toast({
          title: "Pi Browser Required",
          description: "Please open this page in Pi Browser to log in. The Pi SDK isn't available here.",
          variant: "destructive",
        });
        return; // don’t try to use window.Pi
      }

      if (!Pi.isPiWalletActivated && false) {
        toast({
          title: "Wallet Activation Required",
          description: "Please activate your Pi Wallet before continuing.",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      // wallet_address lets A2U payouts reach this user by uid — without it Pi
      // refuses ("User hasn't authorized wallet_address scope").
      const scopes = ["username", "payments", "wallet_address"];
      // Buffered: this fires inside authenticate(), before we hold the Pi access
      // token that /pi/payments/incomplete authenticates against.
      let danglingPayment: any;
      const onIncompletePaymentFound = (payment: any) => {
        danglingPayment = payment;
      };

      const authResult = await Pi.authenticate(scopes, onIncompletePaymentFound);

      if (danglingPayment && authResult?.accessToken) {
        const res = await apiFetch<{ status?: string }>(`/pi/payments/incomplete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authResult.accessToken}`,
          },
          body: JSON.stringify({ payment: danglingPayment }),
        });

        if (res.status === "handled") {
          toast({
            title: "Uncompleted payment found",
            description: "A previous payment is still pending.",
            variant: "destructive",
          });
        }
      }

      const { ppx_token, ppx_user } = await apiFetch("/auth/pi/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ authResult }),
      });

      setPpxToken(ppx_token);
      savePpxToken(ppx_token);
      setPpxUser(ppx_user);
      savePpxUser(ppx_user);

      toast({
        title: "Login Successful!",
        description: `Authenticated as ${ppx_user.username}.`,
        variant: "success"
      });

    } catch (err: any) {
      console.error(err);
      toast({
        title: "Login Failed",
        description: err?.message ?? "An error occurred. Please try again in Pi Browser.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {!ppxUser ? <Button
        variant='ghost'
        onClick={onLogin}
        disabled={loading}
        className="text-primary"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="mr-2 h-4 w-4" />
        )}
        {loading ? "Connecting…" : "Login with Pi"}
      </Button> : <Button
        variant="ghost"
        onClick={logout}
        className="text-muted-foreground hover:text-foreground"
      >
        Log out
      </Button>}
    </div>
  );
}
