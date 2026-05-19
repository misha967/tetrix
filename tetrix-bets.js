/**
 * SYMETRY TETRIX — Configuration des mises
 * ==========================================
 * Fichier administrable.
 *
 * Les montants de base sont définis en EUR.
 * Le système convertit automatiquement vers la devise
 * sélectionnée par le joueur.
 *
 * Pour modifier les mises disponibles :
 *   → Éditez le tableau BASE_CHIPS_EUR
 *
 * Pour mettre à jour les taux de change :
 *   → Éditez EXCHANGE_RATES et ratesUpdatedAt
 */

window.TetrixBets = {

  // ─── DATE DE MISE À JOUR DES TAUX ─────────────────────
  ratesUpdatedAt: '2025-05-19',

  // ─── MISES DE BASE EN EUR ─────────────────────────────
  BASE_CHIPS_EUR: [5, 10, 25, 50, 100],

  // ─── TAUX DE CHANGE (1 EUR = X devise) ────────────────
  EXCHANGE_RATES: {
    EUR: 1,
    USD: 1.08,
    CHF: 0.96,
    NGN: 1768.00,
    AOA: 979.00,
    MZN: 69.20,
  },

  // ─── ARRONDI PAR DEVISE ───────────────────────────────
  ROUNDING: {
    EUR: { decimals: 2, step: 0.05 },
    USD: { decimals: 2, step: 0.05 },
    CHF: { decimals: 2, step: 0.05 },
    NGN: { decimals: 0, step: 50   },
    AOA: { decimals: 0, step: 5    },
    MZN: { decimals: 0, step: 1    },
  },

  convert(amountEUR, targetCurrency) {
    const rate    = this.EXCHANGE_RATES[targetCurrency] ?? 1;
    const raw     = amountEUR * rate;
    const rounding = this.ROUNDING[targetCurrency] ?? { step: 1 };
    return Math.round(raw / rounding.step) * rounding.step;
  },

  chipsFor(targetCurrency) {
    return this.BASE_CHIPS_EUR.map(eur => this.convert(eur, targetCurrency));
  },

  chipsWithLabel(targetCurrency, symbol) {
    return this.BASE_CHIPS_EUR.map(eur => {
      const converted = this.convert(eur, targetCurrency);
      const rounding  = this.ROUNDING[targetCurrency] ?? { decimals: 2 };
      const label     = converted.toLocaleString('fr-FR', {
        minimumFractionDigits: rounding.decimals,
        maximumFractionDigits: rounding.decimals,
      }) + '\u00a0' + symbol;
      return { eur, converted, label };
    });
  },
};
