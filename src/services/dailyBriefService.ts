// Turns the live telemetry into instructions. The numbers were already on the page —
// "ET₀ 5.3mm" means nothing to someone deciding whether to fill a watering can — so this
// is where they become an answer.

import { LiveWeatherData } from './weatherService';

export type WateringUrgency = 'skip' | 'low' | 'normal' | 'high' | 'critical';

export interface WateringAdvice {
  urgency: WateringUrgency;
  /** One-line verdict, the part a reader actually acts on. */
  verdict: string;
  /** Best time of day, with the reason. */
  timing: string;
  /** Situations on a Greek balcony that need more or less than the baseline. */
  adjustments: string[];
  /** Rough interval at this evaporative demand, for people not watering daily. */
  interval: string;
}

export interface PestRisk {
  name: string;
  /** What conditions today are driving the risk. */
  because: string;
  /** What to actually do, today. */
  action: string;
  severity: 'watch' | 'act';
}

export interface DailyBrief {
  watering: WateringAdvice;
  risks: PestRisk[];
  /** Frost or heat headline, when one applies. */
  alert: { kind: 'heat' | 'frost'; text: string } | null;
}

/**
 * Reference evapotranspiration (ET₀) is millimetres of water a reference crop loses in a
 * day. It already folds in temperature, sun, humidity and wind, which is why it beats
 * temperature alone as a watering signal. Thresholds below are the FAO-56 style bands
 * adapted to container growing, where the reservoir is far smaller than field soil and
 * the plant runs out sooner at the same ET₀.
 */
function wateringFromEt0(w: LiveWeatherData): WateringAdvice {
  const raining = w.weatherCode >= 51 && w.weatherCode <= 82;
  const et = w.evapotranspiration;
  const windy = w.windSpeed >= 25;
  const dryAir = w.humidity <= 40;

  if (raining) {
    return {
      urgency: 'skip',
      verdict: 'Μην ποτίσετε σήμερα — βρέχει.',
      timing: 'Ελέγξτε αύριο· το νερό της βροχής σπάνια φτάνει βαθιά στις γλάστρες κάτω από μπαλκόνι ή τέντα.',
      adjustments: [
        'Γλάστρες σε στεγασμένο σημείο δεν πήραν νερό — ελέγξτε τις ξεχωριστά',
        'Αδειάστε τα πιατάκια: το στάσιμο νερό πνίγει τις ρίζες',
      ],
      interval: 'Επανεκτίμηση αύριο',
    };
  }

  let urgency: WateringUrgency;
  let verdict: string;
  let interval: string;

  if (et < 2) {
    urgency = 'low';
    verdict = 'Χαμηλή ανάγκη ποτίσματος σήμερα.';
    interval = 'Κάθε 4-6 ημέρες, ανάλογα με το μέγεθος της γλάστρας';
  } else if (et < 3.5) {
    urgency = 'normal';
    verdict = 'Μέτρια ανάγκη — ποτίστε όσες γλάστρες έχουν στεγνώσει στα πρώτα 3-4 εκατοστά.';
    interval = 'Κάθε 2-3 ημέρες';
  } else if (et < 5) {
    urgency = 'high';
    verdict = 'Υψηλή ανάγκη ποτίσματος σήμερα.';
    interval = 'Καθημερινά για μικρές γλάστρες, κάθε 2 ημέρες για μεγάλες';
  } else {
    urgency = 'critical';
    verdict = 'Πολύ υψηλή ανάγκη — μη χάσετε το σημερινό πότισμα.';
    interval = 'Καθημερινά· οι μικρές γλάστρες ίσως χρειαστούν και δεύτερο πέρασμα';
  }

  // Early morning is the agronomically correct default: the plant drinks before the heat,
  // and foliage dries within the hour, which keeps fungal pressure down. Evening is the
  // fallback in extreme heat, with the wet-foliage caveat stated rather than hidden.
  const timing =
    w.temperature >= 32
      ? 'Νωρίς το πρωί (06:00-09:00). Αν δεν προλάβετε, ποτίστε μετά τη δύση — αλλά μόνο στο χώμα, γιατί φύλλωμα που μένει υγρό όλη τη νύχτα ευνοεί τους μύκητες.'
      : w.temperature <= 12
        ? 'Μέσα στην ημέρα, όταν έχει ανέβει η θερμοκρασία. Το βραδινό πότισμα με κρύο αφήνει τις ρίζες σε υγρό, ψυχρό χώμα όλη τη νύχτα.'
        : 'Νωρίς το πρωί (06:00-09:00) — το φυτό προλαβαίνει να πιει πριν τη ζέστη και το φύλλωμα στεγνώνει μέσα σε μία ώρα.';

  const adjustments: string[] = [];
  if (windy) {
    adjustments.push(`Άνεμος ${Math.round(w.windSpeed)} km/h: στεγνώνει τις γλάστρες πιο γρήγορα από τη ζέστη — προσθέστε 30-40% νερό στις εκτεθειμένες`);
  }
  if (dryAir && w.temperature >= 26) {
    adjustments.push(`Υγρασία μόλις ${w.humidity}%: οι μικρές πήλινες γλάστρες μπορεί να στεγνώσουν μέσα στην ημέρα`);
  }
  if (et >= 3.5) {
    adjustments.push('Πήλινες γλάστρες χάνουν νερό και από τα τοιχώματα — θέλουν περίπου 30% περισσότερο από τις πλαστικές');
    adjustments.push('Κρεμαστές γλάστρες και ζαρντινιέρες στεγνώνουν πρώτες: ελέγξτε τις πάντα πρώτες');
  }
  if (w.uvIndex >= 8) {
    adjustments.push(`Δείκτης UV ${w.uvIndex}: αποφύγετε ψεκασμούς φυλλώματος μέχρι το απόγευμα, καίνε τα φύλλα`);
  }
  if (adjustments.length === 0) {
    adjustments.push('Ελέγξτε με το δάχτυλο σε βάθος 3-4 cm πριν ποτίσετε — αν είναι υγρό, περιμένετε');
  }

  return { urgency, verdict, timing, adjustments, interval };
}

