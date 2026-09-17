import React, { useEffect, useState } from 'react';
import { pageTitle, metaDescription } from '../utils/seoTitle';
import { ArrowLeft, ShieldCheck, ScrollText, Mail, Leaf } from 'lucide-react';

/**
 * Privacy Policy and Terms of Use.
 *
 * These existed as dead `href="#privacy"` links in the footer with preventDefault() on them
 * until 2026-09-15. Real pages are needed before any platform review will pass — TikTok's
 * Content Posting API submission asks for both URLs outright, and AdSense wants them too.
 *
 * Everything below describes what the code actually does, checked against the endpoints
 * rather than written from a template: newsletter-subscribe.php forwards the address to
 * Brevo, plant-diagnosis.php relays the photo to Gemini without storing it, qa.php keeps
 * submitted questions on the server, and all three keep caller IPs for an hour to rate-limit
 * abuse. If any of those change, this page has to change with them.
 *
 * Both languages live here because the reader is Greek but the platform reviewers are not.
 */

type Lang = 'el' | 'en';

interface LegalPageProps {
  variant: 'privacy' | 'terms';
  onBack: () => void;
}

interface Section {
  heading: string;
  body: string[];
}

const CONTACT_EMAIL = 'smartgarden68@gmail.com';
const LAST_UPDATED = { el: '15 Σεπτεμβρίου 2026', en: '15 September 2026' };

