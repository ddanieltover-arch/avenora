/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Internationalization (i18n) Foundation (Phase 04)
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SupportedLocale = 'en' | 'es' | 'pt-BR';

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  phaseBadge: string;
  prototypeNotice: string;
  noRealMoney: string;
  bankingDisclaimer: string;
  newsBroadcast: {
    label: string;
    items: string[];
  };
  nav: {
    home: string;
    personal: string;
    business: string;
    cards: string;
    loans: string;
    grants: string;
    about: string;
    help: string;
    portal: string;
    signIn: string;
    openAccount: string;
    onlineBanking: string;
    contact: string;
    rates: string;
    mobile: string;
    security: string;
    explore: string;
  };
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: {
      zeroFloat: string;
      zeroFloatSub: string;
      currencies: string;
      currenciesSub: string;
      holds: string;
      holdsSub: string;
      ledger: string;
      ledgerSub: string;
    };
  };
  features: {
    title: string;
    subtitle: string;
    walletsTitle: string;
    walletsDesc: string;
    cardsTitle: string;
    cardsDesc: string;
    loansTitle: string;
    loansDesc: string;
    grantsTitle: string;
    grantsDesc: string;
  };
  home: {
    newsBroadcast: {
      label: string;
      items: string[];
    };
    featuresSectionKicker: string;
    featureCards: {
      personal: { highlight: string; cta: string; bullets: string[] };
      cards: { highlight: string; cta: string; bullets: string[] };
      loans: { highlight: string; cta: string; bullets: string[] };
      grants: { highlight: string; cta: string; bullets: string[] };
    };
    trust: {
      sectionKicker: string;
      title: string;
      subtitle: string;
      pillar1Title: string;
      pillar1Body: string;
      pillar1Code: string;
      pillar2Title: string;
      pillar2Body: string;
      pillar2Code: string;
      pillar3Title: string;
      pillar3Body: string;
      pillar3Code: string;
      disclosureTitle: string;
      disclosureBody: string;
      disclosureBadge: string;
    };
    walletPreview: {
      kicker: string;
      title: string;
      statusBadge: string;
      balanceLabel: string;
      transferLabel: string;
      footerSecurity: string;
      footerStandards: string;
    };
    footer: {
      brandBlurb: string;
      statusLine: string;
      copyright: string;
      termsLink: string;
      financialServices: string;
      memberServices: string;
      onlineBanking: string;
      mobileApp: string;
      securityCenter: string;
      aboutUs: string;
    };
  };
  about: {
    title: string;
    subtitle: string;
    missionTitle: string;
    missionDesc: string;
    ledgerTitle: string;
    ledgerDesc: string;
    safetyTitle: string;
    safetyDesc: string;
  };
  help: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    contactSupport: string;
    ticketSent: string;
  };
  contactPage: {
    kicker: string;
    title: string;
    subtitle: string;
    formTitle: string;
    formIntro: string;
    fullName: string;
    email: string;
    subject: string;
    message: string;
    send: string;
    success: string;
    asideTitle: string;
    asideIntro: string;
    phoneTitle: string;
    phoneValue: string;
    phoneNote: string;
    emailTitle: string;
    emailValue: string;
    emailNote: string;
    visitTitle: string;
    visitAddress: string;
    hoursTitle: string;
    hours: string;
    mapTitle: string;
    mapSubtitle: string;
    mapPlaceholder: string;
    helpLink: string;
  };
  businessPage: {
    kicker: string;
    title: string;
    subtitle: string;
    pillarsTitle: string;
    pillarsIntro: string;
    pillars: { title: string; desc: string }[];
    cta: string;
  };
  ratesPage: {
    kicker: string;
    title: string;
    subtitle: string;
    disclaimer: string;
    products: {
      badge?: string;
      rate: string;
      unit: string;
      title: string;
      category: string;
      note: string;
    }[];
  };
  mobilePage: {
    kicker: string;
    title: string;
    subtitle: string;
    features: { title: string; desc: string }[];
    installCta: string;
    bankingCta: string;
    browserNote: string;
    previewLabel: string;
    previewBalance: string;
    previewTransfer: string;
    previewBills: string;
    previewDisclaimer: string;
  };
  securityPage: {
    kicker: string;
    title: string;
    subtitle: string;
    topics: { title: string; desc: string }[];
    reportTitle: string;
    reportDesc: string;
    reportCta: string;
  };
  tabs: {
    overview: string;
    wallets: string;
    transfers: string;
    cards: string;
    loans: string;
    grants: string;
    transactions: string;
    statements: string;
    profile: string;
    kyc: string;
    helpSupport: string;
    webhooks: string;
    ledger: string;
    health: string;
    architecture: string;
    security: string;
  };
  legal: {
    privacyTitle: string;
    termsTitle: string;
    cookiesTitle: string;
    draftNotice: string;
    cookieEssential: string;
    cookieFunctional: string;
    cookieAnalytics: string;
    savePreferences: string;
    acceptAll: string;
  };
  auth: {
    signInTitle: string;
    registerTitle: string;
    forgotPasswordTitle: string;
    resetPasswordTitle: string;
    mfaTitle: string;
    emailLabel: string;
    passwordLabel: string;
    fullNameLabel: string;
    phoneLabel: string;
    transactionPinLabel: string;
    countryLabel: string;
    mfaCodeLabel: string;
    submitSignIn: string;
    submitRegister: string;
    prototypeDisclaimer: string;
  };
  actions: {
    deposit: string;
    withdraw: string;
    transfer: string;
    convert: string;
    submitKyc: string;
    calculateAmortization: string;
    applyForLoan: string;
    applyForGrant: string;
    requestCard: string;
    freezeCard: string;
    unfreezeCard: string;
  };
  metrics: {
    systemStatus: string;
    operational: string;
    doubleEntryLedger: string;
    verified: string;
    precisionEngine: string;
    zeroFloat: string;
    activeCorridors: string;
  };
}

