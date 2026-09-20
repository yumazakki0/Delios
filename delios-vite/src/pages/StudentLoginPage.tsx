import { useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound, LogIn, ShieldCheck, UserRoundPlus } from "lucide-react";
import { signInWithCustomToken, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import { readApiResponse } from "../lib/apiResponse";

function accountEmail(username: string) {
  return `${username.trim().toLocaleLowerCase("pt-BR")}@students.delios.local`;
}

export function StudentLoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "activate">("login");
  const [username, setUsername] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!auth) return setError("O Firebase ainda não foi configurado.");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, accountEmail(username), password);
      navigate("/ajuda", { replace: true });
    } catch {
      setError("Usuário ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleActivation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!auth) return setError("O Firebase ainda não foi configurado.");
    if (password.length < 8) return setError("Crie uma senha com pelo menos 8 caracteres.");
    setLoading(true);

    try {
      const response = await fetch("/api/student/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, activationCode, password }),
      });
      const data = await readApiResponse<{ customToken?: string; error?: string }>(response);
      if (!response.ok || !data.customToken) throw new Error(data.error ?? "Não foi possível ativar a conta.");
      await signInWithCustomToken(auth, data.customToken);
      navigate("/ajuda", { replace: true });
    } catch (activationError) {
      setError(activationError instanceof Error ? activationError.message : "Não foi possível ativar a conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="student-access-page">
      <section className="student-access-info">
        <span className="login-mark"><ShieldCheck /></span>
        <p className="eyebrow eyebrow-light">Identidade protegida</p>
        <h1>Um acesso individual, um espaço seguro.</h1>
        <p>Seu nome não aparece no atendimento comum. A direção poderá identificá-lo apenas em situações previstas pela escola, com justificativa registrada.</p>
        <ul>
          <li>Outros alunos nunca veem seu relato.</li>
          <li>A equipe recebe o conteúdo sem seu nome.</li>
          <li>O sistema não promete anonimato absoluto.</li>
        </ul>
      </section>

      <section className="student-access-card">
        <div className="access-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}><LogIn /> Entrar</button>
          <button className={mode === "activate" ? "active" : ""} onClick={() => { setMode("activate"); setError(""); }}><UserRoundPlus /> Primeiro acesso</button>
        </div>

        <p className="eyebrow">Acesso do estudante</p>
        <h2>{mode === "login" ? "Entre com sua conta" : "Ative sua conta"}</h2>
        <p>{mode === "login" ? "Use o nome de usuário entregue pela escola." : "Use o código individual recebido da escola e crie uma senha."}</p>

        {!isFirebaseConfigured && <div className="setup-warning"><KeyRound /><span>Adicione as variáveis do Firebase no arquivo .env.</span></div>}

        <form onSubmit={mode === "login" ? handleLogin : handleActivation}>
          <label><span>Nome de usuário</span><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required minLength={3} maxLength={32} placeholder="Ex.: gabriel.8b" /></label>
          {mode === "activate" && <label><span>Código de ativação</span><input value={activationCode} onChange={(event) => setActivationCode(event.target.value.toUpperCase())} autoComplete="one-time-code" required minLength={8} maxLength={16} placeholder="Código entregue pela escola" /></label>}
          <label><span>{mode === "login" ? "Senha" : "Crie uma senha"}</span><div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} placeholder="Mínimo de 8 caracteres" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary login-button" disabled={loading} type="submit">{loading ? "Aguarde…" : mode === "login" ? <><LogIn /> Entrar</> : <><KeyRound /> Ativar conta</>}</button>
        </form>

        <small>Se perdeu o código ou esqueceu o usuário, procure presencialmente a equipe responsável. Não envie dados pessoais por mensagem.</small>
      </section>
    </main>
  );
}
