import { describe, it, expect } from 'vitest'
import {
  DB_NONE,
  referenceAllowedDBs,
  withFromAllowedDBs,
} from '@/features/gocam/data/allowedDatabases'

// The with/from allow-list is the mirror of the authoritative GO metadata file
// geneontology/noctua metadata/with-from-allowed-namespaces.yaml. These tests
// pin the exact membership so an accidental removal (or a drift from the YAML)
// is caught.
const YAML_WITH_FROM_NAMESPACES = [
  'AGI_LocusCode',
  'CGD',
  'CHEBI',
  'ComplexPortal',
  'dictyBase',
  'EC',
  'EcoCyc',
  'Ensembl',
  'FB',
  'GO',
  'InterPro',
  'MGI',
  'PANTHER',
  'PomBase',
  'PR',
  'RGD',
  'RHEA',
  'RNAcentral',
  'SGD',
  'UniProtKB',
  'TAIR',
  'WB',
  'Xenbase',
  'ZFIN',
]

describe('withFromAllowedDBs', () => {
  it('matches the with-from-allowed-namespaces.yaml set exactly', () => {
    expect([...withFromAllowedDBs].sort()).toEqual([...YAML_WITH_FROM_NAMESPACES].sort())
  })

  it('includes the namespaces added from the YAML', () => {
    expect(withFromAllowedDBs).toContain('dictyBase')
    expect(withFromAllowedDBs).toContain('Ensembl')
    expect(withFromAllowedDBs).toContain('TAIR')
  })

  it('has no duplicate prefixes', () => {
    expect(new Set(withFromAllowedDBs).size).toBe(withFromAllowedDBs.length)
  })

  it('does not contain the "None" placeholder', () => {
    expect(withFromAllowedDBs as readonly string[]).not.toContain(DB_NONE)
  })
})

describe('referenceAllowedDBs', () => {
  it('is exactly PMID, DOI, GO_REF', () => {
    expect(referenceAllowedDBs).toEqual(['PMID', 'DOI', 'GO_REF'])
  })

  it('does not contain the "None" placeholder', () => {
    expect(referenceAllowedDBs as readonly string[]).not.toContain(DB_NONE)
  })
})

describe('DB_NONE', () => {
  it('is the "None" placeholder', () => {
    expect(DB_NONE).toBe('None')
  })
})
