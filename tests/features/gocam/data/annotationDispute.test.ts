import { describe, it, expect } from 'vitest'
import type { Contributor } from '@/features/users/models/contributor'
import {
  orcidId,
  formatCurator,
  buildAnnotationDisputeUrl,
  buildEvidenceDisputeUrl,
  buildOntologyTermPendingUrl,
  commentTicket,
} from '@/features/gocam/data/annotationDispute'

const contributor = (uri: string, name?: string): Contributor => ({ uri, name })

// Read the pre-filled issue fields back out of the generated GitHub link.
const issueFields = (url: string) => {
  const params = new URL(url).searchParams
  return { title: params.get('title') ?? '', body: params.get('body') ?? '' }
}

describe('orcidId', () => {
  it('pulls the bare id out of an ORCID URI', () => {
    expect(orcidId('http://orcid.org/0000-0002-1825-0097')).toBe('0000-0002-1825-0097')
  })

  it('keeps a trailing X checksum character', () => {
    expect(orcidId('https://orcid.org/0000-0002-1694-233X')).toBe('0000-0002-1694-233X')
  })

  it('returns the input unchanged when it holds no ORCID id', () => {
    expect(orcidId('http://geneontology.org/curator')).toBe('http://geneontology.org/curator')
  })
})

describe('formatCurator', () => {
  it('renders "Name (ORCID)" when both are known', () => {
    expect(formatCurator(contributor('http://orcid.org/0000-0002-1825-0097', 'Jane Doe'))).toBe(
      'Jane Doe (0000-0002-1825-0097)'
    )
  })

  it('falls back to the ORCID id alone when there is no name', () => {
    expect(formatCurator(contributor('http://orcid.org/0000-0002-1825-0097'))).toBe(
      '0000-0002-1825-0097'
    )
  })

  it('falls back to the name alone when there is no URI', () => {
    expect(formatCurator(contributor('', 'Jane Doe'))).toBe('Jane Doe')
  })

  it('ignores a whitespace-only name', () => {
    expect(formatCurator(contributor('http://orcid.org/0000-0002-1825-0097', '   '))).toBe(
      '0000-0002-1825-0097'
    )
  })

  it('is empty when the contributor carries neither name nor URI', () => {
    expect(formatCurator(contributor(''))).toBe('')
  })
})

describe('buildAnnotationDisputeUrl', () => {
  const params = {
    modelUrl: 'https://noctua.geneontology.org/editor/graph/gomodel:123',
    gene: 'CDK1',
    goTerm: 'protein kinase activity (GO:0004672)',
  }

  it('files against the go-annotation tracker with the model URL in the title', () => {
    const url = buildAnnotationDisputeUrl({ ...params, contributors: [] })

    expect(url.startsWith('https://github.com/geneontology/go-annotation/issues/new?')).toBe(true)
    expect(issueFields(url).title).toBe(
      'Ontology term annotation dispute https://noctua.geneontology.org/editor/graph/gomodel:123'
    )
  })

  it('lists gene, GO term, and the contributor of the disputed statement', () => {
    const url = buildAnnotationDisputeUrl({
      ...params,
      contributors: [contributor('http://orcid.org/0000-0002-1825-0097', 'Jane Doe')],
    })

    expect(issueFields(url).body).toBe(
      '* CDK1\n* protein kinase activity (GO:0004672)\n* Jane Doe (0000-0002-1825-0097)'
    )
  })

  it('joins multiple contributors onto the one curator line', () => {
    const url = buildAnnotationDisputeUrl({
      ...params,
      contributors: [
        contributor('http://orcid.org/0000-0002-1825-0097', 'Jane Doe'),
        contributor('http://orcid.org/0000-0001-5109-3700', 'John Roe'),
      ],
    })

    expect(issueFields(url).body).toContain(
      '* Jane Doe (0000-0002-1825-0097), John Roe (0000-0001-5109-3700)'
    )
  })

  it('drops the curator line when the statement has no contributors', () => {
    const url = buildAnnotationDisputeUrl({ ...params, contributors: [] })

    expect(issueFields(url).body).toBe('* CDK1\n* protein kinase activity (GO:0004672)')
  })

  it('skips contributors that resolve to nothing', () => {
    const url = buildAnnotationDisputeUrl({
      ...params,
      contributors: [contributor(''), contributor('http://orcid.org/0000-0002-1825-0097')],
    })

    expect(issueFields(url).body).toBe(
      '* CDK1\n* protein kinase activity (GO:0004672)\n* 0000-0002-1825-0097'
    )
  })
})