const DICTIONARY: Record<SupportedLocale, Translations> = {
  en: {
    appTitle: 'AVENORA',
    appSubtitle: 'International Financial Software Platform',
    phaseBadge: 'Avenora Banking',
    prototypeNotice: 'Secure online banking',
    noRealMoney: 'Protecting your accounts with encryption and monitoring',
    bankingDisclaimer:
      'Important: Avenora provides digital banking and financial services subject to applicable licenses and regulations in your jurisdiction. Deposit insurance, product availability, and fees vary by region. Please review your account agreements and disclosures for full terms.',
    newsBroadcast: {
      label: 'Avenora Wire',
      items: [
        'Multicurrency accounts in USD, EUR, GBP, and BRL with competitive FX',
        'Secure customer portal for balances, transfers, and statements',
        'Payment cards with daily limits, instant freeze, and merchant controls',
        'Personal and business lending with clear repayment schedules',
        'Verified grant programs with eligibility review and disbursement tracking',
        'Help center and dedicated support for account questions',
      ],
    },
    nav: {
      home: 'Home',
      personal: 'Personal',
      business: 'Business',
      cards: 'Cards',
      loans: 'Lending',
      grants: 'Grants',
      about: 'About Us',
      help: 'Help Center',
      portal: 'Customer Portal',
      signIn: 'Sign In',
      openAccount: 'Open an Account',
      onlineBanking: 'Online Banking',
      contact: 'Contact',
      rates: 'Rates',
      mobile: 'Mobile App',
      security: 'Security',
      explore: 'Explore',
    },
    hero: {
      badge: 'International Banking & Multicurrency Accounts',
      headline: 'Modern banking with clarity, control, and confidence.',
      subheadline:
        'Avenora brings together multicurrency wallets, payment cards, lending, and verified grant programs in one secure customer experience—built on precise ledger accounting and strong security standards.',
      ctaPrimary: 'Sign in to Online Banking',
      ctaSecondary: 'Explore Products & Services',
      stats: {
        zeroFloat: 'Accurate Balances',
        zeroFloatSub: 'Ledger-backed accounting for every transaction',
        currencies: '4 Global Currencies',
        currenciesSub: 'USD, EUR, GBP, and BRL in one relationship',
        holds: 'Card Purchase Controls',
        holdsSub: 'Pre-authorization and settlement you can track',
        ledger: 'Transparent Records',
        ledgerSub: 'Debits and credits recorded in balance',
      },
    },
    features: {
      title: 'Everything you need in one financial relationship',
      subtitle: 'Personal and business banking services designed for international customers.',
      walletsTitle: 'Multicurrency Digital Wallets',
      walletsDesc: 'Hold, convert, send, and receive funds across USD, EUR, GBP, and BRL with live rates and clear transaction history.',
      cardsTitle: 'Payment Cards',
      cardsDesc: 'Manage virtual and debit cards, set spending limits, freeze instantly, and review merchant activity in real time.',
      loansTitle: 'Lending & Credit',
      loansDesc: 'Apply for personal or business credit with transparent terms, repayment schedules, and status tracking in your portal.',
      grantsTitle: 'Verified Grant Programs',
      grantsDesc: 'Browse institutional and public funding opportunities with eligibility guidance and application status in one place.',
    },
    home: {
      newsBroadcast: {
        label: 'Avenora Wire',
        items: [
          'Multicurrency accounts in USD, EUR, GBP, and BRL with competitive FX',
          'Secure customer portal for balances, transfers, and statements',
          'Payment cards with daily limits, instant freeze, and merchant controls',
          'Personal and business lending with clear repayment schedules',
          'Verified grant programs with eligibility review and disbursement tracking',
          'Help center and dedicated support for account questions',
        ],
      },
      featuresSectionKicker: 'Products & Services',
      featureCards: {
        personal: {
          highlight: 'Global Accounts',
          cta: 'Explore Wallets',
          bullets: [
            'Multicurrency balances with transparent FX',
            'Deposits, withdrawals, and peer transfers',
            'Monthly statements and transaction search',
          ],
        },
        cards: {
          highlight: 'Spend with confidence',
          cta: 'View Card Services',
          bullets: [
            'Virtual and debit card options',
            'Daily limits and instant freeze',
            'Merchant and authorization history',
          ],
        },
        loans: {
          highlight: 'Credit on clear terms',
          cta: 'View Lending',
          bullets: [
            'Personal and business applications',
            'Amortization schedules you can review',
            'Application status in your portal',
          ],
        },
        grants: {
          highlight: 'Non-dilutive funding',
          cta: 'Search Grant Programs',
          bullets: [
            'Curated institutional and public programs',
            'Eligibility and document checklists',
            'Application and award tracking',
          ],
        },
      },
      trust: {
        sectionKicker: 'Security & Trust',
        title: 'Built for safe, dependable money management',
        subtitle:
          'Avenora combines rigorous ledger discipline, encryption, and operational controls so you always know where your money stands.',
        pillar1Title: 'Balanced ledger accounting',
        pillar1Body:
          'Every movement of funds is recorded with matching debits and credits so account balances stay consistent and auditable.',
        pillar1Code: 'Every transaction is journal-balanced',
        pillar2Title: 'Account & card protection',
        pillar2Body:
          'Multi-factor sign-in, session controls, instant card freeze, and spending limits help you respond quickly to unusual activity.',
        pillar2Code: 'MFA · Card freeze · Session security',
        pillar3Title: 'Secure integrations',
        pillar3Body:
          'Partner webhooks and API events are authenticated and processed idempotently to prevent duplicate or tampered instructions.',
        pillar3Code: 'Signed webhooks · Idempotent processing',
        disclosureTitle: 'Important information about Avenora',
        disclosureBody:
          'Avenora provides digital banking and financial services subject to applicable licenses and regulations in your jurisdiction. Product availability, fees, and insurance coverage vary by region. Review your account agreements for full terms.',
        disclosureBadge: 'Member information & disclosures',
      },
      walletPreview: {
        kicker: 'Your accounts at a glance',
        title: 'Multicurrency wallet overview',
        statusBadge: 'Accounts active',
        balanceLabel: 'Estimated total balance',
        transferLabel: 'Transfer amount preview',
        footerSecurity: 'Encrypted session · Secure sign-in',
        footerStandards: 'ISO 4217 currency standards',
      },
      footer: {
        brandBlurb:
          'Avenora delivers multicurrency accounts, cards, lending, and grant services through a secure online banking experience.',
        statusLine: 'Online banking and customer support available',
        copyright: '© 2026 Avenora Financial Technologies. All rights reserved.',
        termsLink: 'Terms of Service',
        financialServices: 'Financial Services',
        memberServices: 'Member Services',
        onlineBanking: 'Online Banking',
        mobileApp: 'Mobile App',
        securityCenter: 'Security Center',
        aboutUs: 'About Us',
      },
    },
    about: {
      title: 'About Avenora',
      subtitle:
        'Avenora is a digital banking platform for multicurrency accounts, cards, lending, and grant services—built on precise accounting, strong security, and transparent customer controls.',
      missionTitle: 'Our Mission',
      missionDesc:
        'We help individuals and businesses manage money across borders with clarity: accurate balances, understandable fees, and tools to move, spend, borrow, and apply for funding in one secure relationship.',
      ledgerTitle: 'Reliable account records',
      ledgerDesc:
        'Every payment, transfer, and card authorization is recorded with balanced ledger entries so your statements and available balances stay consistent and auditable.',
      safetyTitle: 'Security & compliance',
      safetyDesc:
        'Multi-factor authentication, encryption in transit and at rest, card freeze controls, and identity verification workflows are designed to protect your accounts and meet regulatory expectations.',
    },
    help: {
      title: 'Help Center',
      subtitle: 'Answers about accounts, cards, lending, grants, and how to reach support.',
      searchPlaceholder: 'Search help topics or keywords...',
      contactSupport: 'Submit Inquiry',
      ticketSent: 'Your message was received. Reference number generated below.',
    },
    contactPage: {
      kicker: 'Get in touch',
      title: 'Contact Us',
      subtitle:
        'Questions about your account, cards, lending, or grants? Our member services team is ready to help.',
      formTitle: 'Send us a message',
      formIntro:
        'Complete the form and we will route your request to the right team. For urgent card or fraud concerns, call member services directly.',
      fullName: 'Full name',
      email: 'Email address',
      subject: 'Subject',
      message: 'Message',
      send: 'Send message',
      success: 'Thank you — your message has been received. Save this reference for follow-up:',
      asideTitle: 'Get in touch',
      asideIntro:
        'Prefer to reach us another way? Use the channels below. Secure messaging is also available after you sign in to online banking.',
      phoneTitle: 'Phone',
      phoneValue: '+1 (800) 284-6672',
      phoneNote: 'Member services · 24/7 card and fraud line',
      emailTitle: 'Email',
      emailValue: 'support@avenorabank.com',
      emailNote: 'We typically respond within one business day',
      visitTitle: 'Correspondence',
      visitAddress: 'Avenora Member Services\n1200 Financial Plaza, Suite 400\nNew York, NY 10004\nUnited States',
      hoursTitle: 'Banking hours',
      hours: 'Mon–Fri: 8:00 AM – 6:00 PM (ET)\nSat: 9:00 AM – 1:00 PM (ET)\nSun: Closed',
      mapTitle: 'Branch & partner locations',
      mapSubtitle: 'Visit a participating location for in-person support where available in your region.',
      mapPlaceholder: 'Interactive branch map — available in a future release. Contact us to find services near you.',
      helpLink: 'Browse the Help Center →',
    },
    businessPage: {
      kicker: 'Business banking',
      title: 'Banking built for growing businesses',
      subtitle:
        'Operating accounts, multicurrency collections, team permissions, and lending—designed for founders, finance teams, and international trade.',
      pillarsTitle: 'Everything your business needs in one relationship',
      pillarsIntro:
        'From day-to-day cash management to cross-border payments and credit, Avenora scales with your operations.',
      pillars: [
        {
          title: 'Business checking & savings',
          desc: 'Separate operating and reserve balances with clear statements, downloadable reports, and role-based access for your team.',
        },
        {
          title: 'Global payments & FX',
          desc: 'Send and receive USD, EUR, GBP, and BRL with transparent FX and tracking for suppliers, payroll, and partners.',
        },
        {
          title: 'Cards & spend controls',
          desc: 'Issue employee cards with limits, merchant categories, and instant freeze—aligned with your approval policies.',
        },
        {
          title: 'Credit & working capital',
          desc: 'Term loans and lines of credit with amortization you can model before you apply, plus grant programs where eligible.',
        },
      ],
      cta: 'Open business online banking',
    },
    ratesPage: {
      kicker: 'Member care',
      title: 'Competitive rates to help your money work harder',
      subtitle: 'Featured savings, certificate, card, and lending rates for Avenora members. Availability varies by region and product.',
      disclaimer:
        '*Annual Percentage Yield (APY) and Annual Percentage Rate (APR) shown are representative offers for qualifying accounts. Rates are subject to change without notice. Terms, fees, and eligibility apply. See product disclosures for full details.',
      products: [
        {
          badge: 'Featured',
          rate: '3.75%',
          unit: 'APY*',
          title: 'High-yield savings',
          category: 'Savings',
          note: 'Competitive yield on qualifying balances with no monthly maintenance fee on eligible accounts.',
        },
        {
          rate: '3.65%',
          unit: 'APY*',
          title: '18-month certificate',
          category: 'Certificates',
          note: 'Lock in a fixed rate for a defined term. Early withdrawal penalties may apply.',
        },
        {
          rate: '4.00%',
          unit: 'APR*',
          title: 'Rewards credit card',
          category: 'Credit',
          note: 'Variable APR for purchases and balance transfers for well-qualified applicants.',
        },
        {
          rate: '15.49%',
          unit: 'APR*',
          title: 'Personal & auto loans',
          category: 'Lending',
          note: 'Fixed-rate installment loans with clear repayment schedules. Subject to credit approval.',
        },
      ],
    },
    mobilePage: {
      kicker: 'Mobile banking',
      title: 'Banking made simple on any device',
      subtitle:
        'Use Avenora on the web or install our progressive web app for a fast, app-like experience—balances, transfers, cards, and alerts without an app store.',
      features: [
        {
          title: 'Works across devices',
          desc: 'Sign in from phone, tablet, or desktop with a consistent experience and secure session handling.',
        },
        {
          title: 'Fast, responsive interface',
          desc: 'Optimized for quick balance checks, transfers, and bill payments when you are on the move.',
        },
        {
          title: 'Alerts & notifications',
          desc: 'Stay informed about card activity, transfers, and important account messages where enabled.',
        },
        {
          title: 'Bank-level security',
          desc: 'Encryption, multi-factor authentication, and card freeze controls help protect your accounts.',
        },
      ],
      installCta: 'Add to home screen',
      bankingCta: 'Open online banking',
      browserNote: 'Compatible with current versions of Chrome, Firefox, Safari, and Edge.',
      previewLabel: 'Available balance',
      previewBalance: 'Sign in to view',
      previewTransfer: 'Transfer',
      previewBills: 'Pay bills',
      previewDisclaimer: 'Illustrative preview. Balances shown after secure sign-in.',
    },
    securityPage: {
      kicker: 'Security center',
      title: 'How we protect your accounts',
      subtitle:
        'Learn about the controls, monitoring, and best practices that help keep your money and data safe at Avenora.',
      topics: [
        {
          title: 'Encryption & secure connections',
          desc: 'Sessions use modern TLS encryption. Sensitive data is protected in transit and at rest according to industry standards.',
        },
        {
          title: 'Multi-factor authentication',
          desc: 'Add an extra verification step at sign-in and for high-risk actions such as adding payees or changing limits.',
        },
        {
          title: 'Identity verification',
          desc: 'Know-your-customer workflows help confirm identity before opening accounts and enabling higher limits.',
        },
        {
          title: 'Card & account controls',
          desc: 'Freeze cards instantly, set spending limits, and review authorizations and settlements in your portal.',
        },
        {
          title: 'Fraud monitoring',
          desc: 'Automated and analyst-reviewed alerts flag unusual activity. Report concerns to member services immediately.',
        },
      ],
      reportTitle: 'Think you have seen fraud?',
      reportDesc:
        'Contact us right away if you notice unauthorized transactions, suspicious login attempts, or phishing messages claiming to be Avenora.',
      reportCta: 'Contact member services',
    },
    tabs: {
      overview: 'Overview',
      wallets: 'Multicurrency Wallets',
      transfers: 'Transfers & Payments',
      cards: 'Payment Cards',
      loans: 'Loans & Credit',
      grants: 'Verified Grants',
      transactions: 'Transaction History',
      statements: 'Monthly Statements',
      profile: 'Profile & Security',
      kyc: 'Identity & KYC',
      helpSupport: 'Help & Inquiries',
      webhooks: 'Mock Webhook Gateway',
      ledger: 'Double-Entry Ledger',
      health: 'Health & Readiness',
      architecture: 'Architecture & Trust',
      security: 'Security & Compliance',
    },
    legal: {
      privacyTitle: 'Privacy & Data Protection Policy (Draft)',
      termsTitle: 'Terms of Service',
      cookiesTitle: 'Cookie Management & Privacy Preferences',
      draftNotice: 'This document describes how you may use Avenora products and services. Please read it together with your account agreements.',
      cookieEssential: 'Strictly Essential (Authentication tokens, CSRF protection, session routing)',
      cookieFunctional: 'Functional Preferences (Language selection, persona switcher state)',
      cookieAnalytics: 'Performance & Telemetry (Disabled by default; no tracking cookies active)',
      savePreferences: 'Save Cookie Preferences',
      acceptAll: 'Accept Recommended Preferences',
    },
    auth: {
      signInTitle: 'Sign In to Avenora',
      registerTitle: 'Create Customer Account',
      forgotPasswordTitle: 'Reset Password',
      resetPasswordTitle: 'Confirm New Password',
      mfaTitle: 'Two-Factor Authentication (TOTP)',
      emailLabel: 'Work or Personal Email',
      passwordLabel: 'Password',
      fullNameLabel: 'Legal Full Name',
      phoneLabel: 'Mobile Phone Number',
      transactionPinLabel: '4-Digit Transaction PIN',
      countryLabel: 'Primary Country of Residence',
      mfaCodeLabel: '6-Digit Authenticator Code',
      submitSignIn: 'Authenticate Session',
      submitRegister: 'Create account',
      prototypeDisclaimer:
        'Identity verification (KYC) may be required before full account features are available, per regulatory requirements.',
    },
    actions: {
      deposit: 'Deposit Funds',
      withdraw: 'Withdraw Funds',
      transfer: 'Internal Transfer',
      convert: 'Currency Exchange (FX)',
      submitKyc: 'Submit Verification',
      calculateAmortization: 'Calculate Amortization',
      applyForLoan: 'Apply for Credit',
      applyForGrant: 'Apply for Grant',
      requestCard: 'Issue Payment Card',
      freezeCard: 'Freeze Card',
      unfreezeCard: 'Unfreeze Card',
    },
    metrics: {
      systemStatus: 'System Status',
      operational: 'OPERATIONAL',
      doubleEntryLedger: 'Double-Entry Ledger',
      verified: 'MATHEMATICALLY BALANCED',
      precisionEngine: 'Monetary Precision',
      zeroFloat: 'ZERO-FLOAT (BigInt)',
      activeCorridors: 'Corridors Configured',
    },
  },
  es: {
    appTitle: 'AVENORA',
    appSubtitle: 'Plataforma Internacional de Software Financiero',
    phaseBadge: 'Banca Avenora',
    prototypeNotice: 'Banca en línea segura',
    noRealMoney: 'Protegemos sus cuentas con cifrado y monitoreo',
    bankingDisclaimer:
      'Importante: Avenora ofrece servicios bancarios y financieros digitales según las licencias y regulaciones aplicables en su jurisdicción. El seguro de depósitos, la disponibilidad de productos y las comisiones varían por región. Consulte sus contratos y divulgaciones.',
    newsBroadcast: {
      label: 'Avenora Wire',
      items: [
        'Cuentas multidivisa en USD, EUR, GBP y BRL con tipos de cambio competitivos',
        'Portal seguro para saldos, transferencias y estados de cuenta',
        'Tarjetas con límites diarios, bloqueo instantáneo y control de comercios',
        'Crédito personal y empresarial con calendarios de pago claros',
        'Programas de subvenciones verificados con seguimiento de elegibilidad',
        'Centro de ayuda y soporte para su cuenta',
      ],
    },
    nav: {
      home: 'Inicio',
      personal: 'Personal',
      business: 'Empresas',
      cards: 'Tarjetas',
      loans: 'Crédito',
      grants: 'Subvenciones',
      about: 'Nosotros',
      help: 'Centro de Ayuda',
      portal: 'Portal de Clientes',
      signIn: 'Iniciar Sesión',
      openAccount: 'Abrir Cuenta',
      onlineBanking: 'Banca en Línea',
      contact: 'Contacto',
      rates: 'Tasas',
      mobile: 'App móvil',
      security: 'Seguridad',
      explore: 'Explorar',
    },
    hero: {
      badge: 'Banca internacional y cuentas multidivisa',
      headline: 'Banca moderna con claridad, control y confianza.',
      subheadline:
        'Avenora integra billeteras multidivisa, tarjetas, crédito y programas de subvenciones en una experiencia segura, con contabilidad rigurosa y estándares de seguridad sólidos.',
      ctaPrimary: 'Ingresar a banca en línea',
      ctaSecondary: 'Explorar productos y servicios',
      stats: {
        zeroFloat: 'Saldos precisos',
        zeroFloatSub: 'Contabilidad respaldada en cada transacción',
        currencies: '4 divisas globales',
        currenciesSub: 'USD, EUR, GBP y BRL en una relación',
        holds: 'Control de tarjetas',
        holdsSub: 'Preautorización y liquidación rastreable',
        ledger: 'Registros transparentes',
        ledgerSub: 'Débitos y créditos en equilibrio',
      },
    },
    features: {
      title: 'Todo lo que necesita en una relación financiera',
      subtitle: 'Servicios bancarios personales y empresariales para clientes internacionales.',
      walletsTitle: 'Billeteras digitales multidivisa',
      walletsDesc: 'Mantenga, convierta, envíe y reciba fondos en USD, EUR, GBP y BRL con tipos en vivo e historial claro.',
      cardsTitle: 'Tarjetas de pago',
      cardsDesc: 'Gestione tarjetas virtuales y de débito, límites de gasto, bloqueo instantáneo y actividad de comercios.',
      loansTitle: 'Crédito y préstamos',
      loansDesc: 'Solicite crédito personal o comercial con términos transparentes y seguimiento en su portal.',
      grantsTitle: 'Programas de subvenciones verificados',
      grantsDesc: 'Explore financiamiento institucional y público con guía de elegibilidad y estado de solicitud.',
    },
    home: {
      newsBroadcast: {
        label: 'Avenora Wire',
        items: [
          'Cuentas multidivisa en USD, EUR, GBP y BRL con tipos de cambio competitivos',
          'Portal seguro para saldos, transferencias y estados de cuenta',
          'Tarjetas con límites diarios, bloqueo instantáneo y control de comercios',
          'Crédito personal y empresarial con calendarios de pago claros',
          'Programas de subvenciones verificados con seguimiento de elegibilidad',
          'Centro de ayuda y soporte para su cuenta',
        ],
      },
      featuresSectionKicker: 'Productos y servicios',
      featureCards: {
        personal: {
          highlight: 'Cuentas globales',
          cta: 'Explorar billeteras',
          bullets: ['Saldos multidivisa con FX transparente', 'Depósitos, retiros y transferencias', 'Estados de cuenta mensuales'],
        },
        cards: {
          highlight: 'Gaste con confianza',
          cta: 'Ver tarjetas',
          bullets: ['Tarjetas virtuales y de débito', 'Límites diarios y bloqueo instantáneo', 'Historial de autorizaciones'],
        },
        loans: {
          highlight: 'Crédito claro',
          cta: 'Ver crédito',
          bullets: ['Solicitudes personales y empresariales', 'Calendarios de amortización', 'Estado en el portal'],
        },
        grants: {
          highlight: 'Financiamiento no dilutivo',
          cta: 'Buscar programas',
          bullets: ['Catálogo institucional y público', 'Listas de elegibilidad', 'Seguimiento de solicitudes'],
        },
      },
      trust: {
        sectionKicker: 'Seguridad y confianza',
        title: 'Diseñado para una gestión del dinero segura',
        subtitle: 'Avenora combina disciplina contable, cifrado y controles operativos para que siempre sepa dónde está su dinero.',
        pillar1Title: 'Contabilidad equilibrada',
        pillar1Body: 'Cada movimiento de fondos se registra con débitos y créditos coincidentes para saldos consistentes y auditables.',
        pillar1Code: 'Cada transacción está balanceada',
        pillar2Title: 'Protección de cuenta y tarjeta',
        pillar2Body: 'Inicio de sesión multifactor, control de sesiones, bloqueo de tarjeta y límites de gasto ante actividad inusual.',
        pillar2Code: 'MFA · Bloqueo de tarjeta · Sesión segura',
        pillar3Title: 'Integraciones seguras',
        pillar3Body: 'Eventos de socios se autentican y procesan de forma idempotente para evitar instrucciones duplicadas o alteradas.',
        pillar3Code: 'Webhooks firmados · Procesamiento idempotente',
        disclosureTitle: 'Información importante sobre Avenora',
        disclosureBody:
          'Avenora ofrece servicios bancarios y financieros digitales según las licencias aplicables. Disponibilidad, comisiones y seguro de depósitos varían por región.',
        disclosureBadge: 'Información al cliente',
      },
      walletPreview: {
        kicker: 'Sus cuentas de un vistazo',
        title: 'Resumen de billetera multidivisa',
        statusBadge: 'Cuentas activas',
        balanceLabel: 'Saldo total estimado',
        transferLabel: 'Vista previa de transferencia',
        footerSecurity: 'Sesión cifrada · Acceso seguro',
        footerStandards: 'Estándares ISO 4217',
      },
      footer: {
        brandBlurb: 'Avenora ofrece cuentas multidivisa, tarjetas, crédito y subvenciones a través de banca en línea segura.',
        statusLine: 'Banca en línea y soporte al cliente disponibles',
        copyright: '© 2026 Avenora Financial Technologies. Todos los derechos reservados.',
        termsLink: 'Términos de servicio',
        financialServices: 'Servicios financieros',
        memberServices: 'Servicios al socio',
        onlineBanking: 'Banca en línea',
        mobileApp: 'App móvil',
        securityCenter: 'Centro de seguridad',
        aboutUs: 'Nosotros',
      },
    },
    about: {
      title: 'Acerca de Avenora',
      subtitle:
        'Plataforma de banca digital para cuentas multidivisa, tarjetas, crédito y subvenciones, con seguridad sólida y controles transparentes.',
      missionTitle: 'Nuestra misión',
      missionDesc:
        'Ayudamos a personas y empresas a gestionar dinero internacionalmente con claridad: saldos precisos, comisiones comprensibles y herramientas en un solo lugar.',
      ledgerTitle: 'Registros de cuenta confiables',
      ledgerDesc:
        'Cada pago, transferencia y autorización de tarjeta se registra con asientos equilibrados para estados de cuenta consistentes.',
      safetyTitle: 'Seguridad y cumplimiento',
      safetyDesc:
        'Autenticación multifactor, cifrado, bloqueo de tarjetas y verificación de identidad protegen sus cuentas y cumplen expectativas regulatorias.',
    },
    help: {
      title: 'Centro de ayuda',
      subtitle: 'Respuestas sobre cuentas, tarjetas, crédito, subvenciones y cómo contactar soporte.',
      searchPlaceholder: 'Buscar temas de ayuda...',
      contactSupport: 'Enviar consulta',
      ticketSent: 'Mensaje recibido. Número de referencia generado abajo.',
    },
    contactPage: {
      kicker: 'Contáctenos',
      title: 'Contáctenos',
      subtitle:
        '¿Preguntas sobre su cuenta, tarjetas, crédito o subvenciones? Nuestro equipo de atención al socio está listo para ayudarle.',
      formTitle: 'Envíenos un mensaje',
      formIntro:
        'Complete el formulario y dirigiremos su solicitud al equipo adecuado. Para fraude o tarjetas urgentes, llame a atención al socio.',
      fullName: 'Nombre completo',
      email: 'Correo electrónico',
      subject: 'Asunto',
      message: 'Mensaje',
      send: 'Enviar mensaje',
      success: 'Gracias — recibimos su mensaje. Guarde esta referencia para seguimiento:',
      asideTitle: 'Otras formas de contacto',
      asideIntro:
        'También puede usar los canales siguientes. La mensajería segura está disponible tras iniciar sesión en banca en línea.',
      phoneTitle: 'Teléfono',
      phoneValue: '+1 (800) 284-6672',
      phoneNote: 'Atención al socio · Línea 24/7 de fraude y tarjetas',
      emailTitle: 'Correo',
      emailValue: 'support@avenorabank.com',
      emailNote: 'Respondemos normalmente en un día hábil',
      visitTitle: 'Correspondencia',
      visitAddress:
        'Avenora Member Services\n1200 Financial Plaza, Suite 400\nNew York, NY 10004\nEstados Unidos',
      hoursTitle: 'Horario',
      hours: 'Lun–Vie: 8:00 – 18:00 (ET)\nSáb: 9:00 – 13:00 (ET)\nDom: Cerrado',
      mapTitle: 'Sucursales y ubicaciones asociadas',
      mapSubtitle: 'Visite un punto participante para atención presencial donde esté disponible.',
      mapPlaceholder:
        'Mapa interactivo de sucursales — próximamente. Contáctenos para ubicar servicios cerca de usted.',
      helpLink: 'Ver el Centro de ayuda →',
    },
    businessPage: {
      kicker: 'Banca empresarial',
      title: 'Banca para empresas en crecimiento',
      subtitle:
        'Cuentas operativas, cobros multidivisa, permisos de equipo y crédito para fundadores, finanzas y comercio internacional.',
      pillarsTitle: 'Todo lo que su empresa necesita',
      pillarsIntro: 'Desde la gestión diaria de efectivo hasta pagos internacionales y crédito, Avenora crece con su operación.',
      pillars: [
        {
          title: 'Cuentas corrientes y de ahorro',
          desc: 'Separe saldos operativos y de reserva con estados claros, informes descargables y acceso por roles.',
        },
        {
          title: 'Pagos globales y FX',
          desc: 'Envíe y reciba USD, EUR, GBP y BRL con FX transparente para proveedores, nómina y socios.',
        },
        {
          title: 'Tarjetas y control de gasto',
          desc: 'Emita tarjetas con límites, categorías de comercio y bloqueo instantáneo según sus políticas.',
        },
        {
          title: 'Crédito y capital de trabajo',
          desc: 'Préstamos y líneas con amortización clara y programas de subvención cuando aplique.',
        },
      ],
      cta: 'Abrir banca empresarial en línea',
    },
    ratesPage: {
      kicker: 'Atención al socio',
      title: 'Tasas competitivas para hacer crecer su dinero',
      subtitle: 'Tasas destacadas de ahorro, certificados, tarjetas y crédito. La disponibilidad varía por región y producto.',
      disclaimer:
        '*APY y APR mostrados son ofertas representativas para cuentas elegibles. Las tasas pueden cambiar sin previo aviso. Aplican términos y elegibilidad.',
      products: [
        {
          badge: 'Destacado',
          rate: '3.75%',
          unit: 'APY*',
          title: 'Ahorro de alto rendimiento',
          category: 'Ahorro',
          note: 'Rendimiento competitivo en saldos elegibles sin cuota de mantenimiento en cuentas calificadas.',
        },
        {
          rate: '3.65%',
          unit: 'APY*',
          title: 'Certificado a 18 meses',
          category: 'Certificados',
          note: 'Tasa fija por plazo definido. Pueden aplicar penalidades por retiro anticipado.',
        },
        {
          rate: '4.00%',
          unit: 'APR*',
          title: 'Tarjeta con recompensas',
          category: 'Crédito',
          note: 'APR variable para compras y transferencias de saldo para solicitantes calificados.',
        },
        {
          rate: '15.49%',
          unit: 'APR*',
          title: 'Préstamos personales y automotrices',
          category: 'Crédito',
          note: 'Préstamos a plazo fijo con calendarios claros. Sujeto a aprobación crediticia.',
        },
      ],
    },
    mobilePage: {
      kicker: 'Banca móvil',
      title: 'Banca simple en cualquier dispositivo',
      subtitle:
        'Use Avenora en la web o instale nuestra aplicación web progresiva: saldos, transferencias, tarjetas y alertas sin tienda de apps.',
      features: [
        {
          title: 'Funciona en todos los dispositivos',
          desc: 'Inicie sesión desde teléfono, tableta o escritorio con experiencia coherente y sesión segura.',
        },
        {
          title: 'Interfaz rápida',
          desc: 'Optimizada para consultar saldos, transferir y pagar facturas en movimiento.',
        },
        {
          title: 'Alertas y notificaciones',
          desc: 'Manténgase informado sobre tarjetas, transferencias y mensajes importantes cuando estén activas.',
        },
        {
          title: 'Seguridad de nivel bancario',
          desc: 'Cifrado, autenticación multifactor y bloqueo de tarjetas protegen sus cuentas.',
        },
      ],
      installCta: 'Añadir a pantalla de inicio',
      bankingCta: 'Abrir banca en línea',
      browserNote: 'Compatible con versiones actuales de Chrome, Firefox, Safari y Edge.',
      previewLabel: 'Saldo disponible',
      previewBalance: 'Inicie sesión para ver',
      previewTransfer: 'Transferir',
      previewBills: 'Pagar facturas',
      previewDisclaimer: 'Vista ilustrativa. Los saldos se muestran tras iniciar sesión de forma segura.',
    },
    securityPage: {
      kicker: 'Centro de seguridad',
      title: 'Cómo protegemos sus cuentas',
      subtitle:
        'Conozca los controles, el monitoreo y las buenas prácticas que ayudan a mantener seguros su dinero y sus datos en Avenora.',
      topics: [
        {
          title: 'Cifrado y conexiones seguras',
          desc: 'Las sesiones usan TLS moderno. Los datos sensibles se protegen en tránsito y en reposo según estándares del sector.',
        },
        {
          title: 'Autenticación multifactor',
          desc: 'Añada un paso extra al iniciar sesión y en acciones de alto riesgo como nuevos beneficiarios o cambios de límites.',
        },
        {
          title: 'Verificación de identidad',
          desc: 'Los flujos KYC confirman la identidad antes de abrir cuentas y habilitar límites mayores.',
        },
        {
          title: 'Controles de tarjeta y cuenta',
          desc: 'Bloquee tarjetas al instante, defina límites y revise autorizaciones en su portal.',
        },
        {
          title: 'Monitoreo de fraude',
          desc: 'Alertas automáticas y revisadas señalan actividad inusual. Reporte de inmediato a atención al socio.',
        },
      ],
      reportTitle: '¿Sospecha de fraude?',
      reportDesc:
        'Contáctenos de inmediato si ve transacciones no autorizadas, inicios de sesión sospechosos o mensajes de phishing.',
      reportCta: 'Contactar atención al socio',
    },
    tabs: {
      overview: 'Resumen de Plataforma',
      wallets: 'Billeteras Multidivisa',
      transfers: 'Transferencias y Pagos',
      cards: 'Tarjetas de Pago',
      loans: 'Préstamos y Crédito',
      grants: 'Subvenciones Verificadas',
      transactions: 'Historial de Transacciones',
      statements: 'Estados de Cuenta Mensuales',
      profile: 'Perfil y Seguridad',
      kyc: 'Identidad y KYC',
      helpSupport: 'Centro de Soporte',
      webhooks: 'Pasarela de Webhooks',
      ledger: 'Libro Mayor de Partida Doble',
      health: 'Salud y Diagnóstico',
      architecture: 'Arquitectura y Confianza',
      security: 'Seguridad y Cumplimiento',
    },
    legal: {
      privacyTitle: 'Política de Privacidad y Protección de Datos (Borrador)',
      termsTitle: 'Términos de servicio',
      cookiesTitle: 'Gestión de Cookies y Preferencias',
      draftNotice: 'Este documento describe cómo puede utilizar los productos y servicios de Avenora. Léalo junto con los acuerdos de su cuenta.',
      cookieEssential: 'Estrictamente Esenciales (Tokens de autenticación, CSRF, enrutamiento seguro)',
      cookieFunctional: 'Preferencias Funcionales (Idioma, selector de perfil activo)',
      cookieAnalytics: 'Rendimiento y Telemetría (Desactivadas por defecto; sin rastreo de terceros)',
      savePreferences: 'Guardar Preferencias de Cookies',
      acceptAll: 'Aceptar Preferencias Recomendadas',
    },
    auth: {
      signInTitle: 'Iniciar Sesión en Avenora',
      registerTitle: 'Crear Cuenta de Cliente',
      forgotPasswordTitle: 'Restablecer Contraseña',
      resetPasswordTitle: 'Confirmar Nueva Contraseña',
      mfaTitle: 'Autenticación de Dos Factores (TOTP)',
      emailLabel: 'Correo Electrónico',
      passwordLabel: 'Contraseña',
      fullNameLabel: 'Nombre Legal Completo',
      phoneLabel: 'Número de Teléfono Móvil',
      transactionPinLabel: 'PIN de Transacción de 4 Dígitos',
      countryLabel: 'País Principal de Residencia',
      mfaCodeLabel: 'Código de Autenticación de 6 Dígitos',
      submitSignIn: 'Autenticar Sesión',
      submitRegister: 'Abrir su cuenta',
      prototypeDisclaimer:
        'La verificación de identidad (KYC) puede ser necesaria antes de habilitar todas las funciones de la cuenta, según la normativa.',
    },
    actions: {
      deposit: 'Depositar fondos',
      withdraw: 'Retirar fondos',
      transfer: 'Transferencia Interna',
      convert: 'Cambio de Divisas (FX)',
      submitKyc: 'Enviar Verificación',
      calculateAmortization: 'Calcular Amortización',
      applyForLoan: 'Solicitar Préstamo',
      applyForGrant: 'Solicitar Subvención',
      requestCard: 'Emitir Tarjeta',
      freezeCard: 'Bloquear Tarjeta',
      unfreezeCard: 'Desbloquear Tarjeta',
    },
    metrics: {
      systemStatus: 'Estado del Sistema',
      operational: 'OPERACIONAL',
      doubleEntryLedger: 'Libro de Partida Doble',
      verified: 'MATEMÁTICAMENTE EQUILIBRADO',
      precisionEngine: 'Precisión Monetaria',
      zeroFloat: 'CERO FLOTANTE (BigInt)',
      activeCorridors: 'Corredores Configurados',
    },
  },
  'pt-BR': {
    appTitle: 'AVENORA',
    appSubtitle: 'Plataforma Internacional de Tecnologia Financeira',
    phaseBadge: 'Avenora Banking',
    prototypeNotice: 'Internet banking seguro',
    noRealMoney: 'Protegemos suas contas com criptografia e monitoramento',
    bankingDisclaimer:
      'Importante: a Avenora oferece serviços bancários e financeiros digitais conforme licenças e regulamentos aplicáveis na sua jurisdição. Seguro de depósitos, disponibilidade de produtos e tarifas variam por região. Consulte seus contratos e divulgações.',
    newsBroadcast: {
      label: 'Avenora Wire',
      items: [
        'Contas multidivisas em USD, EUR, GBP e BRL com câmbio competitivo',
        'Portal seguro para saldos, transferências e extratos',
        'Cartões com limites diários, bloqueio instantâneo e controle de estabelecimentos',
        'Crédito pessoal e empresarial com parcelas claras',
        'Programas de fomento verificados com acompanhamento de elegibilidade',
        'Central de ajuda e suporte à conta',
      ],
    },
    nav: {
      home: 'Início',
      personal: 'Pessoal',
      business: 'Empresas',
      cards: 'Cartões',
      loans: 'Crédito',
      grants: 'Fomento',
      about: 'Sobre',
      help: 'Central de Ajuda',
      portal: 'Portal do Cliente',
      signIn: 'Entrar',
      openAccount: 'Abrir Conta',
      onlineBanking: 'Internet Banking',
      contact: 'Contato',
      rates: 'Taxas',
      mobile: 'App móvel',
      security: 'Segurança',
      explore: 'Conhecer',
    },
    hero: {
      badge: 'Banco internacional e contas multidivisas',
      headline: 'Banco moderno com clareza, controle e confiança.',
      subheadline:
        'A Avenora reúne carteiras multidivisas, cartões, crédito e programas de fomento em uma experiência segura, com contabilidade rigorosa e padrões de segurança sólidos.',
      ctaPrimary: 'Acessar internet banking',
      ctaSecondary: 'Conhecer produtos e serviços',
      stats: {
        zeroFloat: 'Saldos precisos',
        zeroFloatSub: 'Contabilidade em cada transação',
        currencies: '4 moedas globais',
        currenciesSub: 'USD, EUR, GBP e BRL em um relacionamento',
        holds: 'Controle de cartões',
        holdsSub: 'Pré-autorização e liquidação rastreáveis',
        ledger: 'Registros transparentes',
        ledgerSub: 'Débitos e créditos balanceados',
      },
    },
    features: {
      title: 'Tudo o que você precisa em um relacionamento financeiro',
      subtitle: 'Serviços bancários pessoais e empresariais para clientes internacionais.',
      walletsTitle: 'Carteiras digitais multidivisas',
      walletsDesc: 'Mantenha, converta, envie e receba fundos em USD, EUR, GBP e BRL com cotações ao vivo e histórico claro.',
      cardsTitle: 'Cartões de pagamento',
      cardsDesc: 'Gerencie cartões virtuais e de débito, limites, bloqueio instantâneo e atividade de estabelecimentos.',
      loansTitle: 'Crédito e empréstimos',
      loansDesc: 'Solicite crédito pessoal ou empresarial com termos transparentes e acompanhamento no portal.',
      grantsTitle: 'Programas de fomento verificados',
      grantsDesc: 'Explore financiamento institucional e público com orientação de elegibilidade e status da solicitação.',
    },
    home: {
      newsBroadcast: {
        label: 'Avenora Wire',
        items: [
          'Contas multidivisas em USD, EUR, GBP e BRL com câmbio competitivo',
          'Portal seguro para saldos, transferências e extratos',
          'Cartões com limites diários, bloqueio instantâneo e controle de estabelecimentos',
          'Crédito pessoal e empresarial com parcelas claras',
          'Programas de fomento verificados com acompanhamento de elegibilidade',
          'Central de ajuda e suporte à conta',
        ],
      },
      featuresSectionKicker: 'Produtos e serviços',
      featureCards: {
        personal: {
          highlight: 'Contas globais',
          cta: 'Explorar carteiras',
          bullets: ['Saldos multidivisas com FX transparente', 'Depósitos, saques e transferências', 'Extratos mensais'],
        },
        cards: {
          highlight: 'Gaste com confiança',
          cta: 'Ver cartões',
          bullets: ['Cartões virtuais e de débito', 'Limites diários e bloqueio instantâneo', 'Histórico de autorizações'],
        },
        loans: {
          highlight: 'Crédito com clareza',
          cta: 'Ver crédito',
          bullets: ['Solicitações pessoais e empresariais', 'Cronogramas de amortização', 'Status no portal'],
        },
        grants: {
          highlight: 'Financiamento não dilutivo',
          cta: 'Buscar programas',
          bullets: ['Catálogo institucional e público', 'Listas de elegibilidade', 'Acompanhamento de solicitações'],
        },
      },
      trust: {
        sectionKicker: 'Segurança e confiança',
        title: 'Feito para gestão segura do seu dinheiro',
        subtitle: 'A Avenora combina disciplina contábil, criptografia e controles operacionais para você saber onde está seu saldo.',
        pillar1Title: 'Contabilidade balanceada',
        pillar1Body: 'Cada movimentação é registrada com débitos e créditos correspondentes para saldos consistentes e auditáveis.',
        pillar1Code: 'Cada transação é balanceada',
        pillar2Title: 'Proteção de conta e cartão',
        pillar2Body: 'Login multifator, controle de sessão, bloqueio de cartão e limites de gasto diante de atividade incomum.',
        pillar2Code: 'MFA · Bloqueio de cartão · Sessão segura',
        pillar3Title: 'Integrações seguras',
        pillar3Body: 'Eventos de parceiros são autenticados e processados de forma idempotente.',
        pillar3Code: 'Webhooks assinados · Processamento idempotente',
        disclosureTitle: 'Informações importantes sobre a Avenora',
        disclosureBody:
          'A Avenora oferece serviços bancários e financeiros digitais conforme licenças aplicáveis. Disponibilidade, tarifas e seguro de depósitos variam por região.',
        disclosureBadge: 'Informações ao cliente',
      },
      walletPreview: {
        kicker: 'Suas contas em um só lugar',
        title: 'Visão geral multidivisa',
        statusBadge: 'Contas ativas',
        balanceLabel: 'Saldo total estimado',
        transferLabel: 'Prévia de transferência',
        footerSecurity: 'Sessão criptografada · Acesso seguro',
        footerStandards: 'Padrões ISO 4217',
      },
      footer: {
        brandBlurb: 'A Avenora oferece contas multidivisas, cartões, crédito e fomento via internet banking seguro.',
        statusLine: 'Internet banking e suporte disponíveis',
        copyright: '© 2026 Avenora Financial Technologies. Todos os direitos reservados.',
        termsLink: 'Termos de serviço',
        financialServices: 'Serviços financeiros',
        memberServices: 'Serviços ao cliente',
        onlineBanking: 'Internet banking',
        mobileApp: 'App móvel',
        securityCenter: 'Central de segurança',
        aboutUs: 'Sobre nós',
      },
    },
    about: {
      title: 'Sobre a Avenora',
      subtitle:
        'Plataforma de banco digital para contas multidivisas, cartões, crédito e fomento, com segurança sólida e controles transparentes.',
      missionTitle: 'Nossa missão',
      missionDesc:
        'Ajudamos pessoas e empresas a gerir dinheiro internacionalmente com clareza: saldos precisos, tarifas compreensíveis e ferramentas em um só lugar.',
      ledgerTitle: 'Registros de conta confiáveis',
      ledgerDesc:
        'Cada pagamento, transferência e autorização de cartão é registrado com lançamentos balanceados para extratos consistentes.',
      safetyTitle: 'Segurança e conformidade',
      safetyDesc:
        'Autenticação multifator, criptografia, bloqueio de cartões e verificação de identidade protegem suas contas.',
    },
    help: {
      title: 'Central de ajuda',
      subtitle: 'Respostas sobre contas, cartões, crédito, fomento e como falar com o suporte.',
      searchPlaceholder: 'Pesquisar tópicos de ajuda...',
      contactSupport: 'Enviar mensagem',
      ticketSent: 'Mensagem recebida. Número de referência gerado abaixo.',
    },
    contactPage: {
      kicker: 'Fale conosco',
      title: 'Contato',
      subtitle:
        'Dúvidas sobre conta, cartões, crédito ou fomento? Nossa equipe de atendimento ao associado está pronta para ajudar.',
      formTitle: 'Envie uma mensagem',
      formIntro:
        'Preencha o formulário e encaminharemos sua solicitação à equipe certa. Para fraude ou cartões urgentes, ligue para o atendimento.',
      fullName: 'Nome completo',
      email: 'E-mail',
      subject: 'Assunto',
      message: 'Mensagem',
      send: 'Enviar mensagem',
      success: 'Obrigado — recebemos sua mensagem. Guarde esta referência para acompanhamento:',
      asideTitle: 'Outras formas de contato',
      asideIntro:
        'Use os canais abaixo. Mensagens seguras também estão disponíveis após entrar no internet banking.',
      phoneTitle: 'Telefone',
      phoneValue: '+1 (800) 284-6672',
      phoneNote: 'Atendimento ao associado · Linha 24h fraude e cartões',
      emailTitle: 'E-mail',
      emailValue: 'support@avenorabank.com',
      emailNote: 'Resposta em até um dia útil, em geral',
      visitTitle: 'Correspondência',
      visitAddress:
        'Avenora Member Services\n1200 Financial Plaza, Suite 400\nNew York, NY 10004\nEstados Unidos',
      hoursTitle: 'Horário de atendimento',
      hours: 'Seg–Sex: 8h – 18h (ET)\nSáb: 9h – 13h (ET)\nDom: Fechado',
      mapTitle: 'Agências e locais parceiros',
      mapSubtitle: 'Visite um ponto participante para suporte presencial onde disponível.',
      mapPlaceholder:
        'Mapa interativo de agências — em breve. Entre em contato para localizar serviços perto de você.',
      helpLink: 'Acessar a Central de ajuda →',
    },
    businessPage: {
      kicker: 'Banco empresarial',
      title: 'Banco feito para empresas em crescimento',
      subtitle:
        'Contas operacionais, recebimentos multidivisas, permissões de equipe e crédito para fundadores, finanças e comércio internacional.',
      pillarsTitle: 'Tudo o que sua empresa precisa',
      pillarsIntro: 'Da gestão diária de caixa a pagamentos internacionais e crédito, a Avenora escala com sua operação.',
      pillars: [
        {
          title: 'Contas correntes e poupança',
          desc: 'Separe saldos operacionais e de reserva com extratos claros, relatórios e acesso por função.',
        },
        {
          title: 'Pagamentos globais e câmbio',
          desc: 'Envie e receba USD, EUR, GBP e BRL com câmbio transparente para fornecedores, folha e parceiros.',
        },
        {
          title: 'Cartões e controle de gastos',
          desc: 'Emita cartões com limites, categorias de estabelecimento e bloqueio instantâneo conforme suas políticas.',
        },
        {
          title: 'Crédito e capital de giro',
          desc: 'Empréstimos e linhas com amortização clara e programas de fomento quando elegível.',
        },
      ],
      cta: 'Abrir internet banking empresarial',
    },
    ratesPage: {
      kicker: 'Cuidado com o cliente',
      title: 'Taxas competitivas para fazer seu dinheiro render',
      subtitle: 'Taxas em destaque de poupança, certificados, cartões e crédito. Disponibilidade varia por região e produto.',
      disclaimer:
        '*APY e APR exibidos são ofertas representativas para contas elegíveis. Taxas podem mudar sem aviso. Termos e elegibilidade se aplicam.',
      products: [
        {
          badge: 'Destaque',
          rate: '3.75%',
          unit: 'APY*',
          title: 'Poupança de alto rendimento',
          category: 'Poupança',
          note: 'Rendimento competitivo em saldos elegíveis sem taxa de manutenção em contas qualificadas.',
        },
        {
          rate: '3.65%',
          unit: 'APY*',
          title: 'Certificado de 18 meses',
          category: 'Certificados',
          note: 'Taxa fixa por prazo definido. Penalidades por resgate antecipado podem aplicar.',
        },
        {
          rate: '4.00%',
          unit: 'APR*',
          title: 'Cartão com recompensas',
          category: 'Crédito',
          note: 'APR variável para compras e transferências de saldo para candidatos qualificados.',
        },
        {
          rate: '15.49%',
          unit: 'APR*',
          title: 'Empréstimos pessoais e automotivos',
          category: 'Crédito',
          note: 'Parcelas com taxa fixa e cronogramas claros. Sujeito a aprovação de crédito.',
        },
      ],
    },
    mobilePage: {
      kicker: 'Banco móvel',
      title: 'Banco simples em qualquer dispositivo',
      subtitle:
        'Use a Avenora na web ou instale nosso app web progressivo — saldos, transferências, cartões e alertas sem loja de apps.',
      features: [
        {
          title: 'Funciona em todos os dispositivos',
          desc: 'Entre pelo celular, tablet ou desktop com experiência consistente e sessão segura.',
        },
        {
          title: 'Interface rápida',
          desc: 'Otimizada para consultar saldos, transferir e pagar contas em movimento.',
        },
        {
          title: 'Alertas e notificações',
          desc: 'Mantenha-se informado sobre cartões, transferências e mensagens importantes quando ativadas.',
        },
        {
          title: 'Segurança em nível bancário',
          desc: 'Criptografia, autenticação multifator e bloqueio de cartões protegem suas contas.',
        },
      ],
      installCta: 'Adicionar à tela inicial',
      bankingCta: 'Acessar internet banking',
      browserNote: 'Compatível com versões atuais do Chrome, Firefox, Safari e Edge.',
      previewLabel: 'Saldo disponível',
      previewBalance: 'Entre para visualizar',
      previewTransfer: 'Transferir',
      previewBills: 'Pagar contas',
      previewDisclaimer: 'Prévia ilustrativa. Saldos exibidos após login seguro.',
    },
    securityPage: {
      kicker: 'Central de segurança',
      title: 'Como protegemos suas contas',
      subtitle:
        'Conheça os controles, monitoramento e boas práticas que ajudam a manter seu dinheiro e seus dados seguros na Avenora.',
      topics: [
        {
          title: 'Criptografia e conexões seguras',
          desc: 'Sessões usam TLS moderno. Dados sensíveis são protegidos em trânsito e em repouso conforme padrões do setor.',
        },
        {
          title: 'Autenticação multifator',
          desc: 'Adicione verificação extra no login e em ações de alto risco, como novos favorecidos ou alteração de limites.',
        },
        {
          title: 'Verificação de identidade',
          desc: 'Fluxos KYC confirmam identidade antes de abrir contas e habilitar limites maiores.',
        },
        {
          title: 'Controles de cartão e conta',
          desc: 'Bloqueie cartões na hora, defina limites e revise autorizações no portal.',
        },
        {
          title: 'Monitoramento de fraude',
          desc: 'Alertas automáticos e revisados sinalizam atividade incomum. Reporte imediatamente ao atendimento.',
        },
      ],
      reportTitle: 'Suspeita de fraude?',
      reportDesc:
        'Entre em contato imediatamente se notar transações não autorizadas, logins suspeitos ou mensagens de phishing.',
      reportCta: 'Falar com o atendimento',
    },
    tabs: {
      overview: 'Visão Geral',
      wallets: 'Carteiras Multimoeda',
      transfers: 'Transferências e Pagamentos',
      cards: 'Cartões de Pagamento',
      loans: 'Empréstimos e Crédito',
      grants: 'Programas de Fomento',
      transactions: 'Extrato de Transações',
      statements: 'Extratos Mensais',
      profile: 'Perfil e Segurança',
      kyc: 'Identidade e KYC',
      helpSupport: 'Suporte e Atendimento',
      webhooks: 'Gateway de Webhooks',
      ledger: 'Razão de Partida Dobrada',
      health: 'Saúde e Prontidão',
      architecture: 'Arquitetura e Confiança',
      security: 'Segurança e Conformidade',
    },
    legal: {
      privacyTitle: 'Política de Privacidade e Proteção de Dados (Minuta)',
      termsTitle: 'Termos de serviço',
      cookiesTitle: 'Gerenciamento de Cookies e Preferências',
      draftNotice: 'Este documento descreve como você pode usar os produtos e serviços da Avenora. Leia-o junto com os contratos da sua conta.',
      cookieEssential: 'Estritamente Necessários (Tokens de autenticação, CSRF, roteamento de sessão segura)',
      cookieFunctional: 'Preferências funcionais (Seleção de idioma e preferências da sessão)',
      cookieAnalytics: 'Desempenho e Telemetria (Desativados por padrão; sem rastreamento de terceiros)',
      savePreferences: 'Salvar Preferências de Cookies',
      acceptAll: 'Aceitar Preferências Recomendadas',
    },
    auth: {
      signInTitle: 'Entrar na Avenora',
      registerTitle: 'Criar Conta de Cliente',
      forgotPasswordTitle: 'Recuperar Senha',
      resetPasswordTitle: 'Confirmar Nova Senha',
      mfaTitle: 'Autenticação de Dois Fatores (TOTP)',
      emailLabel: 'E-mail Profissional ou Pessoal',
      passwordLabel: 'Senha',
      fullNameLabel: 'Nome Completo Legal',
      phoneLabel: 'Número de Telefone Celular',
      transactionPinLabel: 'PIN de Transação de 4 Dígitos',
      countryLabel: 'País Principal de Residência',
      mfaCodeLabel: 'Código de 6 Dígitos do Aplicativo',
      submitSignIn: 'Autenticar Sessão',
      submitRegister: 'Abrir sua conta',
      prototypeDisclaimer:
        'A verificação de identidade (KYC) pode ser necessária antes de liberar todos os recursos da conta, conforme regulamentação.',
    },
    actions: {
      deposit: 'Depositar fundos',
      withdraw: 'Sacar fundos',
      transfer: 'Transferência Interna',
      convert: 'Conversão de Moedas (FX)',
      submitKyc: 'Enviar Verificação',
      calculateAmortization: 'Calcular Amortização',
      applyForLoan: 'Solicitar Empréstimo',
      applyForGrant: 'Solicitar Fomento',
      requestCard: 'Emitir Cartão',
      freezeCard: 'Congelar Cartão',
      unfreezeCard: 'Descongelar Cartão',
    },
    metrics: {
      systemStatus: 'Status do Sistema',
      operational: 'OPERACIONAL',
      doubleEntryLedger: 'Partida Dobrada',
      verified: 'MATEMATICAMENTE EQUILIBRADO',
      precisionEngine: 'Precisão Monetaria',
      zeroFloat: 'ZERO PONTO FLUTUANTE (BigInt)',
      activeCorridors: 'Corredores Configurados',
    },
  },
};

interface LocalizationContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: Translations;
}

const LocalizationContext = createContext<LocalizationContextType | null>(null);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>('en');

  return (
    <LocalizationContext.Provider
      value={{
        locale,
        setLocale,
        t: DICTIONARY[locale],
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}
