/**
 * Individual tax identifiers by signup country.
 * Company-only numbers are omitted. Territories reuse the numbers
 * actually issued to people who live there.
 */

export interface TaxIdOption {
  code: string;
  label: string;
  placeholder: string;
  pattern: string;
  patternHint: string;
}

function digits(
  code: string,
  label: string,
  placeholder: string,
  length: number | [number, number],
): TaxIdOption {
  const pattern =
    typeof length === 'number' ? `^\\d{${length}}$` : `^\\d{${length[0]},${length[1]}}$`;
  const patternHint =
    typeof length === 'number'
      ? `${label} must be ${length} digits.`
      : `${label} must be ${length[0]} to ${length[1]} digits.`;
  return { code, label, placeholder, pattern, patternHint };
}

function formatted(
  code: string,
  label: string,
  placeholder: string,
  pattern: string,
  patternHint: string,
): TaxIdOption {
  return { code, label, placeholder, pattern, patternHint };
}

const US_OPTIONS: TaxIdOption[] = [
  digits('US_SSN', 'Social Security Number (SSN)', '123456789', 9),
  formatted(
    'US_ITIN',
    'Individual Taxpayer Identification Number (ITIN)',
    '912345678',
    '^9\\d{8}$',
    'US ITIN must be 9 digits and start with 9.',
  ),
];

const GB_OPTIONS: TaxIdOption[] = [
  formatted(
    'GB_NINO',
    'National Insurance number (NINO)',
    'AB123456C',
    '^[A-CEGHJ-PR-TW-Z]{2}\\d{6}[A-D]$',
    'UK National Insurance number must be two letters, six digits, and a suffix letter A–D.',
  ),
  digits('GB_UTR', 'Unique Taxpayer Reference (UTR)', '1234567890', 10),
];

const FR_OPTIONS: TaxIdOption[] = [
  digits('FR_SPI', 'Numéro fiscal de référence (SPI)', '1234567890123', 13),
];

const ES_OPTIONS: TaxIdOption[] = [
  formatted(
    'ES_DNI',
    'Documento Nacional de Identidad (DNI)',
    '12345678Z',
    '^\\d{8}[A-Z]$',
    'Spanish DNI must be 8 digits followed by a check letter.',
  ),
  formatted(
    'ES_NIE',
    'Número de Identidad de Extranjero (NIE)',
    'X1234567L',
    '^[XYZ]\\d{7}[A-Z]$',
    'Spanish NIE must start with X, Y, or Z, followed by 7 digits and a check letter.',
  ),
];

const NL_OPTIONS: TaxIdOption[] = [
  digits('NL_BSN', 'Burgerservicenummer (BSN)', '123456789', 9),
];

const AU_OPTIONS: TaxIdOption[] = [
  digits('AU_TFN', 'Tax File Number (TFN)', '123456789', [8, 9]),
];

const NZ_OPTIONS: TaxIdOption[] = [
  digits('NZ_IRD', 'IRD number', '123456789', [8, 9]),
];

const NO_OPTIONS: TaxIdOption[] = [
  digits('NO_FNUMMER', 'Fødselsnummer', '12345678901', 11),
  digits('NO_DNUMMER', 'D-nummer', '42345678901', 11),
];

const FI_OPTIONS: TaxIdOption[] = [
  formatted(
    'FI_HETU',
    'Henkilötunnus (HETU)',
    '010190123A',
    '^\\d{9}[A-Z0-9]$',
    'Finnish henkilötunnus must be 9 digits and a check character after spaces and hyphens are removed.',
  ),
];

const SE_OPTIONS: TaxIdOption[] = [
  digits('SE_PERSONNUMMER', 'Personnummer', '199001011234', [10, 12]),
  digits('SE_SAMORDNINGSNUMMER', 'Samordningsnummer', '199001611234', [10, 12]),
];

const DK_OPTIONS: TaxIdOption[] = [
  digits('DK_CPR', 'CPR-nummer', '0101901234', 10),
];

const CH_OPTIONS: TaxIdOption[] = [
  digits('CH_AHV', 'AHV-Nummer / Numéro AVS', '7561234567890', 13),
];

/** Signup codes that are not countries or do not issue an individual tax identifier. */
export const TAX_ID_UNSUPPORTED_COUNTRY_CODES: readonly string[] = [
  'AN',
  'AQ',
  'BU',
  'BV',
  'CP',
  'CQ',
  'CS',
  'DD',
  'DG',
  'DY',
  'EH',
  'EU',
  'EZ',
  'FX',
  'GS',
  'HM',
  'HV',
  'IO',
  'NH',
  'QO',
  'RH',
  'SU',
  'TF',
  'TP',
  'UM',
  'UN',
  'VA',
  'VD',
  'XA',
  'XB',
  'YD',
  'YU',
  'ZR',
  'ZZ',
];

/** Exceptional alpha-2 aliases. UK is not an official code; GB is. */
export const TAX_ID_COUNTRY_ALIASES: Readonly<Record<string, string>> = {
  UK: 'GB',
};