/**
 * Pest and disease pressure is driven by the same two numbers the page already shows.
 * These are risk windows, not diagnoses — the wording says "ευνοούνται", because the
 * weather makes an outbreak likelier, it does not prove one is happening.
 */
function risksFromConditions(w: LiveWeatherData): PestRisk[] {
  const risks: PestRisk[] = [];
  const t = w.temperature;
  const h = w.humidity;

  if (t >= 27 && h <= 45) {
    risks.push({
      name: 'Τετράνυχος',
      because: `ζέστη ${Math.round(t)}°C με ξηρή ατμόσφαιρα (${h}%) — οι ιδανικές του συνθήκες`,
      action: 'Ελέγξτε την ΚΑΤΩ πλευρά των φύλλων για λεπτό ιστό και μικρές κιτρινωπές στίξεις. Ψεκασμός με σκέτο νερό στην κάτω επιφάνεια ανεβάζει την υγρασία και τον περιορίζει.',
      severity: t >= 30 && h <= 35 ? 'act' : 'watch',
    });
  }

  if (t >= 18 && t <= 28 && h >= 65) {
    risks.push({
      name: 'Ωίδιο',
      because: `ήπια θερμοκρασία ${Math.round(t)}°C με υγρασία ${h}%`,
      action: 'Αραιώστε πυκνό φύλλωμα για αερισμό και ποτίζετε στο χώμα, ποτέ από πάνω. Στα πρώτα λευκά στίγματα, διάλυμα σόδας ή θειάφι εκτός μεσημεριού.',
      severity: h >= 80 ? 'act' : 'watch',
    });
  }

  if (h >= 85 && t >= 12 && t <= 24) {
    risks.push({
      name: 'Βοτρύτης (τεφρά σήψη)',
      because: `πολύ υψηλή υγρασία ${h}% σε δροσερό καιρό`,
      action: 'Αφαιρέστε μαραμένα άνθη και πεσμένα φύλλα από την επιφάνεια του χώματος — εκεί ξεκινά. Αποφύγετε το βραδινό πότισμα.',
      severity: 'watch',
    });
  }

  if (t >= 15 && t <= 26 && h >= 50 && h <= 75) {
    risks.push({
      name: 'Μελίγκρα',
      because: `ήπιος καιρός ${Math.round(t)}°C — η εποχή που πολλαπλασιάζεται ταχύτερα`,
      action: 'Κοιτάξτε τις τρυφερές κορυφές και τους νέους βλαστούς. Σε μικρή προσβολή αρκεί δυνατός πίδακας νερού ή σαπούνι καλίου.',
      severity: 'watch',
    });
  }

  return risks.slice(0, 2);
}

export function buildDailyBrief(w: LiveWeatherData): DailyBrief {
  const alert = w.frostAlert
    ? {
        kind: 'frost' as const,
        text: `Κίνδυνος παγετού απόψε (ελάχιστη ${w.minTempToday}°C). Μεταφέρετε εσπεριδοειδή, φίκους και ό,τι ευαίσθητο σε στεγασμένο σημείο ή καλύψτε με αντιπαγετικό ύφασμα.`,
      }
    : w.heatAlert
      ? {
          kind: 'heat' as const,
          text: `Συνθήκες καύσωνα (${Math.round(w.temperature)}°C, εξάτμιση ${w.evapotranspiration}mm). Δίχτυ σκίασης 40% ρίχνει τη θερμοκρασία του φυλλώματος έως 6°C — μη ψεκάζετε και μη λιπαίνετε σήμερα.`,
        }
      : null;

  return { watering: wateringFromEt0(w), risks: risksFromConditions(w), alert };
}
