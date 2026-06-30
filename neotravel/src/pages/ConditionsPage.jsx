import { Link } from "react-router-dom";
import "../App.css";

function ConditionsPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link className="brand" to="/" aria-label="NeoTravel accueil">
          <span className="brand-icon">bus</span>
          <span>NeoTravel</span>
        </Link>
      </header>

      <main className="legal-shell">
        <div className="legal-meta">
          <span>Document juridique</span>
          <span>Dernière mise à jour : 1er janvier 2025</span>
        </div>
        <h1>Conditions générales d'utilisation</h1>
        <p className="legal-intro">
          Les présentes conditions générales d'utilisation (ci-après « CGU ») régissent l'accès et l'utilisation de la plateforme NeoTravel, éditée par la société NeoTravel SAS, immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro 912 345 678, dont le siège social est situé au 14 rue de la République, 75001 Paris (ci-après « NeoTravel »).
        </p>

        <section>
          <h2>Article 1 — Objet et champ d'application</h2>
          <p>
            Les présentes CGU ont pour objet de définir les conditions dans lesquelles NeoTravel met à disposition de ses utilisateurs une plateforme de devis et de réservation de transport collectif en autocar. Tout accès ou utilisation de la plateforme implique l'acceptation pleine et entière des présentes CGU.
          </p>
          <p>
            NeoTravel se réserve le droit de modifier les présentes CGU à tout moment. Les modifications prennent effet dès leur publication sur la plateforme. Il appartient à l'utilisateur de les consulter régulièrement.
          </p>
        </section>

        <section>
          <h2>Article 2 — Accès au service</h2>
          <p>
            L'accès à la plateforme NeoTravel est ouvert à toute personne physique majeure ou toute personne morale disposant de la capacité juridique pour contracter. L'utilisation du service par un mineur requiert le consentement préalable de son représentant légal.
          </p>
          <p>
            NeoTravel s'engage à mettre tout en œuvre pour assurer la disponibilité permanente de la plateforme, mais ne peut garantir une disponibilité ininterrompue. Des interruptions de service pourront intervenir notamment pour des opérations de maintenance, des mises à jour ou des incidents techniques indépendants de la volonté de NeoTravel.
          </p>
        </section>

        <section>
          <h2>Article 3 — Description des services</h2>
          <p>
            NeoTravel propose les services suivants :
          </p>
          <ul>
            <li>Un assistant conversationnel permettant de configurer une demande de transport collectif en autocar (ville de départ, destination, date, nombre de passagers) ;</li>
            <li>La génération automatique d'un devis provisoire basé sur les informations fournies par l'utilisateur ;</li>
            <li>La transmission du devis par voie électronique à l'adresse e-mail renseignée ;</li>
            <li>La mise en relation avec un conseiller commercial NeoTravel pour finaliser et confirmer la prestation.</li>
          </ul>
          <p>
            Le devis généré automatiquement a valeur indicative. Il ne constitue pas une offre ferme de prix et ne peut être considéré comme un engagement contractuel de la part de NeoTravel avant validation par un conseiller.
          </p>
        </section>

        <section>
          <h2>Article 4 — Obligations de l'utilisateur</h2>
          <p>
            L'utilisateur s'engage à fournir des informations exactes, complètes et sincères lors de l'utilisation de la plateforme. Toute information erronée ou frauduleuse engage la responsabilité exclusive de l'utilisateur et pourra entraîner l'annulation immédiate de toute prestation en cours.
          </p>
          <p>
            L'utilisateur s'interdit de :
          </p>
          <ul>
            <li>Utiliser la plateforme à des fins illicites ou contraires aux bonnes mœurs ;</li>
            <li>Tenter d'accéder sans autorisation aux systèmes informatiques de NeoTravel ;</li>
            <li>Reproduire, copier ou exploiter commercialement tout ou partie de la plateforme ;</li>
            <li>Transmettre des contenus offensants, diffamatoires ou portant atteinte aux droits de tiers.</li>
          </ul>
        </section>

        <section>
          <h2>Article 5 — Responsabilité</h2>
          <p>
            NeoTravel agit en qualité d'intermédiaire entre l'utilisateur et les transporteurs partenaires. À ce titre, NeoTravel ne peut être tenu responsable des dommages résultant d'une inexécution ou d'une mauvaise exécution de la prestation de transport imputable au transporteur.
          </p>
          <p>
            La responsabilité de NeoTravel ne saurait être engagée pour des dommages indirects, incluant notamment la perte de chiffre d'affaires, de données ou d'opportunités commerciales. En tout état de cause, la responsabilité de NeoTravel est limitée au montant effectivement réglé par l'utilisateur pour la prestation concernée.
          </p>
        </section>

        <section>
          <h2>Article 6 — Prix et facturation</h2>
          <p>
            Les prix affichés sur la plateforme sont exprimés en euros toutes taxes comprises (TTC) et incluent la TVA au taux applicable. Ils sont susceptibles d'évoluer sans préavis, notamment en raison des fluctuations du prix du carburant, des péages et des coefficients saisonniers.
          </p>
          <p>
            La confirmation du devis et le paiement interviennent selon les modalités communiquées par le conseiller commercial NeoTravel. Le paiement en ligne est sécurisé par un prestataire certifié PCI DSS.
          </p>
        </section>

        <section>
          <h2>Article 7 — Annulation et modification</h2>
          <p>
            Les conditions d'annulation applicables sont les suivantes :
          </p>
          <ul>
            <li><strong>Annulation plus de 15 jours avant le départ :</strong> aucun frais ;</li>
            <li><strong>Annulation entre 14 et 7 jours avant le départ :</strong> 50 % du montant total dû ;</li>
            <li><strong>Annulation moins de 7 jours avant le départ :</strong> 100 % du montant total dû.</li>
          </ul>
          <p>
            Toute demande de modification d'une réservation confirmée doit être adressée au conseiller commercial NeoTravel. NeoTravel s'efforcera de satisfaire la demande dans la limite des disponibilités.
          </p>
        </section>

        <section>
          <h2>Article 8 — Propriété intellectuelle</h2>
          <p>
            La plateforme NeoTravel, son design, ses contenus, ses textes, ses algorithmes de calcul et son assistant conversationnel sont protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation ou utilisation non autorisée est strictement interdite et constitue une contrefaçon sanctionnée pénalement.
          </p>
        </section>

        <section>
          <h2>Article 9 — Droit applicable et juridiction compétente</h2>
          <p>
            Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire. À défaut, tout litige sera porté devant les tribunaux compétents du ressort de Paris, sauf dispositions légales contraires applicables aux consommateurs.
          </p>
        </section>

        <section>
          <h2>Article 10 — Contact</h2>
          <p>
            Pour toute question relative aux présentes CGU, vous pouvez contacter NeoTravel à l'adresse suivante : <strong>legal@neotravel.fr</strong> ou par courrier à : NeoTravel SAS, 14 rue de la République, 75001 Paris.
          </p>
        </section>
      </main>

      <footer className="legal-footer">
        <p>© 2026 NeoTravel SAS — Tous droits réservés</p>
        <div>
          <Link to="/conditions">CGU</Link>
          <Link to="/privacy">Confidentialité</Link>
        </div>
      </footer>
    </div>
  );
}

export default ConditionsPage;