export function resolveTaxIdCountryCode(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  return TAX_ID_COUNTRY_ALIASES[code] ?? code;
}

export const TAX_ID_CATALOG: Readonly<Record<string, readonly TaxIdOption[]>> = {
  US: US_OPTIONS,
  AS: US_OPTIONS,
  GU: US_OPTIONS,
  MP: US_OPTIONS,
  PR: US_OPTIONS,
  VI: US_OPTIONS,

  GB: GB_OPTIONS,
  FK: [
    formatted(
      'FK_TIN',
      'Falkland Islands tax reference',
      '123456',
      '^[A-Z0-9]{5,12}$',
      'Falkland Islands tax reference must be 5 to 12 letters or digits.',
    ),
  ],
  GI: [
    formatted(
      'GI_TIN',
      'Gibraltar taxpayer reference number',
      '123456',
      '^[A-Z0-9]{5,12}$',
      'Gibraltar taxpayer reference must be 5 to 12 letters or digits.',
    ),
  ],
  GG: [
    formatted(
      'GG_TRN',
      'Guernsey tax reference number',
      '123456',
      '^[A-Z0-9]{5,12}$',
      'Guernsey tax reference must be 5 to 12 letters or digits.',
    ),
  ],
  IM: [
    formatted(
      'IM_TRN',
      'Isle of Man tax reference number',
      '123456',
      '^[A-Z0-9]{5,12}$',
      'Isle of Man tax reference must be 5 to 12 letters or digits.',
    ),
  ],
  JE: [
    formatted(
      'JE_TIN',
      'Jersey tax identification number',
      '123456',
      '^[A-Z0-9]{5,12}$',
      'Jersey tax identification number must be 5 to 12 letters or digits.',
    ),
  ],
  PN: GB_OPTIONS,
  SH: [
    formatted(
      'SH_TIN',
      'Saint Helena income tax number',
      '123456',
      '^[A-Z0-9]{5,12}$',
      'Saint Helena income tax number must be 5 to 12 letters or digits.',
    ),
  ],
  TA: GB_OPTIONS,

  FR: FR_OPTIONS,
  BL: FR_OPTIONS,
  GF: FR_OPTIONS,
  GP: FR_OPTIONS,
  MF: FR_OPTIONS,
  MQ: FR_OPTIONS,
  PM: FR_OPTIONS,
  RE: FR_OPTIONS,
  YT: FR_OPTIONS,
  NC: [
    digits('NC_TIN', 'Numéro de contribuable (Nouvelle-Calédonie)', '123456789', [6, 12]),
  ],
  PF: [
    digits('PF_TIN', 'Numéro fiscal (Polynésie française)', '123456789', [6, 12]),
  ],
  WF: [
    digits('WF_TIN', 'Numéro d’identification fiscale (Wallis-et-Futuna)', '123456789', [6, 12]),
  ],

  ES: ES_OPTIONS,
  EA: ES_OPTIONS,
  IC: ES_OPTIONS,

  NL: NL_OPTIONS,
  BQ: NL_OPTIONS,
  AW: [digits('AW_PERSOONSNUMMER', 'Persoonsnummer (Aruba)', '12345678', [6, 10])],
  CW: [digits('CW_CRIB', 'Curaçao CRIB number', '123456789', 9)],
  SX: [digits('SX_CRIB', 'Sint Maarten CRIB number', '123456789', 9)],

  AU: AU_OPTIONS,
  CC: AU_OPTIONS,
  CX: AU_OPTIONS,
  NF: AU_OPTIONS,
  NZ: NZ_OPTIONS,
  TK: NZ_OPTIONS,

  NO: NO_OPTIONS,
  SJ: NO_OPTIONS,
  FI: FI_OPTIONS,
  AX: FI_OPTIONS,
  SE: SE_OPTIONS,
  DK: DK_OPTIONS,
  FO: [digits('FO_PTAL', 'P-tal (Faroese personal identification number)', '0101901234', 10)],
  GL: [digits('GL_CPR', 'CPR-nummer (Greenland)', '0101901234', 10)],
  CH: CH_OPTIONS,

  AC: [
    formatted(
      'AC_TIN',
      'Ascension Island tax reference',
      '123456',
      '^[A-Z0-9]{5,12}$',
      'Ascension Island tax reference must be 5 to 12 letters or digits.',
    ),
  ],
  AD: [
    formatted(
      'AD_NRT',
      'Número de Registre Tributari (NRT)',
      'A123456B',
      '^[A-Z]\\d{6}[A-Z]$',
      'Andorran NRT must be a letter, 6 digits, and a letter.',
    ),
  ],
  AE: [
    digits('AE_EMIRATES_ID', 'Emirates ID number', '784199012345671', 15),
    digits('AE_TRN', 'Tax Registration Number (TRN)', '100123456700003', 15),
  ],
  AF: [digits('AF_TIN', 'Tax Identification Number (TIN)', '1234567890', [9, 13])],
  AG: [digits('AG_TIN', 'Tax Identification Number (TIN)', '123456', [6, 10])],
  AI: [digits('AI_TIN', 'Anguilla Tax Identification Number', '123456', [6, 10])],
  AL: [
    formatted(
      'AL_NID',
      'Numri i Identitetit (NID)',
      'A12345678B',
      '^[A-Z]\\d{8}[A-Z]$',
      'Albanian NID must be a letter, 8 digits, and a letter.',
    ),
    formatted(
      'AL_NIPT',
      'Numri i Identifikimit për Personin e Tatueshëm (NIPT)',
      'A12345678B',
      '^[A-Z]\\d{8}[A-Z]$',
      'Albanian NIPT must be a letter, 8 digits, and a letter.',
    ),
  ],
  AM: [digits('AM_PSN', 'Public Services Number (PSN)', '1234567890', 10)],
  AO: [digits('AO_NIF', 'Número de Identificação Fiscal (NIF)', '1234567890', [9, 14])],
  AR: [
    digits('AR_CUIL', 'Código Único de Identificación Laboral (CUIL)', '20123456786', 11),
    digits('AR_CUIT', 'Código Único de Identificación Tributaria (CUIT)', '20123456786', 11),
  ],
  AT: [digits('AT_IDNR', 'Steuerliche Identifikationsnummer', '123456789', 9)],
  AZ: [
    formatted(
      'AZ_FIN',
      'Fərdi İdentifikasiya Nömrəsi (FIN)',
      'ABC1234',
      '^[A-Z0-9]{7}$',
      'Azerbaijan FIN must be 7 letters or digits.',
    ),
    digits('AZ_VOEN', 'Vergi ödəyicisinin eyniləşdirmə nömrəsi (VÖEN)', '1234567890', 10),
  ],
  BA: [digits('BA_JMB', 'Jedinstveni matični broj (JMB)', '0101990123456', 13)],
  BB: [digits('BB_TIN', 'Barbados Tax Identification Number', '1234567890123', 13)],
  BD: [digits('BD_ETIN', 'e-TIN', '123456789012', 12)],
  BE: [digits('BE_NN', 'Numéro national / Rijksregisternummer', '12345678901', 11)],
  BF: [digits('BF_IFU', 'Identifiant Fiscal Unique (IFU)', '1234567890123', [8, 14])],
  BG: [
    digits('BG_EGN', 'Единен граждански номер (ЕГН)', '0101901234', 10),
    digits('BG_LNCH', 'Личен номер на чужденец (ЛНЧ)', '0101901234', 10),
  ],
  BH: [digits('BH_CPR', 'Central Population Registry number (CPR)', '900101234', 9)],
  BI: [digits('BI_NIF', 'Numéro d’identification fiscale (NIF)', '1234567890', [8, 12])],
  BJ: [digits('BJ_IFU', 'Identifiant Fiscal Unique (IFU)', '1234567890123', [8, 14])],
  BM: [digits('BM_TIN', 'Bermuda tax identification number', '123456', [6, 12])],
  BN: [
    digits('BN_IC', 'Brunei identity card number', '00123456', 8),
  ],
  BO: [
    digits('BO_NIT', 'Número de Identificación Tributaria (NIT)', '1234567890', [7, 12]),
    digits('BO_CI', 'Cédula de identidad', '1234567', [5, 10]),
  ],
  BR: [digits('BR_CPF', 'Cadastro de Pessoas Físicas (CPF)', '12345678901', 11)],
  BS: [
    digits('BS_NIB', 'National Insurance Board number', '12345678', 8),
    digits('BS_TIN', 'Bahamas Tax Identification Number', '123456789', [8, 12]),
  ],
  BT: [digits('BT_TPN', 'Taxpayer Number (TPN)', '12345678901', 11)],
  BW: [digits('BW_TIN', 'Taxpayer Identification Number (TIN)', '12345678901', [8, 12])],
  BY: [
    formatted(
      'BY_PN',
      'Идентификационный номер (personal number)',
      '1234567A123PB1',
      '^[A-Z0-9]{14}$',
      'Belarus personal number must be 14 letters or digits.',
    ),
  ],
  BZ: [digits('BZ_TIN', 'Tax Identification Number (TIN)', '123456', [6, 10])],
  CA: [digits('CA_SIN', 'Social Insurance Number (SIN)', '123456789', 9)],
  CD: [digits('CD_NIF', 'Numéro d’identification fiscale (NIF)', '1234567890', [8, 15])],
  CF: [digits('CF_NIF', 'Numéro d’identification fiscale (NIF)', '1234567890', [8, 14])],
  CG: [digits('CG_NIU', 'Numéro d’identification unique (NIU)', '1234567890', [8, 14])],
  CI: [
    formatted(
      'CI_NCC',
      'Numéro de compte contribuable (NCC)',
      '1234567A',
      '^[A-Z0-9]{7,12}$',
      'Côte d’Ivoire NCC must be 7 to 12 letters or digits.',
    ),
  ],
  CK: [digits('CK_TIN', 'Cook Islands tax identification number', '123456', [5, 12])],
  CL: [
    formatted(
      'CL_RUT',
      'Rol Único Tributario (RUT)',
      '12345678K',
      '^\\d{7,8}[0-9K]$',
      'Chilean RUT must be 7 or 8 digits followed by a check digit or K.',
    ),
  ],
  CM: [digits('CM_NIU', 'Numéro d’identifiant unique (NIU)', '1234567890123', [8, 14])],
  CN: [
    formatted(
      'CN_ID',
      '公民身份号码 (Citizen Identification Number)',
      '110101199001011234',
      '^\\d{17}[0-9X]$',
      'Chinese citizen ID number must be 17 digits followed by a digit or X.',
    ),
  ],
  CO: [
    digits('CO_NIT', 'Número de Identificación Tributaria (NIT)', '1234567890', [9, 11]),
    digits('CO_CEDULA', 'Cédula de ciudadanía', '1234567890', [6, 10]),
  ],
  CR: [
    digits('CR_CEDULA', 'Cédula de identidad', '123456789', 9),
    digits('CR_NITE', 'Número de Identificación Tributario Especial (NITE)', '123456789012', 12),
  ],
  CU: [digits('CU_CI', 'Carné de identidad', '90010112345', 11)],
  CV: [digits('CV_NIF', 'Número de Identificação Fiscal (NIF)', '123456789', 9)],
  CY: [
    formatted(
      'CY_TIC',
      'Αριθμός Φορολογικού Μητρώου (TIC)',
      '12345678A',
      '^\\d{8}[A-Z]$',
      'Cyprus TIC must be 8 digits followed by a letter.',
    ),
  ],
  CZ: [
    digits('CZ_RC', 'Rodné číslo', '9001011234', [9, 10]),
    formatted(
      'CZ_DIC',
      'Daňové identifikační číslo (DIČ)',
      'CZ9001011234',
      '^CZ\\d{8,10}$',
      'Czech DIČ must start with CZ and contain 8 to 10 digits.',
    ),
  ],
  DE: [digits('DE_IDNR', 'Steuerliche Identifikationsnummer (IdNr)', '12345678901', 11)],
  DJ: [digits('DJ_NIF', 'Numéro d’identification fiscale (NIF)', '1234567890', [8, 12])],
  DM: [digits('DM_TIN', 'Dominica Tax Identification Number', '123456', [6, 10])],
  DO: [
    digits('DO_CEDULA', 'Cédula de identidad y electoral', '00112345678', 11),
    digits('DO_RNC', 'Registro Nacional del Contribuyente (RNC)', '123456789', 9),
  ],
  DZ: [digits('DZ_NIF', 'Numéro d’identification fiscale (NIF)', '123456789012345', 15)],
  EC: [
    digits('EC_CEDULA', 'Cédula de identidad', '1234567890', 10),
    digits('EC_RUC', 'Registro Único de Contribuyentes (RUC)', '1234567890001', 13),
  ],
  EE: [digits('EE_ISIKUKOOD', 'Isikukood', '39001011234', 11)],
  EG: [digits('EG_TIN', 'Tax registration number', '123456789', 9)],
  ER: [digits('ER_TIN', 'Tax Identification Number (TIN)', '1234567890', [8, 12])],
  ET: [digits('ET_TIN', 'Taxpayer Identification Number (TIN)', '1234567890', 10)],
  FJ: [digits('FJ_TIN', 'Tax Identification Number (TIN)', '123456789', [6, 10])],
  FM: [digits('FM_TIN', 'FSM taxpayer identification number', '123456', [6, 12])],
  GA: [digits('GA_NIF', 'Numéro d’identification fiscale (NIF)', '1234567890', [8, 14])],
  GD: [digits('GD_TIN', 'Grenada Tax Identification Number', '123456', [6, 10])],
  GE: [digits('GE_PN', 'Personal number', '12345678901', 11)],
  GH: [
    formatted(
      'GH_TIN',
      'Taxpayer Identification Number (TIN)',
      'P0012345678',
      '^[A-Z0-9]{10,15}$',
      'Ghana TIN must be 10 to 15 letters or digits.',
    ),
    formatted(
      'GH_PIN',
      'Ghana Card PIN',
      'GHA1234567890',
      '^GHA\\d{10}$',
      'Ghana Card PIN must start with GHA and contain 10 digits.',
    ),
  ],
  GM: [digits('GM_TIN', 'Taxpayer Identification Number (TIN)', '123456789', [6, 12])],
  GN: [digits('GN_NIF', 'Numéro d’identification fiscale (NIF)', '1234567890', [8, 14])],
  GQ: [digits('GQ_NIF', 'Número de identificación fiscal (NIF)', '1234567890', [8, 14])],
  GR: [digits('GR_AFM', 'Αριθμός Φορολογικού Μητρώου (ΑΦΜ)', '123456789', 9)],
  GT: [
    digits('GT_NIT', 'Número de Identificación Tributaria (NIT)', '12345678', [7, 10]),
    digits('GT_CUI', 'Código Único de Identificación (CUI)', '1234567890123', 13),
  ],
  GW: [digits('GW_NIF', 'Número de identificação fiscal (NIF)', '123456789', [8, 12])],
  GY: [digits('GY_TIN', 'Taxpayer Identification Number (TIN)', '123456789', [6, 12])],
  HK: [
    formatted(
      'HK_HKID',
      'Hong Kong Identity Card number (HKID)',
      'A1234567',
      '^[A-Z]{1,2}\\d{6}[0-9A]$',
      'Hong Kong identity card number must be 1 or 2 letters, 6 digits, and a check character.',
    ),
  ],
  HN: [
    digits('HN_RTN', 'Registro Tributario Nacional (RTN)', '08011990123456', 14),
    digits('HN_ID', 'Número de identidad', '0801199012345', 13),
  ],
  HR: [digits('HR_OIB', 'Osobni identifikacijski broj (OIB)', '12345678901', 11)],
  HT: [digits('HT_NIF', 'Numéro d’identification fiscale (NIF)', '1234567890', [8, 12])],
  HU: [digits('HU_ADOAZONOSITO', 'Adóazonosító jel', '8123456789', 10)],
  ID: [digits('ID_NPWP', 'Nomor Pokok Wajib Pajak (NPWP)', '1234567890123456', [15, 16])],
  IE: [
    formatted(
      'IE_PPSN',
      'Personal Public Service Number (PPSN)',
      '1234567A',
      '^\\d{7}[A-Z]{1,2}$',
      'Irish PPSN must be 7 digits followed by 1 or 2 letters.',
    ),
  ],
  IL: [digits('IL_ZEHUT', 'מספר זהות (Mispar Zehut)', '123456789', 9)],
  IN: [
    formatted(
      'IN_PAN',
      'Permanent Account Number (PAN)',
      'ABCDE1234F',
      '^[A-Z]{5}\\d{4}[A-Z]$',
      'Indian PAN must be 5 letters, 4 digits, and a letter.',
    ),
  ],
  IQ: [digits('IQ_NID', 'National identification number', '123456789012', 12)],
  IR: [digits('IR_NID', 'شماره ملی (National ID number)', '1234567890', 10)],
  IS: [digits('IS_KENNITALA', 'Kennitala', '0101901234', 10)],
  IT: [
    formatted(
      'IT_CF',
      'Codice fiscale',
      'RSSMRA90A01H501U',
      '^[A-Z]{6}\\d{2}[A-Z]\\d{2}[A-Z]\\d{3}[A-Z]$',
      'Italian codice fiscale must be 16 characters in the official letter-and-digit layout.',
    ),
  ],
  JM: [digits('JM_TRN', 'Taxpayer Registration Number (TRN)', '123456789', 9)],
  JO: [digits('JO_NID', 'National number', '9001011234', 10)],
  JP: [digits('JP_MY_NUMBER', '個人番号 (My Number)', '123456789012', 12)],
  KE: [
    formatted(
      'KE_PIN',
      'KRA Personal Identification Number (PIN)',
      'A123456789B',
      '^[A-Z]\\d{9}[A-Z]$',
      'Kenya KRA PIN must be a letter, 9 digits, and a letter.',
    ),
  ],
  KG: [digits('KG_PIN', 'Personal identification number (PIN)', '12345678901234', 14)],
  KH: [digits('KH_TIN', 'Tax Identification Number (TIN)', '123456789', [9, 12])],
  KI: [digits('KI_TIN', 'Kiribati tax identification number', '123456', [5, 12])],
  KM: [digits('KM_NIF', 'Numéro d’identification fiscale (NIF)', '123456789', [8, 12])],
  KN: [digits('KN_TIN', 'Saint Kitts and Nevis Tax Identification Number', '123456', [6, 10])],
  KP: [digits('KP_RRN', 'Resident registration number', '1234567890123', 13)],
  KR: [digits('KR_RRN', '주민등록번호 (Resident Registration Number)', '9001011234567', 13)],
  KW: [digits('KW_CIVIL_ID', 'Civil ID number', '123456789012', 12)],
  KY: [digits('KY_TIN', 'Cayman Islands Tax Identification Number', '123456', [6, 12])],
  KZ: [digits('KZ_IIN', 'Жеке сәйкестендіру нөмірі (IIN)', '900101123456', 12)],
  LA: [digits('LA_TIN', 'Tax Identification Number (TIN)', '1234567890', [9, 13])],
  LB: [digits('LB_TIN', 'Tax identification number', '12345678', [6, 12])],
  LC: [digits('LC_TIN', 'Saint Lucia Tax Identification Number', '123456', [6, 10])],
  LI: [digits('LI_PEID', 'Personenidentifikationsnummer (PEID)', '1234567', [4, 12])],
  LK: [digits('LK_TIN', 'Taxpayer Identification Number (TIN)', '123456789', 9)],
  LR: [digits('LR_TIN', 'Taxpayer Identification Number (TIN)', '123456789', [8, 12])],
  LS: [digits('LS_TIN', 'Taxpayer Identification Number (TIN)', '1234567890', [8, 12])],
  LT: [digits('LT_ASMENS_KODAS', 'Asmens kodas', '39001011234', 11)],
  LU: [digits('LU_MATRICULE', 'Numéro d’identification nationale (matricule)', '1890123456789', 13)],
  LV: [digits('LV_PERSONAS_KODS', 'Personas kods', '01019012345', 11)],
  LY: [digits('LY_NID', 'National number', '123456789012', 12)],
  MA: [digits('MA_IF', 'Identifiant fiscal (IF)', '12345678', [7, 10])],
  MC: [
    formatted(
      'MC_TIN',
      'Numéro d’identification fiscale',
      'AB12345',
      '^[A-Z0-9]{5,12}$',
      'Monaco tax identification number must be 5 to 12 letters or digits.',
    ),
  ],
  MD: [digits('MD_IDNP', 'Numărul de identificare de stat (IDNP)', '1234567890123', 13)],
  ME: [digits('ME_JMB', 'Jedinstveni matični broj (JMB)', '0101990123456', 13)],
  MG: [digits('MG_NIF', 'Numéro d’identification fiscale (NIF)', '1234567890', [9, 14])],
  MH: [digits('MH_TIN', 'Marshall Islands taxpayer identification number', '123456', [6, 12])],
  MK: [digits('MK_EMBG', 'Единствен матичен број (ЕМБГ)', '0101990123456', 13)],
  ML: [digits('ML_NIF', 'Numéro d’identification fiscale (NIF)', '1234567890', [8, 14])],
  MM: [digits('MM_TIN', 'Taxpayer Identification Number (TIN)', '123456789', [8, 14])],
  MN: [
    formatted(
      'MN_RN',
      'Регистрийн дугаар (civil registration number)',
      'AB12345678',
      '^[A-Z0-9]{8,12}$',
      'Mongolia civil registration number must be 8 to 12 letters or digits.',
    ),
  ],
  MO: [digits('MO_TIN', 'Número de contribuinte (Macau)', '12345678', 8)],
  MR: [digits('MR_NIF', 'Numéro d’identification fiscale (NIF)', '1234567890', [8, 14])],
  MS: [digits('MS_TIN', 'Montserrat Tax Identification Number', '123456', [6, 10])],
  MT: [
    formatted(
      'MT_ID',
      'Identity card number',
      '1234567A',
      '^\\d{7}[A-Z]$',
      'Malta identity card number must be 7 digits followed by a letter.',
    ),
    formatted(
      'MT_TIN',
      'Tax number',
      '123456789',
      '^\\d{8,9}[A-Z]?$',
      'Malta tax number must be 8 or 9 digits, optionally followed by a letter.',
    ),
  ],
  MU: [digits('MU_TAN', 'Tax Account Number (TAN)', '12345678', 8)],
  MV: [digits('MV_TIN', 'Tax Identification Number (TIN)', '1234567', [6, 10])],
  MW: [digits('MW_TPIN', 'Taxpayer Identification Number (TPIN)', '12345678', 8)],
  MX: [
    formatted(
      'MX_RFC',
      'Registro Federal de Contribuyentes (RFC)',
      'ABCD900101XX1',
      '^[A-Z&Ñ]{4}\\d{6}[A-Z0-9]{3}$',
      'Mexican individual RFC must be 4 letters, 6 digits, and 3 letters or digits.',
    ),
  ],
  MY: [
    formatted(
      'MY_ITN',
      'Nombor cukai pendapatan',
      'SG12345678901',
      '^[A-Z]{1,2}\\d{10,12}$',
      'Malaysian income tax number must be 1 or 2 letters followed by 10 to 12 digits.',
    ),
  ],
  MZ: [digits('MZ_NUIT', 'Número Único de Identificação Tributária (NUIT)', '123456789', 9)],
  NA: [digits('NA_ITN', 'Income tax reference number', '1234567890', [8, 12])],
  NE: [digits('NE_NIF', 'Numéro d’identification fiscale (NIF)', '1234567890', [8, 14])],
  NG: [digits('NG_TIN', 'Tax Identification Number (TIN)', '1234567890', [8, 14])],
  NI: [
    formatted(
      'NI_CEDULA',
      'Cédula de identidad',
      '0010101901234A',
      '^[A-Z0-9]{13,14}$',
      'Nicaragua cédula must be 13 or 14 letters or digits.',
    ),
    digits('NI_RUC', 'Registro Único de Contribuyente (RUC)', '12345678901234', 14),
  ],
  NP: [digits('NP_PAN', 'Permanent Account Number (PAN)', '123456789', 9)],
  NR: [digits('NR_TIN', 'Nauru tax identification number', '123456', [5, 12])],
  NU: [digits('NU_TIN', 'Niue tax identification number', '123456', [5, 12])],
  OM: [digits('OM_CIVIL', 'Civil number', '12345678', [6, 9])],
  PA: [
    digits('PA_RUC', 'Registro Único de Contribuyente (RUC)', '123456789012', [10, 15]),
    formatted(
      'PA_CEDULA',
      'Cédula de identidad',
      '8-123-4567',
      '^[A-Z0-9]{5,15}$',
      'Panama cédula must be 5 to 15 letters or digits.',
    ),
  ],
  PE: [
    digits('PE_DNI', 'Documento Nacional de Identidad (DNI)', '12345678', 8),
    digits('PE_RUC', 'Registro Único de Contribuyentes (RUC)', '10123456789', 11),
  ],
  PG: [digits('PG_TIN', 'Tax Identification Number (TIN)', '123456789', [6, 12])],
  PH: [digits('PH_TIN', 'Taxpayer Identification Number (TIN)', '123456789', [9, 12])],
  PK: [
    digits('PK_CNIC', 'Computerised National Identity Card (CNIC)', '1234567890123', 13),
    digits('PK_NTN', 'National Tax Number (NTN)', '1234567', 7),
  ],
  PL: [
    digits('PL_PESEL', 'PESEL', '90010112345', 11),
    digits('PL_NIP', 'Numer Identyfikacji Podatkowej (NIP)', '1234567890', 10),
  ],
  PS: [digits('PS_ID', 'Palestinian identity number', '123456789', 9)],
  PT: [digits('PT_NIF', 'Número de Identificação Fiscal (NIF)', '123456789', 9)],
  PW: [digits('PW_TIN', 'Palau taxpayer identification number', '123456', [6, 12])],
  PY: [
    digits('PY_RUC', 'Registro Único de Contribuyentes (RUC)', '12345678', [6, 10]),
    digits('PY_CI', 'Cédula de identidad civil', '1234567', [5, 8]),
  ],
  QA: [digits('QA_QID', 'Qatar ID (QID)', '12345678901', 11)],
  RO: [digits('RO_CNP', 'Cod Numeric Personal (CNP)', '1900101123456', 13)],
  RS: [
    digits('RS_JMBG', 'Jedinstveni matični broj građana (JMBG)', '0101990123456', 13),
    digits('RS_PIB', 'Poreski identifikacioni broj (PIB)', '123456789', 9),
  ],
  RU: [digits('RU_INN', 'Идентификационный номер налогоплательщика (ИНН)', '123456789012', 12)],
  RW: [digits('RW_TIN', 'Tax Identification Number (TIN)', '123456789', 9)],
  SA: [
    formatted(
      'SA_NATIONAL_ID',
      'National ID number',
      '1234567890',
      '^1\\d{9}$',
      'Saudi national ID must be 10 digits and start with 1.',
    ),
    formatted(
      'SA_IQAMA',
      'Iqama number',
      '2345678901',
      '^2\\d{9}$',
      'Saudi Iqama number must be 10 digits and start with 2.',
    ),
  ],
  SB: [digits('SB_TIN', 'Solomon Islands tax identification number', '123456', [6, 12])],
  SC: [digits('SC_TIN', 'Seychelles Tax Identification Number', '123456789', [6, 12])],
  SD: [digits('SD_TIN', 'Tax Identification Number (TIN)', '1234567890', [8, 14])],
  SG: [
    formatted(
      'SG_NRIC',
      'NRIC number',
      'S1234567A',
      '^[ST]\\d{7}[A-Z]$',
      'Singapore NRIC must start with S or T, followed by 7 digits and a letter.',
    ),
    formatted(
      'SG_FIN',
      'Foreign Identification Number (FIN)',
      'F1234567A',
      '^[FGM]\\d{7}[A-Z]$',
      'Singapore FIN must start with F, G, or M, followed by 7 digits and a letter.',
    ),
  ],
  SI: [digits('SI_DAVST', 'Davčna številka', '12345678', 8)],
  SK: [
    digits('SK_RC', 'Rodné číslo', '9001011234', [9, 10]),
    formatted(
      'SK_DIC',
      'Daňové identifikačné číslo (DIČ)',
      '1234567890',
      '^\\d{10}$',
      'Slovak DIČ must be 10 digits.',
    ),
  ],
  SL: [digits('SL_TIN', 'Taxpayer Identification Number (TIN)', '123456789', [8, 12])],
  SM: [digits('SM_ISS', 'Codice ISS', '12345', [4, 8])],
  SN: [
    digits('SN_CNI', 'Numéro de carte nationale d’identité (CNI)', '1234567890123', 13),
  ],
  SO: [digits('SO_TIN', 'Tax Identification Number (TIN)', '1234567890', [8, 12])],
  SR: [digits('SR_TIN', 'Tax Identification Number (TIN)', '1234567890', [8, 12])],
  SS: [digits('SS_TIN', 'Tax Identification Number (TIN)', '1234567890', [8, 14])],
  ST: [digits('ST_NIF', 'Número de identificação fiscal (NIF)', '123456789', 9)],
  SV: [
    digits('SV_NIT', 'Número de Identificación Tributaria (NIT)', '12345678901234', 14),
    digits('SV_DUI', 'Documento Único de Identidad (DUI)', '123456789', 9),
  ],
  SY: [digits('SY_NID', 'National number', '12345678901', 11)],
  SZ: [digits('SZ_TIN', 'Tax Identification Number (TIN)', '1234567890', [8, 12])],
  TC: [digits('TC_TIN', 'Turks and Caicos Islands Tax Identification Number', '123456', [6, 12])],
  TD: [digits('TD_NIF', 'Numéro d’identification fiscale (NIF)', '1234567890', [8, 14])],
  TG: [digits('TG_NIF', 'Numéro d’identification fiscale (NIF)', '1234567890', [8, 14])],
  TH: [digits('TH_TIN', 'เลขประจำตัวผู้เสียภาษี (Tax Identification Number)', '1234567890123', 13)],
  TJ: [digits('TJ_TIN', 'Рақами мушаххаси андозсупоранда (TIN)', '123456789', 9)],
  TL: [digits('TL_TIN', 'Número de identificação fiscal (NIF)', '123456789', [8, 12])],
  TM: [digits('TM_PN', 'Personal number', '12345678901', [8, 14])],
  TN: [
    formatted(
      'TN_MF',
      'Matricule fiscal',
      '1234567A',
      '^[A-Z0-9]{7,13}$',
      'Tunisian matricule fiscal must be 7 to 13 letters or digits.',
    ),
  ],
  TO: [digits('TO_TIN', 'Tonga tax identification number', '123456', [5, 12])],
  TR: [
    digits('TR_TCKN', 'T.C. Kimlik Numarası', '12345678901', 11),
    digits('TR_VKN', 'Vergi Kimlik Numarası', '1234567890', 10),
  ],
  TT: [digits('TT_BIR', 'Board of Inland Revenue (BIR) number', '123456', [6, 10])],
  TV: [digits('TV_TIN', 'Tuvalu tax identification number', '123456', [5, 12])],
  TW: [
    formatted(
      'TW_NID',
      'National Identification Number',
      'A123456789',
      '^[A-Z][12]\\d{8}$',
      'Taiwan national ID must be a letter, 1 or 2, and 8 digits.',
    ),
  ],
  TZ: [digits('TZ_TIN', 'Taxpayer Identification Number (TIN)', '123456789', 9)],
  UA: [digits('UA_RNOKPP', 'РНОКПП (individual tax number)', '1234567890', 10)],
  UG: [digits('UG_TIN', 'Taxpayer Identification Number (TIN)', '1234567890', 10)],
  UY: [
    digits('UY_CI', 'Cédula de identidad', '12345678', [7, 8]),
    digits('UY_RUT', 'Registro Único Tributario (RUT)', '123456789012', 12),
  ],
  UZ: [
    digits('UZ_PINFL', 'Jismoniy shaxsning shaxsiy identifikatsiya raqami (PINFL)', '12345678901234', 14),
    digits('UZ_INN', 'Identifikatsion soliq raqami (INN)', '123456789', 9),
  ],
  VC: [digits('VC_TIN', 'Saint Vincent and the Grenadines Tax Identification Number', '123456', [6, 10])],
  VE: [
    formatted(
      'VE_RIF',
      'Registro de Información Fiscal (RIF)',
      'V123456789',
      '^[VEJPG]\\d{8,9}$',
      'Venezuelan RIF must start with V, E, J, P, or G and contain 8 or 9 digits.',
    ),
    digits('VE_CEDULA', 'Cédula de identidad', '12345678', [6, 9]),
  ],
  VG: [digits('VG_TIN', 'British Virgin Islands Tax Identification Number', '123456', [6, 12])],
  VN: [digits('VN_MST', 'Mã số thuế', '1234567890', [10, 13])],
  VU: [digits('VU_TIN', 'Vanuatu Tax Identification Number', '123456', [6, 12])],
  WS: [digits('WS_TIN', 'Samoa tax identification number', '123456', [5, 12])],
  XK: [digits('XK_FN', 'Fiscal number', '1234567890', 10)],
  YE: [digits('YE_NID', 'National ID number', '12345678901', [8, 14])],
  ZA: [digits('ZA_TAX_REF', 'Income tax reference number', '1234567890', 10)],
  ZM: [digits('ZM_TPIN', 'Taxpayer Identification Number (TPIN)', '1234567890', 10)],
  ZW: [digits('ZW_TIN', 'Taxpayer Identification Number (TIN)', '1234567890', [8, 12])],
};

const UNSUPPORTED = new Set(TAX_ID_UNSUPPORTED_COUNTRY_CODES);

export function isUnsupportedTaxIdCountry(countryCode: string): boolean {
  return UNSUPPORTED.has(resolveTaxIdCountryCode(countryCode));
}

export function getTaxIdCatalogOptions(countryCode: string): readonly TaxIdOption[] {
  const code = resolveTaxIdCountryCode(countryCode);
  return TAX_ID_CATALOG[code] ?? [];
}

export function findTaxIdCatalogOption(
  countryCode: string,
  taxIdCode: string,
): TaxIdOption | undefined {
  const normalized = taxIdCode.trim().toUpperCase();
  return getTaxIdCatalogOptions(countryCode).find((option) => option.code === normalized);
}
