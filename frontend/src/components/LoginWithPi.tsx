"use client";

import { useEffect, useState } from "react";
import { hasPiSDK, isPiBrowserUA } from "@/lib/isPi";
import { apiFetch } from "@/lib/api";
import { Button } from "./ui/button";
import { Loader2, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setAccessToken } from "@/lib/auth-token";
import { useAuth } from "@/context/AuthContext";

export default function LoginWithPi() {
  const { toast } = useToast();
  const { authUser, setAuth, logout } = useAuth();

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

      const scopes = ["username", "payments"];
      const onIncompletePaymentFound = (payment: any) => {
        (async () => {
          const res = await apiFetch(`/pi/payments/incomplete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ payment })
          });

          if (res.status == 'handled') {
            toast({
              title: "Uncompleted payment found",
              description: payment,
              variant: "destructive",
            });
          }
        })()
      };

      const authResult = await Pi.authenticate(scopes, onIncompletePaymentFound);

      const { nonce } = await apiFetch("/auth/pi/start", {
        method: "POST",
      });

      const { accessToken, username, role } = await apiFetch("/auth/pi/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nonce, authResult }),
      });

      setAuth(accessToken, authResult.accessToken, username, authResult.user, role);
      setAccessToken(accessToken);

      toast({
        title: "Login Successful!",
        description: `Authenticated as ${username}.`,
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
      {!authUser ? <Button
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
      </Button> : <Button onClick={logout}>
        Log out
      </Button>}
    </div>
  );
}
