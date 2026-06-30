import { Link } from "react-router-dom";
import "../App.css";

function PrivacyPage() {
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
        <h1>Politique de confidentialité</h1>
        <p className="legal-intro">
          NeoTravel SAS (ci-après « NeoTravel ») attache une importance particulière à la protection de vos données personnelles. La présente politique de confidentialité décrit la manière dont nous collectons, utilisons et protégeons vos données dans le cadre de l'utilisation de notre plateforme, conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi française n° 78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés.
        </p>

        <section>
          <h2>1. Responsable du traitement</h2>
          <p>
            Le responsable du traitement de vos données personnelles est :<br />
            <strong>NeoTravel SAS</strong><br />
            14 rue de la République, 75001 Paris<br />
            RCS Paris 912 345 678<br />
            E-mail : privacy@neotravel.fr<br />
            Délégué à la Protection des Données (DPO) : dpo@neotravel.fr
          </p>
        </section>

        <section>
          <h2>2. Données collectées</h2>
          <p>Dans le cadre de votre utilisation de la plateforme NeoTravel, nous collectons les catégories de données suivantes :</p>
          <ul>
            <li><strong>Données d'identification :</strong> nom, prénom, dénomination sociale ;</li>
            <li><strong>Coordonnées :</strong> adresse e-mail, numéro de téléphone (facultatif) ;</li>
            <li><strong>Données de trajet :</strong> ville de départ, ville d'arrivée, date(s) de départ et de retour, nombre de passagers, type de trajet ;</li>
            <li><strong>Données de navigation :</strong> adresse IP, type de navigateur, pages visitées, durée de session (via cookies techniques) ;</li>
            <li><strong>Données de conversation :</strong> historique des échanges avec l'assistant conversationnel.</li>
          </ul>
          <p>Nous ne collectons aucune donnée sensible au sens de l'article 9 du RGPD (données de santé, origine ethnique, opinions politiques, convictions religieuses, etc.).</p>
        </section>

        <section>
          <h2>3. Finalités du traitement</h2>
          <p>Vos données sont traitées pour les finalités suivantes :</p>
          <ul>
            <li><strong>Génération de devis :</strong> traitement nécessaire à l'exécution des services demandés ;</li>
            <li><strong>Communication commerciale :</strong> envoi du devis par e-mail, suivi de votre demande ;</li>
            <li><strong>Amélioration du service :</strong> analyse anonymisée des usages pour optimiser l'assistant conversationnel ;</li>
            <li><strong>Obligations légales :</strong> conservation des données de facturation conformément aux obligations comptables ;</li>
            <li><strong>Communication marketing :</strong> envoi d'offres et d'actualités, uniquement avec votre consentement explicite.</li>
          </ul>
        </section>

        <section>
          <h2>4. Base légale des traitements</h2>
          <p>Les traitements effectués par NeoTravel reposent sur les bases légales suivantes :</p>
          <ul>
            <li><strong>Exécution d'un contrat :</strong> pour la génération et la transmission de votre devis ;</li>
            <li><strong>Consentement :</strong> pour les communications marketing et l'utilisation de cookies non essentiels ;</li>
            <li><strong>Intérêt légitime :</strong> pour l'amélioration de nos services et la sécurité de notre plateforme ;</li>
            <li><strong>Obligation légale :</strong> pour la conservation des données de facturation (6 ans).</li>
          </ul>
        </section>

        <section>
          <h2>5. Durée de conservation</h2>
          <p>Vos données personnelles sont conservées pour la durée strictement nécessaire aux finalités pour lesquelles elles ont été collectées :</p>
          <ul>
            <li><strong>Données de devis :</strong> 3 ans à compter de la dernière interaction ;</li>
            <li><strong>Données de facturation :</strong> 6 ans à compter de la date de facturation (obligation légale) ;</li>
            <li><strong>Données de navigation :</strong> 13 mois maximum ;</li>
            <li><strong>Données de conversation IA :</strong> 12 mois à compter de la session, puis anonymisation.</li>
          </ul>
        </section>

        <section>
          <h2>6. Destinataires des données</h2>
          <p>Vos données peuvent être communiquées aux destinataires suivants :</p>
          <ul>
            <li><strong>Transporteurs partenaires :</strong> dans la limite des informations nécessaires à l'exécution du trajet ;</li>
            <li><strong>Prestataires techniques :</strong> hébergement cloud, service e-mail transactionnel, prestataire de paiement — agissant en qualité de sous-traitants au sens du RGPD ;</li>
            <li><strong>Autorités compétentes :</strong> sur demande légale ou judiciaire.</li>
          </ul>
          <p>Aucune donnée n'est vendue à des tiers à des fins commerciales.</p>
        </section>

        <section>
          <h2>7. Transferts hors Union européenne</h2>
          <p>
            Certains de nos prestataires techniques peuvent être établis hors de l'Union européenne. Dans ce cas, NeoTravel s'assure que ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types de la Commission européenne, décision d'adéquation, etc.) conformément au chapitre V du RGPD.
          </p>
        </section>

        <section>
          <h2>8. Vos droits</h2>
          <p>Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :</p>
          <ul>
            <li><strong>Droit d'accès :</strong> obtenir une copie des données vous concernant ;</li>
            <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes ;</li>
            <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données (sous réserve d'obligations légales) ;</li>
            <li><strong>Droit à la limitation :</strong> suspendre le traitement de vos données ;</li>
            <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible par machine ;</li>
            <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données à des fins de prospection commerciale ;</li>
            <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement à tout moment sans porter atteinte à la licéité du traitement antérieur.</li>
          </ul>
          <p>
            Pour exercer ces droits, adressez votre demande à <strong>privacy@neotravel.fr</strong> en joignant une copie de votre pièce d'identité. NeoTravel s'engage à répondre dans un délai d'un mois. En cas de réponse insatisfaisante, vous disposez du droit d'introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) : <strong>www.cnil.fr</strong>.
          </p>
        </section>

        <section>
          <h2>9. Cookies</h2>
          <p>
            NeoTravel utilise des cookies et technologies similaires pour assurer le fonctionnement de la plateforme, mémoriser vos préférences et analyser l'utilisation du service. Les cookies strictement nécessaires sont déposés sans votre consentement préalable. Les cookies analytiques et marketing nécessitent votre consentement, que vous pouvez retirer à tout moment via le gestionnaire de cookies disponible en bas de page.
          </p>
        </section>

        <section>
          <h2>10. Sécurité</h2>
          <p>
            NeoTravel met en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte, altération ou divulgation. Ces mesures incluent notamment le chiffrement des données en transit (HTTPS/TLS), le contrôle des accès, la pseudonymisation et des audits de sécurité réguliers.
          </p>
        </section>

        <section>
          <h2>11. Modifications de la présente politique</h2>
          <p>
            NeoTravel se réserve le droit de modifier la présente politique de confidentialité à tout moment. Toute modification substantielle sera notifiée par e-mail aux utilisateurs ayant un compte actif ou par un avis visible sur la plateforme.
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

export default PrivacyPage;
