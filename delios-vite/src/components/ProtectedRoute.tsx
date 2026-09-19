import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    let active = true;

    async function verify() {
      if (!supabase) {
        if (active) setState("denied");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        if (active) setState("denied");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (active) setState(!error && data?.role === "admin" ? "allowed" : "denied");
    }

    void verify();
    return () => { active = false; };
  }, []);

  if (state === "checking") return <main className="center-page"><div className="loader" /><p>Verificando acesso…</p></main>;
  if (state === "denied") return <Navigate to="/login" replace />;
  return children;
}
