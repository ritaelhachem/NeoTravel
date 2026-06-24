const benefits = [
  {
    iconClass: 'icon-assistant',
    title: 'Assistant IA',
    text: 'Un agent conversationnel intelligent qui vous guide pas à pas pour ne rien oublier dans votre demande de transport.',
  },
  {
    iconClass: 'icon-quote',
    title: 'Devis instantané',
    text: 'Recevez une estimation chiffrée en temps réel basée sur nos algorithmes de calcul dynamique et règles métier.',
  },
  {
    iconClass: 'icon-tracking',
    title: 'Suivi intelligent',
    text: 'Gérez toutes vos demandes et devis depuis un espace centralisé, avec des notifications pour chaque étape.',
  },
];

const checks = [
  'Analyse sémantique des trajets',
  'Calcul automatique des temps de conduite',
  'Ajustement saisonnier des tarifs',
  'Vérification de disponibilité en temps réel',
];

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="NeoTravel accueil">
          <span className="brand-icon">bus</span>
          <span>NeoTravel</span>
        </a>

        <nav className="main-nav" aria-label="Navigation principale">
          <a href="#discover">Découvrir</a>
          <a href="#features">Fonctionnalités</a>
          <a href="#pricing">Tarifs</a>
        </nav>

        <div className="header-actions">
          <a href="#platform">Découvrir la plateforme</a>
          <a className="button button-dark button-small" href="#quote">
            Demander un devis
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero-section" id="discover">
          <p className="eyebrow">La révolution du transport de groupe</p>
          <h1>Obtenez votre devis de transport de groupe grâce à l'IA</h1>
          <p className="hero-copy">
            Fini les attentes interminables au téléphone. Notre assistant intelligent analyse vos besoins instantanément
            pour vous proposer le meilleur tarif en quelques clics.
          </p>
          <a className="button button-dark hero-button" href="#quote">
            Demander un devis <span aria-hidden="true">→</span>
          </a>

          <div className="trusted-by" aria-label="Entreprises utilisatrices">
            <span>Utilisé par :</span>
            <strong>TransportLog</strong>
            <strong>QuickMove</strong>
            <strong>SafeTrip</strong>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <h2>Pourquoi choisir NeoTravel ?</h2>
            <p>
              Nous avons repensé l'expérience de location d'autocar pour la rendre plus fluide, transparente et efficace
              pour les organisateurs de voyages.
            </p>
          </div>

          <div className="benefit-grid">
            {benefits.map((benefit) => (
              <article className="benefit-card" key={benefit.title}>
                <span className={`benefit-icon ${benefit.iconClass}`} aria-hidden="true" />
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="assistant-section" id="platform">
          <div className="assistant-copy">
            <span className="tag">Démonstration</span>
            <h2>L'intelligence au service de vos déplacements</h2>
            <p>
              L'assistant NeoTravel ne se contente pas de prendre votre commande. Il optimise votre itinéraire, suggère
              la capacité de véhicule idéale et anticipe les besoins logistiques spécifiques aux groupes.
            </p>

            <ul className="check-list">
              {checks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>

            <a className="text-link" href="#quote">
              Essayer l'assistant maintenant <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="chat-card" aria-label="Simulation assistant NeoTravel IA">
            <div className="chat-topbar">
              <div>
                <span className="status-dot" aria-hidden="true" />
                <strong>Assistant NeoTravel IA</strong>
              </div>
              <span>En ligne</span>
            </div>
            <div className="chat-messages">
              <p className="message message-bot">
                Bonjour ! Je suis l'assistant NeoTravel. Je vais vous aider à obtenir un devis précis pour votre voyage
                de groupe en moins de 2 minutes. Prêt à commencer ?
              </p>
              <p className="message message-user">
                Bonjour, oui ! Nous sommes un groupe de 45 personnes pour un trajet Paris-Lyon.
              </p>
              <p className="message message-bot">
                Parfait. C'est noté pour 45 passagers. Pour quelle date prévoyez-vous ce déplacement ?
              </p>
              <small>L'IA est en train d'écrire...</small>
            </div>
            <div className="chat-input">
              <span>Typez votre réponse...</span>
              <button aria-label="Envoyer le message">→</button>
            </div>
          </div>
        </section>

        <section className="cta-section" id="quote">
          <h2>Prêt à simplifier vos réservations ?</h2>
          <p>
            Rejoignez des centaines d'entreprises et d'associations qui font confiance à NeoTravel pour leurs
            déplacements de groupe.
          </p>
          <div className="cta-actions">
            <a className="button button-light" href="#platform">
              Lancer l'assistant IA
            </a>
            <a className="button button-outline" href="#professional">
              Accès Professionnel
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <a className="brand" href="#top">
            <span className="brand-icon">bus</span>
            <span>NeoTravel</span>
          </a>
          <p>La solution intelligente pour automatiser vos demandes de transport de groupe.</p>
        </div>

        <div className="footer-links">
          <div>
            <h3>Produit</h3>
            <a href="#features">Fonctionnalités</a>
            <a href="#platform">Assistant IA</a>
            <a href="#pricing">Calculateur</a>
          </div>
          <div>
            <h3>Société</h3>
            <a href="#about">À propos</a>
            <a href="#blog">Blog</a>
            <a href="#contact">Contact</a>
          </div>
          <div>
            <h3>Légal</h3>
            <a href="#privacy">Confidentialité</a>
            <a href="#terms">Conditions</a>
          </div>
        </div>

        <p className="copyright">© 2024 NeoTravel. Propulsé par l'IA.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
