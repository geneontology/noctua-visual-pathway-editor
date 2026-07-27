import { describe, it, expect } from 'vitest'
import {
  COMMENT_CATEGORIES,
  INDIVIDUAL_COMMENT_CATEGORIES,
  REFERENCE_COMMENT_CATEGORIES,
  parseComment,
  formatComment,
  getCommentCategoryBadgeClass,
} from '@/features/gocam/data/commentCategories'

describe('parseComment', () => {
  it('splits a known category prefix from the text', () => {
    expect(parseComment('General: hello there')).toEqual({
      option: 'General',
      text: 'hello there',
    })
  })

  it('only splits on the first ": " so the body can contain colons', () => {
    expect(parseComment('Annotation dispute: ratio 1: 2 mismatch')).toEqual({
      option: 'Annotation dispute',
      text: 'ratio 1: 2 mismatch',
    })
  })

  it('leaves the option blank for text with no ": " separator', () => {
    expect(parseComment('a plain legacy comment')).toEqual({
      option: '',
      text: 'a plain legacy comment',
    })
  })

  it('leaves the option blank when the prefix is not a known category', () => {
    expect(parseComment('Unknown: something')).toEqual({
      option: '',
      text: 'Unknown: something',
    })
  })

  it('recognizes the individual-scope categories (#231)', () => {
    expect(parseComment('Ontology term pending: needs review')).toEqual({
      option: 'Ontology term pending',
      text: 'needs review',
    })
    expect(parseComment('Annotation dispute: disputed')).toEqual({
      option: 'Annotation dispute',
      text: 'disputed',
    })
  })

  it('recognizes the reference-scope categories (#231)', () => {
    expect(parseComment('Figure/Table: see figure 2')).toEqual({
      option: 'Figure/Table',
      text: 'see figure 2',
    })
    expect(parseComment('Evidence confidence: low')).toEqual({
      option: 'Evidence confidence',
      text: 'low',
    })
    expect(parseComment('Justification for evidence: reasoning here')).toEqual({
      option: 'Justification for evidence',
      text: 'reasoning here',
    })
  })

  it('handles an empty string', () => {
    expect(parseComment('')).toEqual({ option: '', text: '' })
  })
})

describe('formatComment', () => {
  it('joins option and text with a colon', () => {
    expect(formatComment({ option: 'General', text: 'hi' })).toBe('General: hi')
  })

  it('returns the text unchanged when there is no option', () => {
    expect(formatComment({ option: '', text: 'legacy note' })).toBe('legacy note')
  })
})

describe('parse/format round-trip', () => {
  it('round-trips every known category', () => {
    for (const category of COMMENT_CATEGORIES) {
      const stored = `${category}: some text`
      expect(formatComment(parseComment(stored))).toBe(stored)
    }
  })

  it('round-trips a legacy (blank-option) comment unchanged', () => {
    const legacy = 'legacy comment with no prefix'
    expect(formatComment(parseComment(legacy))).toBe(legacy)
  })

  it('round-trips the individual and reference categories (#231)', () => {
    for (const category of [...INDIVIDUAL_COMMENT_CATEGORIES, ...REFERENCE_COMMENT_CATEGORIES]) {
      const stored = `${category}: some text`
      expect(formatComment(parseComment(stored))).toBe(stored)
    }
  })
})

describe('getCommentCategoryBadgeClass', () => {
  it('returns a distinct class for each known category', () => {
    const classes = COMMENT_CATEGORIES.map(getCommentCategoryBadgeClass)
    expect(new Set(classes).size).toBe(COMMENT_CATEGORIES.length)
  })

  it('falls back to a default class for an unknown category', () => {
    expect(getCommentCategoryBadgeClass('Nope')).toContain('slate')
  })

  it('returns distinct classes for the individual and reference categories (#231)', () => {
    expect(getCommentCategoryBadgeClass('Ontology term pending')).toContain('purple')
    expect(getCommentCategoryBadgeClass('Figure/Table')).toContain('teal')
    expect(getCommentCategoryBadgeClass('Evidence confidence')).toContain('indigo')
    expect(getCommentCategoryBadgeClass('Justification for evidence')).toContain('green')
  })
})

describe('comment category lists (2026-07-23 GO-CAM call, #231)', () => {
  it('individual-level topics are ontology-pending, dispute, general', () => {
    expect(INDIVIDUAL_COMMENT_CATEGORIES).toEqual([
      'Ontology term pending',
      'Annotation dispute',
      'General',
    ])
  })

  it('reference-level topics are figure, confidence, justification, general', () => {
    expect(REFERENCE_COMMENT_CATEGORIES).toEqual([
      'Figure/Table',
      'Evidence confidence',
      'Justification for evidence',
      'General',
    ])
  })
})
