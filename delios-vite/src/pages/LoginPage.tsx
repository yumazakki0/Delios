import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, LogIn } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadyAuthenticated, setAlreadyAuthenticated] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!supabase) return setError("Configure o Supabase antes de usar a área administrativa.");

    setLoading(true);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError || !data.user) {
      setLoading(false);
      setError("E-mail ou senha inválidos.");
      return;
    }

    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profileError || profile?.role !== "admin") {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Esta conta não possui permissão administrativa.");
      return;
    }

    setAlreadyAuthenticated(true);
    navigate("/admin", { replace: true });
  }

  if (alreadyAuthenticated) return <Navigate to="/admin" replace />;

  return (
    <main className="login-page">
      <section className="login-info">
        <div className="login-mark"><LockKeyhole /></div>
        <p className="eyebrow eyebrow-light">Acesso restrito</p>
        <h1>Área da equipe responsável.</h1>
        <p>Somente contas autorizadas pela escola podem consultar e acompanhar os relatos.</p>
        <div className="security-points"><span><LockKeyhole /> Sessão protegida pelo Supabase Auth</span><span><EyeOff /> Nenhum relato é público</span></div>
      </section>

      <section className="login-card">
        <p className="eyebrow">Entrar</p><h2>Painel administrativo</h2><p>Use o e-mail e a senha cadastrados pela direção.</p>
        {!isSupabaseConfigured && <div className="setup-warning"><LockKeyhole /><span>Adicione as variáveis do Supabase no arquivo .env.</span></div>}
        <form onSubmit={handleLogin}>
          <label><span>E-mail</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required placeholder="equipe@escola.com" /></label>
          <label><span>Senha</span><div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required minLength={8} placeholder="••••••••" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary login-button" disabled={loading} type="submit">{loading ? "Entrando…" : <>Entrar no painel <LogIn /></>}</button>
        </form>
        <small>Não existe cadastro público de administradores. As contas são criadas diretamente no Supabase pela direção.</small>
      </section>
    </main>
  );
}