describe('the comment in the ticket body (#289)', () => {
  const params = {
    modelUrl: 'https://noctua.geneontology.org/editor/graph/gomodel:123',
    gene: 'CDK1',
    goTerm: 'protein kinase activity (GO:0004672)',
    contributors: [],
  }

  it('pastes the comment below the annotation bullets', () => {
    const url = buildAnnotationDisputeUrl({ ...params, comment: 'wrong term for this gene' })

    expect(issueFields(url).body).toBe(
      `* CDK1
* protein kinase activity (GO:0004672)

wrong term for this gene`
    )
  })

  it('leaves the body as bullets alone when there is no comment', () => {
    expect(issueFields(buildAnnotationDisputeUrl(params)).body).toBe(
      `* CDK1
* protein kinase activity (GO:0004672)`
    )
    expect(issueFields(buildAnnotationDisputeUrl({ ...params, comment: '   ' })).body).toBe(
      `* CDK1
* protein kinase activity (GO:0004672)`
    )
  })
})

describe('buildEvidenceDisputeUrl (#289)', () => {
  const params = {
    modelUrl: 'https://noctua.geneontology.org/editor/graph/gomodel:123',
    gene: 'CDK1',
    statement: 'enabled by → ABCA14 Sscr',
    evidence: 'IDA · PMID:25415977',
    contributors: [contributor('http://orcid.org/0000-0002-1825-0097', 'Jane Doe')],
  }

  it('files against go-annotation, like a GO term dispute', () => {
    const url = buildEvidenceDisputeUrl(params)

    expect(url.startsWith('https://github.com/geneontology/go-annotation/issues/new?')).toBe(true)
    expect(issueFields(url).title).toBe(
      'Evidence dispute https://noctua.geneontology.org/editor/graph/gomodel:123'
    )
  })

  it('names the statement and the evidence, not a GO term', () => {
    const url = buildEvidenceDisputeUrl({ ...params, comment: 'figure shows the opposite' })

    expect(issueFields(url).body).toBe(
      `* CDK1
* enabled by → ABCA14 Sscr
* IDA · PMID:25415977
* Jane Doe (0000-0002-1825-0097)

figure shows the opposite`
    )
  })
})

describe('buildOntologyTermPendingUrl (#289)', () => {
  const params = {
    modelUrl: 'https://noctua.geneontology.org/editor/graph/gomodel:123',
    gene: 'CDK1',
    goTerm: 'protein kinase activity (GO:0004672)',
    contributors: [],
  }

  it('files against the go-ontology tracker instead of go-annotation', () => {
    const url = buildOntologyTermPendingUrl({ ...params, comment: 'needs a more specific term' })

    expect(url.startsWith('https://github.com/geneontology/go-ontology/issues/new?')).toBe(true)
    expect(issueFields(url).title).toBe(
      'Ontology term pending https://noctua.geneontology.org/editor/graph/gomodel:123'
    )
    expect(issueFields(url).body).toBe(
      `* CDK1
* protein kinase activity (GO:0004672)

needs a more specific term`
    )
  })
})

describe('commentTicket', () => {
  const ctx = {
    modelUrl: 'https://noctua.geneontology.org/editor/graph/gomodel:123',
    gene: 'CDK1',
    goTerm: 'protein kinase activity (GO:0004672)',
    statement: 'enabled by → ABCA14 Sscr',
    evidence: 'IDA · PMID:25415977',
    contributors: [],
    comment: 'see figure 2',
  }

  it('sends an annotation dispute and an evidence dispute to go-annotation', () => {
    expect(commentTicket('Ontology term annotation dispute', ctx)?.href).toContain(
      'go-annotation/issues/new'
    )
    expect(commentTicket('Evidence dispute', ctx)?.href).toContain('go-annotation/issues/new')
  })

  it('sends a pending ontology term to go-ontology', () => {
    expect(commentTicket('Ontology term pending', ctx)?.href).toContain('go-ontology/issues/new')
  })

  it('carries the comment into whichever ticket it builds', () => {
    for (const category of [
      'Ontology term annotation dispute',
      'Evidence dispute',
      'Ontology term pending',
    ]) {
      expect(issueFields(commentTicket(category, ctx)!.href).body).toContain('see figure 2')
    }
  })

  it('distinguishes the two disputes by wording, so a curator knows what they filed', () => {
    expect(commentTicket('Ontology term annotation dispute', ctx)?.ariaLabel).toBe(
      'File annotation dispute on GitHub'
    )
    expect(commentTicket('Evidence dispute', ctx)?.ariaLabel).toBe(
      'File evidence dispute on GitHub'
    )
    expect(commentTicket('Ontology term pending', ctx)?.ariaLabel).toBe(
      'Request ontology term on GitHub'
    )
  })

  it('offers no ticket for a category that does not escalate', () => {
    expect(commentTicket('General', ctx)).toBeNull()
    expect(commentTicket('Figure/Table', ctx)).toBeNull()
    expect(commentTicket('', ctx)).toBeNull()
  })
})
