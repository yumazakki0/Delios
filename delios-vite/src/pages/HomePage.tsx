import { Link } from "react-router-dom";
import { ArrowRight, CircleHelp, EyeOff, Home, MessageCircle, Shield, Users, Wifi } from "lucide-react";

const situations = [
  { icon: MessageCircle, title: "Estão mexendo comigo", text: "Xingamentos, piadas, humilhações ou provocações repetidas." },
  { icon: Users, title: "Estou sendo excluído", text: "Estão me deixando de fora ou usando o grupo para me isolar." },
  { icon: Wifi, title: "Aconteceu na internet", text: "Mensagens, boatos, imagens, perfis ou grupos estão me incomodando." },
  { icon: Home, title: "Algo em casa me preocupa", text: "Não sei com quem conversar sobre uma situação fora da escola." },
  { icon: Shield, title: "Tenho medo de alguém", text: "Uma pessoa está me pressionando, ameaçando ou causando medo." },
  { icon: CircleHelp, title: "Não sei explicar", text: "Só sei que alguma coisa não está bem e quero ser ouvido." },
];

export function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Apoio escolar, sem julgamentos</p>
          <h1>Você não precisa enfrentar tudo sozinho.</h1>
          <p className="hero-lead">Conte o que está acontecendo do seu jeito. Você escolhe se quer informar seu nome, ano e turma.</p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" to="/ajuda">Fazer um relato <ArrowRight /></Link>
            <a className="button button-outline button-large" href="#entenda">Entender situações</a>
          </div>
          <div className="privacy-line"><EyeOff /><span>O relato pode ser anônimo e não fica visível para outros alunos.</span></div>
        </div>

        <div className="hero-panel">
          <div className="panel-heading"><span>01</span><div><small>Comece por aqui</small><h2>O que está acontecendo?</h2></div></div>
          <div className="quick-grid">
            {situations.slice(0, 4).map(({ icon: Icon, title, text }) => (
              <Link className="quick-card" to="/ajuda" key={title}>
                <span className="quick-icon"><Icon /></span>
                <span><strong>{title}</strong><small>{text}</small></span>
                <ArrowRight />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="promise-strip">
        <span>Você escolhe o que informar</span>
        <span>Acesso restrito à equipe autorizada</span>
        <span>O próximo passo pode ser simples</span>
      </section>

      <section className="content-section" id="entenda">
        <div className="section-heading">
          <div><p className="eyebrow">Entenda a situação</p><h2>Não é preciso ter certeza para pedir ajuda.</h2></div>
          <p>Se alguma coisa causa medo, vergonha, desconforto ou faz você evitar pessoas e lugares, vale conversar com alguém.</p>
        </div>
        <div className="situation-grid">
          {situations.map(({ icon: Icon, title, text }, index) => (
            <article className="situation-card" key={title}>
              <div><span className="situation-icon"><Icon /></span><small>0{index + 1}</small></div>
              <h3>{title}</h3><p>{text}</p>
              <Link to="/ajuda">Relatar esta situação <ArrowRight /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="confidential-section">
        <div>
          <p className="eyebrow eyebrow-light">Confidencialidade</p>
          <h2>Seu relato será tratado com cuidado.</h2>
          <p>Outros alunos não terão acesso. As informações ficam restritas à equipe autorizada pela escola.</p>
        </div>
        <div className="confidential-card">
          <Shield />
          <h3>Proteção vem primeiro</h3>
          <p>Se for necessário proteger você ou outra pessoa, a equipe poderá encaminhar informações somente às pessoas responsáveis pelo atendimento.</p>
          <Link className="button button-light" to="/ajuda">Começar relato <ArrowRight /></Link>
        </div>
      </section>

      <footer className="site-footer">
        <div className="brand"><span className="brand-mark">D</span><span>Délios</span></div>
        <p>Uma ponte entre o estudante e a ajuda certa.</p>
        <Link to="/login">Acesso da equipe</Link>
      </footer>
    </main>
  );
}
