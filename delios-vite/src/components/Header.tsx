import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowRight, LockKeyhole, Menu, X } from "lucide-react";

export function Header() {
  const [open, setOpen] = useState(false);

  const quickExit = () => {
    document.title = "Pesquisa escolar";
    window.location.replace("https://www.google.com/");
  };

  return (
    <header className="site-header">
      <Link className="brand" to="/" onClick={() => setOpen(false)}>
        <span className="brand-mark" aria-hidden="true">D</span>
        <span>Délios</span>
      </Link>

      <nav className={open ? "main-nav nav-open" : "main-nav"} aria-label="Navegação principal">
        <NavLink to="/" onClick={() => setOpen(false)}>Início</NavLink>
        <NavLink to="/ajuda" onClick={() => setOpen(false)}>Pedir ajuda</NavLink>
        <NavLink to="/login" onClick={() => setOpen(false)}><LockKeyhole /> Área da equipe</NavLink>
      </nav>

      <div className="header-actions">
        <Link className="button button-primary header-help" to="/ajuda">
          Pedir ajuda <ArrowRight />
        </Link>
        <button className="button button-ghost quick-exit" onClick={quickExit} aria-label="Sair rapidamente">
          <X /> <span>Sair rápido</span>
        </button>
        <button className="button icon-button menu-button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Fechar menu" : "Abrir menu"}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
