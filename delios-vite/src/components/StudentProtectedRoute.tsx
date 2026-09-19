import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Navigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";

export function StudentProtectedRoute({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    if (!auth || !db) {
      setState("denied");
      return;
    }

    const firebaseAuth = auth;
    const firestore = db;
    let active = true;
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        if (active) setState("denied");
        return;
      }

      try {
        const student = await getDoc(doc(firestore, "students", user.uid));
        if (active) setState(student.exists() && student.data().active === true ? "allowed" : "denied");
      } catch {
        if (active) setState("denied");
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (state === "checking") return <main className="center-page"><div className="loader" /><p>Confirmando seu acesso…</p></main>;
  if (state === "denied") return <Navigate to="/aluno" replace />;
  return children;
}
