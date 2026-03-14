// Static require map for all Psalm translations.
// Metro bundler requires statically-analyzable require() strings — no dynamic paths.

export type PsalmMetadata = {
  name: string;
  module: string;
  year?: string;
  lang: string;
  lang_short: string;
};

type ExtractedModule = {metadata: PsalmMetadata; psalms: string[][]};

// ── Legacy "modern" translation (raw string[][] — kept from original app) ─────
const _modern: string[][] = require('../psalms-en.json');

// ── All 80 extracted translations ─────────────────────────────────────────────
const _extracted: Record<string, ExtractedModule> = {
  afri:                 require('../psalms_extracted/psalms-afri.json'),
  albanian:             require('../psalms_extracted/psalms-albanian.json'),
  almeida_ra:           require('../psalms_extracted/psalms-almeida_ra.json'),
  almeida_rc:           require('../psalms_extracted/psalms-almeida_rc.json'),
  asv:                  require('../psalms_extracted/psalms-asv.json'),
  asvs:                 require('../psalms_extracted/psalms-asvs.json'),
  bishops:              require('../psalms_extracted/psalms-bishops.json'),
  bkr:                  require('../psalms_extracted/psalms-bkr.json'),
  blivre:               require('../psalms_extracted/psalms-blivre.json'),
  bn_irv:               require('../psalms_extracted/psalms-bn_irv.json'),
  bo_ntb:               require('../psalms_extracted/psalms-bo_ntb.json'),
  bungo:                require('../psalms_extracted/psalms-bungo.json'),
  cadman:               require('../psalms_extracted/psalms-cadman.json'),
  chinese_union_simp:   require('../psalms_extracted/psalms-chinese_union_simp.json'),
  chinese_union_simp_s: require('../psalms_extracted/psalms-chinese_union_simp_s.json'),
  chinese_union_trad:   require('../psalms_extracted/psalms-chinese_union_trad.json'),
  chinese_union_trad_s: require('../psalms_extracted/psalms-chinese_union_trad_s.json'),
  ckjv_sds:             require('../psalms_extracted/psalms-ckjv_sds.json'),
  ckjv_sdt:             require('../psalms_extracted/psalms-ckjv_sdt.json'),
  cornilescu:           require('../psalms_extracted/psalms-cornilescu.json'),
  coverdale:            require('../psalms_extracted/psalms-coverdale.json'),
  diodati:              require('../psalms_extracted/psalms-diodati.json'),
  elberfelder_1871:     require('../psalms_extracted/psalms-elberfelder_1871.json'),
  elberfelder_1905:     require('../psalms_extracted/psalms-elberfelder_1905.json'),
  epee:                 require('../psalms_extracted/psalms-epee.json'),
  fidela:               require('../psalms_extracted/psalms-fidela.json'),
  finn:                 require('../psalms_extracted/psalms-finn.json'),
  geneva:               require('../psalms_extracted/psalms-geneva.json'),
  gu_irv:               require('../psalms_extracted/psalms-gu_irv.json'),
  ha_con:               require('../psalms_extracted/psalms-ha_con.json'),
  hcv:                  require('../psalms_extracted/psalms-hcv.json'),
  he_modern:            require('../psalms_extracted/psalms-he_modern.json'),
  indo_tb:              require('../psalms_extracted/psalms-indo_tb.json'),
  indo_tm:              require('../psalms_extracted/psalms-indo_tm.json'),
  irv:                  require('../psalms_extracted/psalms-irv.json'),
  karoli:               require('../psalms_extracted/psalms-karoli.json'),
  kjv:                  require('../psalms_extracted/psalms-kjv.json'),
  kjv_strongs:          require('../psalms_extracted/psalms-kjv_strongs.json'),
  kn_irv:               require('../psalms_extracted/psalms-kn_irv.json'),
  kn_kjv:               require('../psalms_extracted/psalms-kn_kjv.json'),
  korean:               require('../psalms_extracted/psalms-korean.json'),
  kougo:                require('../psalms_extracted/psalms-kougo.json'),
  lt_heritage:          require('../psalms_extracted/psalms-lt_heritage.json'),
  luther:               require('../psalms_extracted/psalms-luther.json'),
  luther_1912:          require('../psalms_extracted/psalms-luther_1912.json'),
  lv_gluck_8:           require('../psalms_extracted/psalms-lv_gluck_8.json'),
  maori:                require('../psalms_extracted/psalms-maori.json'),
  martin:               require('../psalms_extracted/psalms-martin.json'),
  mr_irv:               require('../psalms_extracted/psalms-mr_irv.json'),
  my_judson:            require('../psalms_extracted/psalms-my_judson.json'),
  ne_ulb:               require('../psalms_extracted/psalms-ne_ulb.json'),
  net:                  require('../psalms_extracted/psalms-net.json'),
  opt:                  require('../psalms_extracted/psalms-opt.json'),
  oster:                require('../psalms_extracted/psalms-oster.json'),
  pa_irv:               require('../psalms_extracted/psalms-pa_irv.json'),
  pol_nbg:              require('../psalms_extracted/psalms-pol_nbg.json'),
  pol_ubg:              require('../psalms_extracted/psalms-pol_ubg.json'),
  polbg:                require('../psalms_extracted/psalms-polbg.json'),
  rv_1909:              require('../psalms_extracted/psalms-rv_1909.json'),
  rv_1909_strongs:      require('../psalms_extracted/psalms-rv_1909_strongs.json'),
  rvg:                  require('../psalms_extracted/psalms-rvg.json'),
  rvg_2004:             require('../psalms_extracted/psalms-rvg_2004.json'),
  sagradas:             require('../psalms_extracted/psalms-sagradas.json'),
  schlachter:           require('../psalms_extracted/psalms-schlachter.json'),
  segond_1910:          require('../psalms_extracted/psalms-segond_1910.json'),
  so_jimale:            require('../psalms_extracted/psalms-so_jimale.json'),
  stve:                 require('../psalms_extracted/psalms-stve.json'),
  svd:                  require('../psalms_extracted/psalms-svd.json'),
  synodal:              require('../psalms_extracted/psalms-synodal.json'),
  ta_irv:               require('../psalms_extracted/psalms-ta_irv.json'),
  ta_oitce:             require('../psalms_extracted/psalms-ta_oitce.json'),
  tagab:                require('../psalms_extracted/psalms-tagab.json'),
  te_irv:               require('../psalms_extracted/psalms-te_irv.json'),
  thaikjv:              require('../psalms_extracted/psalms-thaikjv.json'),
  turkish:              require('../psalms_extracted/psalms-turkish.json'),
  ug_ara:               require('../psalms_extracted/psalms-ug_ara.json'),
  ur_geo:               require('../psalms_extracted/psalms-ur_geo.json'),
  web:                  require('../psalms_extracted/psalms-web.json'),
  wlc:                  require('../psalms_extracted/psalms-wlc.json'),
  wo_kyg:               require('../psalms_extracted/psalms-wo_kyg.json'),
  mal1910:              require('../psalms_extracted/psalms-malayalam.json'),
};

// ── Public API ─────────────────────────────────────────────────────────────────

/** Returns the psalms string[][] for the given module key. */
export function getPsalmsData(version: string): string[][] {
  if (version === 'modern') return _modern;
  return _extracted[version]?.psalms ?? [];
}

/** Returns all available versions sorted by language then name, for the Settings picker. */
export function getAllVersions(): PsalmMetadata[] {
  const modern: PsalmMetadata = {
    module: 'modern',
    name: 'Modern English',
    lang: 'English',
    lang_short: 'en',
  };
  const rest = Object.values(_extracted)
    .map(m => m.metadata)
    .filter(m => m != null)
    .sort((a, b) => (a.lang ?? '').localeCompare(b.lang ?? '') || (a.name ?? '').localeCompare(b.name ?? ''));
  return [modern, ...rest];
}
