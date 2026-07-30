import { describe, it, expect } from 'vitest'
import type { Contributor } from '@/features/users/models/contributor'
import {
  orcidId,
  formatCurator,
  buildAnnotationDisputeUrl,
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
      'Annotation dispute https://noctua.geneontology.org/editor/graph/gomodel:123'
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