const PRIVACY: Record<Lang, { title: string; intro: string; sections: Section[] }> = {
  el: {
    title: 'Πολιτική Απορρήτου',
    intro:
      'Το SmartGarden.gr είναι ένας ελληνικός ιστότοπος κηπουρικής. Αυτή η σελίδα εξηγεί τι δεδομένα συλλέγουμε, γιατί, πού καταλήγουν και πώς μπορείτε να τα διαγράψετε. Περιγράφει τι κάνει πραγματικά ο ιστότοπος — όχι τυποποιημένο κείμενο.',
    sections: [
      {
        heading: '1. Ποιοι είμαστε',
        body: [
          `Υπεύθυνος επεξεργασίας: SmartGarden.gr. Επικοινωνία για κάθε θέμα προσωπικών δεδομένων: ${CONTACT_EMAIL}.`,
          'Ο ιστότοπος απευθύνεται σε ενήλικες ερασιτέχνες και επαγγελματίες κηπουρούς. Δεν απευθύνεται σε παιδιά κάτω των 16 ετών και δεν συλλέγουμε εν γνώσει μας δεδομένα τους.',
        ],
      },
      {
        heading: '2. Εγγραφή στο newsletter',
        body: [
          'Αν εγγραφείτε στο newsletter, συλλέγουμε τη διεύθυνση email σας και μόνο αυτή. Δεν ζητάμε όνομα, τηλέφωνο ή διεύθυνση.',
          'Η διεύθυνση προωθείται και αποθηκεύεται στην πλατφόρμα email marketing Brevo (Sendinblue SAS, Γαλλία), η οποία ενεργεί ως εκτελών την επεξεργασία για λογαριασμό μας.',
          'Νομική βάση: η συγκατάθεσή σας. Μπορείτε να διαγραφείτε ανά πάσα στιγμή από τον σύνδεσμο απεγγραφής σε κάθε email, ή στέλνοντάς μας μήνυμα.',
        ],
      },
      {
        heading: '3. Διάγνωση φυτού από φωτογραφία',
        body: [
          'Όταν ανεβάζετε φωτογραφία φυτού στο εργαλείο διάγνωσης, η εικόνα αποστέλλεται στο Google Gemini API για ανάλυση και το αποτέλεσμα επιστρέφεται σε εσάς.',
          'Η φωτογραφία δεν αποθηκεύεται στους διακομιστές μας. Δεν κρατάμε αντίγραφο, δεν τη δημοσιεύουμε και δεν τη χρησιμοποιούμε για εκπαίδευση μοντέλων.',
          'Μην ανεβάζετε φωτογραφίες που περιέχουν πρόσωπα, έγγραφα ή άλλες προσωπικές πληροφορίες — το εργαλείο χρειάζεται μόνο το φυτό.',
        ],
      },
      {
        heading: '4. Ερωτήσεις προς τον γεωπόνο',
        body: [
          'Αν υποβάλετε ερώτηση, αποθηκεύουμε το κείμενο της ερώτησης και το προαιρετικό όνομα/ψευδώνυμο που δηλώνετε.',
          'Οι ερωτήσεις ελέγχονται και μπορεί να δημοσιευτούν δημόσια μαζί με την απάντηση. Μη γράφετε προσωπικά στοιχεία μέσα στην ερώτηση.',
          'Νομική βάση: η συγκατάθεσή σας με την υποβολή. Ζητήστε μας διαγραφή στο email επικοινωνίας και θα αφαιρεθεί.',
        ],
      },
      {
        heading: '5. Διεύθυνση IP και προστασία από κατάχρηση',
        body: [
          'Για τη φόρμα newsletter, τη διάγνωση φυτού και τις ερωτήσεις κρατάμε προσωρινά τη διεύθυνση IP σας, ώστε να περιορίζουμε αυτοματοποιημένες καταχρήσεις.',
          'Οι καταγραφές αυτές διατηρούνται για μία ώρα και διαγράφονται αυτόματα. Δεν συνδέονται με το περιεχόμενο που υποβάλατε και δεν χρησιμοποιούνται για προφίλ.',
          'Νομική βάση: έννομο συμφέρον για την ασφάλεια και τη διαθεσιμότητα της υπηρεσίας.',
        ],
      },
      {
        heading: '6. Cookies, στατιστικά και διαφημίσεις',
        body: [
          'Χρησιμοποιούμε Google Analytics για στατιστικά επισκεψιμότητας και Google AdSense για διαφημίσεις.',
          'Και τα δύο λειτουργούν με Google Consent Mode. Εντός ΕΟΧ/Ηνωμένου Βασιλείου η αποθήκευση για διαφήμιση και στατιστικά είναι εξ ορισμού απενεργοποιημένη μέχρι να δώσετε συγκατάθεση στο σχετικό banner. Μπορείτε να αλλάξετε ή να ανακαλέσετε την επιλογή σας οποτεδήποτε από το ίδιο banner.',
          'Ανεξάρτητα από cookies, ο περιηγητής σας αποθηκεύει τοπικά την πόλη που επιλέγετε για τον καιρό (κλειδί smartgarden_weather_city). Αυτή η τιμή μένει στη συσκευή σας, δεν φτάνει ποτέ σε εμάς και σβήνει αν καθαρίσετε τα δεδομένα του περιηγητή.',
        ],
      },
      {
        heading: '7. Πού καταλήγουν τα δεδομένα',
        body: [
          'Brevo (Sendinblue SAS) — διευθύνσεις email newsletter.',
          'Google — Gemini API για τη διάγνωση φυτού, Analytics για στατιστικά, AdSense για διαφημίσεις.',
          'Cloudflare — δίκτυο διανομής και προστασία από επιθέσεις· επεξεργάζεται τεχνικά δεδομένα σύνδεσης για να φτάσει η σελίδα σε εσάς.',
          'Δεν πουλάμε και δεν ενοικιάζουμε προσωπικά δεδομένα σε κανέναν.',
        ],
      },
      {
        heading: '8. Τα δικαιώματά σας (GDPR)',
        body: [
          'Έχετε δικαίωμα πρόσβασης, διόρθωσης, διαγραφής, περιορισμού, φορητότητας και εναντίωσης στην επεξεργασία, καθώς και ανάκλησης της συγκατάθεσής σας.',
          `Για οποιοδήποτε από αυτά γράψτε μας στο ${CONTACT_EMAIL}. Απαντάμε το αργότερο εντός ενός μήνα.`,
          'Αν θεωρείτε ότι δεν χειριστήκαμε σωστά τα δεδομένα σας, μπορείτε να προσφύγετε στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (dpa.gr).',
        ],
      },
      {
        heading: '9. Αλλαγές',
        body: [
          'Αν αλλάξει ο τρόπος που χειριζόμαστε δεδομένα, ενημερώνεται αυτή η σελίδα και η ημερομηνία στην κορυφή.',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    intro:
      'SmartGarden.gr is a Greek gardening publication. This page explains what data we collect, why, where it goes and how to have it deleted. It describes what the site actually does rather than boilerplate.',
    sections: [
      {
        heading: '1. Who we are',
        body: [
          `Data controller: SmartGarden.gr. For any data protection matter, contact ${CONTACT_EMAIL}.`,
          'The site is aimed at adult home and professional gardeners. It is not directed at children under 16 and we do not knowingly collect their data.',
        ],
      },
      {
        heading: '2. Newsletter signup',
        body: [
          'If you subscribe to the newsletter we collect your email address and nothing else. We do not ask for a name, phone number or postal address.',
          'The address is forwarded to and stored by the email marketing platform Brevo (Sendinblue SAS, France), acting as a processor on our behalf.',
          'Legal basis: your consent. You can unsubscribe at any time from the link in every email, or by contacting us.',
        ],
      },
      {
        heading: '3. Plant photo diagnosis',
        body: [
          'When you upload a plant photo to the diagnosis tool, the image is sent to the Google Gemini API for analysis and the result is returned to you.',
          'The photo is not stored on our servers. We keep no copy, do not publish it and do not use it to train models.',
          'Please do not upload photos containing faces, documents or other personal information — the tool only needs the plant.',
        ],
      },
      {
        heading: '4. Questions to the agronomist',
        body: [
          'If you submit a question, we store the question text and the optional name or nickname you provide.',
          'Questions are reviewed and may be published publicly together with the answer. Do not include personal details in the question text.',
          'Legal basis: your consent in submitting it. Email us to have a submission removed.',
        ],
      },
      {
        heading: '5. IP addresses and abuse prevention',
        body: [
          'For the newsletter form, the plant diagnosis tool and question submissions we temporarily record your IP address in order to rate-limit automated abuse.',
          'These records are kept for one hour and then deleted automatically. They are not linked to the content you submitted and are not used for profiling.',
          'Legal basis: legitimate interest in the security and availability of the service.',
        ],
      },
      {
        heading: '6. Cookies, analytics and advertising',
        body: [
          'We use Google Analytics for traffic statistics and Google AdSense for advertising.',
          'Both run under Google Consent Mode. Within the EEA and UK, advertising and analytics storage are denied by default until you consent through the banner. You can change or withdraw that choice at any time from the same banner.',
          'Separately from cookies, your browser stores the weather city you pick locally (key smartgarden_weather_city). That value stays on your device, never reaches us, and is cleared if you clear site data.',
        ],
      },
      {
        heading: '7. Where data goes',
        body: [
          'Brevo (Sendinblue SAS) — newsletter email addresses.',
          'Google — Gemini API for plant diagnosis, Analytics for statistics, AdSense for advertising.',
          'Cloudflare — content delivery and attack protection; processes technical connection data to deliver the page to you.',
          'We do not sell or rent personal data to anyone.',
        ],
      },
      {
        heading: '8. Your rights (GDPR)',
        body: [
          'You have the right of access, rectification, erasure, restriction, portability and objection, and the right to withdraw consent.',
          `To exercise any of these, write to ${CONTACT_EMAIL}. We respond within one month at the latest.`,
          'If you believe we have mishandled your data, you may lodge a complaint with the Hellenic Data Protection Authority (dpa.gr).',
        ],
      },
      {
        heading: '9. Changes',
        body: ['If the way we handle data changes, this page and the date at the top are updated.'],
      },
    ],
  },
};

const TERMS: Record<Lang, { title: string; intro: string; sections: Section[] }> = {
  el: {
    title: 'Όροι Χρήσης',
    intro:
      'Με τη χρήση του SmartGarden.gr αποδέχεστε τους παρακάτω όρους. Είναι σύντομοι και γραμμένοι σε απλά ελληνικά.',
    sections: [
      {
        heading: '1. Τι είναι αυτός ο ιστότοπος',
        body: [
          'Το SmartGarden.gr δημοσιεύει οδηγούς κηπουρικής, υπολογιστές και εργαλεία για το ελληνικό κλίμα. Η πρόσβαση στο περιεχόμενο είναι δωρεάν.',
        ],
      },
      {
        heading: '2. Το περιεχόμενο είναι ενημερωτικό',
        body: [
          'Οι οδηγοί είναι γενικές πληροφορίες κηπουρικής, όχι εξατομικευμένη γεωπονική συμβουλή για τη δική σας καλλιέργεια, το δικό σας χώμα ή το δικό σας μικροκλίμα.',
          'Δεν φέρουμε ευθύνη για ζημιά σε φυτά, καλλιέργειες ή περιουσία από την εφαρμογή όσων διαβάζετε εδώ. Σε σοβαρές ή εμπορικές καλλιέργειες συμβουλευτείτε γεωπόνο.',
          'Για φυτοπροστατευτικά προϊόντα και λιπάσματα ακολουθείτε πάντα τις οδηγίες της ετικέτας και την ισχύουσα νομοθεσία. Η ετικέτα υπερισχύει κάθε οδηγού μας.',
        ],
      },
      {
        heading: '3. Περιεχόμενο με τη βοήθεια AI',
        body: [
          'Μέρος του περιεχομένου συντάσσεται με τη βοήθεια συστημάτων τεχνητής νοημοσύνης και ελέγχεται πριν δημοσιευτεί.',
          'Το εργαλείο διάγνωσης φυτού από φωτογραφία είναι αυτόματο και μπορεί να κάνει λάθος. Αντιμετωπίστε το ως ένδειξη, όχι ως διάγνωση, και επιβεβαιώστε πριν ψεκάσετε ή απορρίψετε ένα φυτό.',
        ],
      },
      {
        heading: '4. Πνευματικά δικαιώματα',
        body: [
          'Τα κείμενα, οι υπολογιστές και η δομή του ιστότοπου ανήκουν στο SmartGarden.gr. Μπορείτε να παραπέμπετε με σύνδεσμο και να αναφέρετε σύντομα αποσπάσματα με αναφορά στην πηγή.',
          'Η αναδημοσίευση ολόκληρων άρθρων, με ή χωρίς αναφορά, δεν επιτρέπεται χωρίς γραπτή άδεια.',
          'Οι φωτογραφίες προέρχονται από το Unsplash και χρησιμοποιούνται σύμφωνα με την άδειά του.',
        ],
      },
      {
        heading: '5. Αποδεκτή χρήση',
        body: [
          'Μη χρησιμοποιείτε τον ιστότοπο για αυτοματοποιημένη μαζική άντληση περιεχομένου, για προσπάθειες παραβίασης, ούτε για υποβολή παράνομου ή προσβλητικού υλικού μέσω των φορμών.',
          'Διατηρούμε το δικαίωμα να μη δημοσιεύσουμε ή να αφαιρέσουμε υποβολές που παραβιάζουν τα παραπάνω.',
        ],
      },
      {
        heading: '6. Σύνδεσμοι και διαφημίσεις',
        body: [
          'Ο ιστότοπος προβάλλει διαφημίσεις και ενδέχεται να περιέχει συνδέσμους προς τρίτους. Δεν ελέγχουμε το περιεχόμενο τρίτων ιστότοπων και δεν φέρουμε ευθύνη γι’ αυτό.',
        ],
      },
      {
        heading: '7. Αλλαγές και εφαρμοστέο δίκαιο',
        body: [
          'Οι όροι μπορεί να ενημερωθούν· η ισχύουσα έκδοση είναι πάντα αυτή η σελίδα, με την ημερομηνία στην κορυφή.',
          'Εφαρμόζεται το ελληνικό δίκαιο και αρμόδια είναι τα δικαστήρια της Ελλάδας.',
          `Ερωτήσεις για τους όρους: ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
  en: {
    title: 'Terms of Use',
    intro: 'By using SmartGarden.gr you accept the terms below. They are short and in plain language.',
    sections: [
      {
        heading: '1. What this site is',
        body: [
          'SmartGarden.gr publishes gardening guides, calculators and tools for the Greek climate. Access to the content is free.',
        ],
      },
      {
        heading: '2. The content is informational',
        body: [
          'The guides are general gardening information, not individual agronomic advice for your particular crop, soil or microclimate.',
          'We accept no liability for damage to plants, crops or property resulting from applying what you read here. For serious or commercial growing, consult a qualified agronomist.',
          'For plant protection products and fertilisers, always follow the label instructions and applicable law. The label overrides any guide of ours.',
        ],
      },
      {
        heading: '3. AI-assisted content',
        body: [
          'Some content is drafted with the help of AI systems and reviewed before publication.',
          'The plant photo diagnosis tool is automated and can be wrong. Treat it as an indication, not a diagnosis, and confirm before spraying or discarding a plant.',
        ],
      },
      {
        heading: '4. Intellectual property',
        body: [
          'The text, calculators and structure of the site belong to SmartGarden.gr. You may link to us and quote short extracts with attribution.',
          'Republishing whole articles, with or without attribution, is not permitted without written permission.',
          'Photographs are sourced from Unsplash and used under its licence.',
        ],
      },
      {
        heading: '5. Acceptable use',
        body: [
          'Do not use the site for automated bulk scraping, for intrusion attempts, or to submit unlawful or abusive material through the forms.',
          'We reserve the right not to publish, or to remove, submissions that breach the above.',
        ],
      },
      {
        heading: '6. Links and advertising',
        body: [
          'The site displays advertising and may contain links to third parties. We do not control third-party content and are not responsible for it.',
        ],
      },
      {
        heading: '7. Changes and governing law',
        body: [
          'These terms may be updated; the version in force is always this page, with the date at the top.',
          'Greek law applies and the courts of Greece have jurisdiction.',
          `Questions about these terms: ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
};

export const LegalPage: React.FC<LegalPageProps> = ({ variant, onBack }) => {
  const [lang, setLang] = useState<Lang>('el');
  const source = variant === 'privacy' ? PRIVACY : TERMS;
  const doc = source[lang];
  const Icon = variant === 'privacy' ? ShieldCheck : ScrollText;

  useEffect(() => {
    const titles = {
      privacy: 'Πολιτική Απορρήτου — SmartGarden.gr',
      terms: 'Όροι Χρήσης — SmartGarden.gr',
    };
    const descriptions = {
      privacy:
        'Τι δεδομένα συλλέγει το SmartGarden.gr, γιατί, πού καταλήγουν και πώς τα διαγράφετε. Newsletter, διάγνωση φυτού, cookies και δικαιώματα GDPR.',
      terms:
        'Οι όροι χρήσης του SmartGarden.gr: ενημερωτικός χαρακτήρας περιεχομένου, περιεχόμενο με βοήθεια AI, πνευματικά δικαιώματα και αποδεκτή χρήση.',
    };
    document.title = pageTitle(titles[variant]);
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', metaDescription(descriptions[variant]));
  }, [variant]);

  return (
    <div role="main" className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Πίσω στην αρχική
          </button>

          <div className="flex items-center rounded-lg border border-slate-700 overflow-hidden text-xs font-semibold">
            {(['el', 'en'] as Lang[]).map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`px-3 py-1.5 cursor-pointer transition-colors ${
                  lang === code ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {code === 'el' ? 'Ελληνικά' : 'English'}
              </button>
            ))}
          </div>
        </div>

        <header className="flex items-start gap-3">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{doc.title}</h1>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'el' ? 'Τελευταία ενημέρωση: ' : 'Last updated: '}
              {LAST_UPDATED[lang]}
            </p>
          </div>
        </header>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed border-l-2 border-emerald-500/40 pl-4">
          {doc.intro}
        </p>

        <div className="space-y-6">
          {doc.sections.map((section) => (
            <section key={section.heading} className="space-y-2">
              <h2 className="text-lg font-bold text-slate-100">{section.heading}</h2>
              {section.body.map((paragraph, i) => (
                <p key={i} className="text-sm text-slate-300 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <footer className="border-t border-slate-800 pt-5 space-y-3">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            <Mail className="w-4 h-4" />
            {CONTACT_EMAIL}
          </a>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            SmartGarden.gr — {lang === 'el' ? 'οδηγοί κηπουρικής για το ελληνικό κλίμα' : 'gardening guides for the Greek climate'}
          </div>
        </footer>
      </div>
    </div>
  );
};
