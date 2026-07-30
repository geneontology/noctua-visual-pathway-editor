import * as joint from 'jointjs'
import { getColor } from './colors'

// ── Colors ────────────────────────────────────────────────────────

const WRAPPER_STROKE = 'rgba(0,0,255,0.3)'
const LABEL_TEXT_FILL = '#333333'
const LINK_LABEL_COLOR = '#7c68fc'
const LINK_LINE_STROKE = '#005580'

// ── Constants ──────────────────────────────────────────────────────

const GRID_SIZE = 8
const PADDING_L = GRID_SIZE * 2
// Extra room reserved at the bottom for the comment icon + count row so the
// icon isn't clipped by the box edge / last entry.
const COMMENT_ROW_EXTRA = 6
const FONT_FAMILY = 'sans-serif'

const HEADER_ICON_SIZE = 30
const HEADER_HEIGHT = 40

export const LIST_GROUP_NAME = 'list'
const LIST_ITEM_HEIGHT = 35
export const LIST_ITEM_WIDTH = 200
const LIST_ITEM_GAP = 0

// ── Port item layout ──────────────────────────────────────────────

const itemPosition = (
  portsArgs: joint.dia.Element.Port[],
  elBBox: joint.dia.BBox
): joint.g.Point[] => {
  return portsArgs.map((_port, index, { length }) => {
    const bottom =
      elBBox.height - (LIST_ITEM_HEIGHT + 20) / 2 - GRID_SIZE - COMMENT_ROW_EXTRA
    const y = (length - 1 - index) * (LIST_ITEM_HEIGHT + LIST_ITEM_GAP)
    return new joint.g.Point(0, bottom - y)
  })
}

// ── Port item attributes ──────────────────────────────────────────

const itemAttributes = {
  attrs: {
    body: {
      width: 'calc(w)',
      height: 'calc(h)',
      x: '0',
      y: 'calc(-0.5*h)',
      fill: 'transparent',
      stroke: 'white',
      strokeWidth: 1,
    },
    relationship: {
      width: 60,
      pointerEvents: 'none',
      fontFamily: FONT_FAMILY,
      fontWeight: 400,
      fontSize: 9,
      fill: 'black',
      textAnchor: 'start',
      textVerticalAnchor: 'middle',
      textWrap: { width: 60, maxLineCount: 2, ellipsis: true },
      x: 8,
    },
    portLabel: {
      width: 100,
      pointerEvents: 'none',
      fontFamily: FONT_FAMILY,
      fontSize: 12,
      fill: 'black',
      textAnchor: 'start',
      textVerticalAnchor: 'middle',
      textWrap: { width: 140, maxLineCount: 2, ellipsis: true },
      x: 60,
    },
    noEvidence: {
      xlinkHref: './assets/icons/no-evidence.png',
      ref: 'body',
      x: 60,
      y: -8,
      height: 15,
      cursor: 'pointer',
      visibility: 'hidden',
    },
  },
  size: { width: LIST_ITEM_WIDTH, height: LIST_ITEM_HEIGHT },
  markup: [
    { tagName: 'rect', selector: 'body' },
    { tagName: 'text', selector: 'relationship' },
    { tagName: 'text', selector: 'portLabel' },
    { tagName: 'image', selector: 'noEvidence' },
  ],
}

// ── Header attributes (for NodeCellList) ──────────────────────────

const headerMarkup = [
  { tagName: 'rect', selector: 'wrapper' },
  { tagName: 'rect', selector: 'highlighter' },
  { tagName: 'rect', selector: 'body' },
  { tagName: 'text', selector: 'label' },
  { tagName: 'image', selector: 'icon' },
  { tagName: 'image', selector: 'commentIcon' },
  { tagName: 'text', selector: 'commentCount' },
  { tagName: 'image', selector: 'viewIcon' },
  { tagName: 'image', selector: 'editIcon' },
  { tagName: 'image', selector: 'duplicateIcon' },
  { tagName: 'image', selector: 'deleteIcon' },
]

const headerAttributes = {
  attrs: {
    root: { magnet: true },
    wrapper: {
      magnet: true,
      refWidth: '100%',
      refHeight: '100%',
      fill: 'transparent',
      stroke: 'rgba(0,0,255,0.3)',
      strokeWidth: 0,
    },
    highlighter: {
      refWidth: '100%',
      refHeight: '100%',
      fill: 'none',
      stroke: 'transparent',
      strokeWidth: 10,
    },
    body: {
      width: 'calc(w)',
      height: 'calc(h)',
    },
    icon: {
      width: HEADER_ICON_SIZE,
      height: HEADER_ICON_SIZE,
      x: 5,
      y: (HEADER_HEIGHT - HEADER_ICON_SIZE) / 2,
    },
    // Comment affordance in the empty bottom row — always present like a
    // social-media comment button, with the count next to it (Instagram style).
    // Click opens the Comments panel (#231).
    commentIcon: {
      event: 'element:comment:pointerdown',
      xlinkHref: './assets/icons/comment-grey.svg',
      ref: 'wrapper',
      refX: 0,
      x: 8,
      refY: '100%',
      y: -19,
      width: 14,
      height: 14,
      cursor: 'pointer',
    },
    commentCount: {
      event: 'element:comment:pointerdown',
      // Positioned wrapper-relative (like commentIcon) so it sits a few px to the
      // right of the 14px icon. commentIcon spans x: 8 → 22, so 26 leaves a 4px gap.
      ref: 'wrapper',
      refX: 0,
      x: 26,
      refY: '100%',
      y: -12,
      fontFamily: FONT_FAMILY,
      fontWeight: 600,
      fontSize: 12,
      fill: '#6b7280',
      textAnchor: 'start',
      textVerticalAnchor: 'middle',
      cursor: 'pointer',
      text: '0',
    },
    label: {
      x: 40,
      y: 15,
      fontFamily: FONT_FAMILY,
      fontWeight: 600,
      fontSize: 12,
      fill: 'black',
      text: 'Label',
      textWrap: { width: '90%', maxLineCount: 1, ellipsis: true },
      textVerticalAnchor: 'top',
    },
    // Read-only affordance: shown on hover only when not logged in, opens the
    // activity table for viewing (#278). Sits where the edit icon would be
    // (edit is hidden in read-only, so no overlap).
    viewIcon: {
      event: 'element:view:pointerdown',
      xlinkHref: './assets/icons/info.svg',
      ref: 'wrapper',
      refX: '100%',
      refX2: 5,
      y: 0,
      width: 20,
      height: 20,
      cursor: 'pointer',
      visibility: 'hidden',
    },
    editIcon: {
      event: 'element:edit:pointerdown',
      xlinkHref: './assets/icons/edit.svg',
      ref: 'wrapper',
      refX: '100%',
      refX2: 5,
      y: 0,
      width: 20,
      height: 20,
      cursor: 'pointer',
      visibility: 'hidden',
    },
    duplicateIcon: {
      event: 'element:duplicate:pointerdown',
      xlinkHref: './assets/icons/duplicate.svg',
      ref: 'wrapper',
      refX: '100%',
      refX2: 5,
      y: 30,
      width: 20,
      height: 20,
      cursor: 'pointer',
      visibility: 'hidden',
    },
    deleteIcon: {
      event: 'element:delete:pointerdown',
      xlinkHref: './assets/icons/delete.svg',
      ref: 'wrapper',
      refX: '100%',
      refX2: 5,
      y: 60,
      width: 20,
      height: 20,
      cursor: 'pointer',
      visibility: 'hidden',
    },
  },
  markup: headerMarkup,
}

// ── NodeCellList ──────────────────────────────────────────────────
// Port-based list element: header + dynamic entity rows.

export class NodeCellList extends joint.dia.Element {
  override defaults() {
    return {
      ...super.defaults,
      ...headerAttributes,
      type: 'noctua.NodeCellList',
      size: { width: LIST_ITEM_WIDTH, height: 0 },
      ports: {
        groups: {
          [LIST_GROUP_NAME]: {
            position: itemPosition,
            ...itemAttributes,
          },
        },
        items: [],
      },
    }
  }

  override initialize(...args: any[]) {
    this.on('change:ports', () => this.resizeToFitPorts())
    this.resizeToFitPorts()
    super.initialize.call(this, ...args)
  }

  resizeToFitPorts() {
    const { length } = this.getPorts()
    this.prop(
      ['size', 'height'],
      HEADER_HEIGHT +
      (LIST_ITEM_HEIGHT + LIST_ITEM_GAP) * length +
      PADDING_L +
      COMMENT_ROW_EXTRA
    )
  }

  // ── Service methods (ported from shapes.service.ts) ──

  addHeader(label: string) {
    this.attr('label/text', label)
  }

  addIcon(icon: string) {
    this.attr('icon/xlinkHref', icon)
  }

  addEntity(relationship: string, term: string, hasEvidence: boolean) {
    const attrs: Record<string, any> = {}

    if (relationship) {
      attrs.relationship = { text: relationship }
      attrs.portLabel = { text: term }
      if (!hasEvidence) {
        attrs.portLabel.x = 75
      }
    } else {
      attrs.relationship = { visibility: 'hidden' }
      attrs.portLabel = {
        text: term,
        x: hasEvidence ? 8 : 25,
        width: LIST_ITEM_WIDTH,
        textWrap: { width: LIST_ITEM_WIDTH - 16 },
      }
    }

    if (!hasEvidence) {
      attrs.noEvidence = { visibility: 'visible' }
      attrs.portLabel = {
        ...attrs.portLabel,
        textWrap: { width: LIST_ITEM_WIDTH - 50 },
      }
      if (!relationship) {
        attrs.noEvidence.x = 8
      }
    }

    this.addPort({ group: LIST_GROUP_NAME, attrs })
  }

  setColor(colorKey: string, _low?: number, high?: number): this {
    const light = getColor(colorKey, high ?? 100)
    if (light) this.attr('body/fill', light)
    return this
  }

  setCommentCount(count: number): this {
    // Greyish icon + count always show in the bottom row (Instagram style).
    this.attr('commentCount/text', String(count))
    return this
  }

  setBorder(colorKey: string, hue?: number): this {
    const deep = getColor(colorKey, hue ?? 500)
    if (deep) this.attr('highlighter/stroke', deep)
    return this
  }

  unsetBorder(): this {
    this.attr('highlighter/stroke', 'transparent')
    return this
  }

  hover(on: boolean, interactive = true): this {
    this.attr('wrapper/strokeWidth', on ? 40 : 0)
    const iconVis = on && interactive ? 'visible' : 'hidden'
    this.attr('editIcon/visibility', iconVis)
    this.attr('duplicateIcon/visibility', iconVis)
    this.attr('deleteIcon/visibility', iconVis)
    // Read-only: only the view icon appears on hover.
    this.attr('viewIcon/visibility', on && !interactive ? 'visible' : 'hidden')
    return this
  }
}

// ── NodeCellMolecule ──────────────────────────────────────────────

const NodeCellMoleculeDefaults = joint.dia.Element.define(
  'noctua.NodeCellMolecule',
  {
    attrs: {
      '.wrapper': {
        refCx: '50%',
        refCy: '50%',
        refR: '50%',
        magnet: true,
        fill: 'transparent',
        stroke: WRAPPER_STROKE,
      },
      '.circle': {
        refCx: '50%',
        refCy: '50%',
        refR: '50%',
        strokeWidth: 2,
      },
      '.label': {
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        refX: '50%',
        refY: '50%',
        fontSize: 12,
        fill: LABEL_TEXT_FILL,
        textWrap: { ellipsis: false, width: '95%' },
      },
      // Greyish comment icon + count at the bottom of the circle (Instagram
      // style), mirroring the box's bottom row. Always visible; click opens the
      // Comments panel (#231).
      '.comment': {
        event: 'element:comment:pointerdown',
        'xlink:href': './assets/icons/comment-grey.svg',
        ref: '.wrapper',
        refX: '50%',
        x: -16,
        refY: '100%',
        y: -24,
        height: 14,
        width: 14,
        cursor: 'pointer',
      },
      '.commentCount': {
        event: 'element:comment:pointerdown',
        // Positioned wrapper-relative (like .comment) so it sits just right of the
        // 14px icon. .comment spans center-16 → center-2, so center+1 leaves a 3px gap.
        ref: '.wrapper',
        refX: '50%',
        x: 1,
        refY: '100%',
        y: -17,
        fontFamily: FONT_FAMILY,
        fontWeight: 600,
        fontSize: 12,
        fill: '#6b7280',
        textAnchor: 'start',
        textVerticalAnchor: 'middle',
        cursor: 'pointer',
        text: '0',
      },
      '.view': {
        event: 'element:view:pointerdown',
        'xlink:href': './assets/icons/info.svg',
        ref: '.wrapper',
        refX: '100%',
        refX2: -10,
        y: 0,
        height: 20,
        width: 20,
        cursor: 'pointer',
        visibility: 'hidden',
      },
      '.edit': {
        event: 'element:edit:pointerdown',
        'xlink:href': './assets/icons/edit.svg',
        ref: '.wrapper',
        refX: '100%',
        refX2: -10,
        y: 0,
        height: 20,
        width: 20,
        cursor: 'pointer',
        visibility: 'hidden',
      },
      '.duplicate': {
        event: 'element:duplicate:pointerdown',
        'xlink:href': './assets/icons/duplicate.svg',
        ref: '.wrapper',
        refX: '100%',
        refX2: 5,
        y: 30,
        height: 20,
        width: 20,
        cursor: 'pointer',
        visibility: 'hidden',
      },
      '.delete': {
        event: 'element:delete:pointerdown',
        'xlink:href': './assets/icons/delete.svg',
        ref: '.wrapper',
        refX: '100%',
        refX2: 5,
        y: 60,
        height: 20,
        width: 20,
        cursor: 'pointer',
        visibility: 'hidden',
      },
    },
  },
  {
    markup: [
      '<circle class="wrapper"/>',
      '<g class="rotatable">',
      '<g class="scalable">',
      '<circle class="circle"/>',
      '</g>',
      '<text class="label"/>',
      '<image class="comment"/>',
      '<text class="commentCount"/>',
      '<image class="view"/>',
      '<image class="edit"/>',
      '<image class="duplicate"/>',
      '<image class="delete"/>',
      '</g>',
    ].join(''),
  }
)

export class NodeCellMolecule extends NodeCellMoleculeDefaults {
  setColor(colorKey: string, low?: number, high?: number): this {
    const deep = getColor(colorKey, low ?? 200)
    const light = getColor(colorKey, high ?? 100)
    if (deep) this.attr('.circle/stroke', deep)
    if (light) this.attr('.circle/fill', light)
    return this
  }

  setText(text: string): this {
    this.attr('.label/text', text)
    return this
  }

  setCommentCount(count: number): this {
    // Greyish icon + count always show at the bottom of the circle (Instagram style).
    this.attr('.commentCount/text', String(count))
    return this
  }

  hover(on: boolean, interactive = true): this {
    this.attr('.wrapper/strokeWidth', on ? 40 : 0)
    const iconVis = on && interactive ? 'visible' : 'hidden'
    this.attr('.edit/visibility', iconVis)
    this.attr('.duplicate/visibility', iconVis)
    this.attr('.delete/visibility', iconVis)
    // Read-only: only the view icon appears on hover.
    this.attr('.view/visibility', on && !interactive ? 'visible' : 'hidden')
    return this
  }
}

// ── NodeLink ──────────────────────────────────────────────────────

export class NodeLink extends joint.shapes.standard.Link {
  static create(): NodeLink {
    const link = new NodeLink()
    link.prop({
      z: -1,
      labels: [
        {
          markup: [
            { tagName: 'rect', selector: 'labelBody' },
            { tagName: 'image', selector: 'noEvidenceIcon' },
            { tagName: 'text', selector: 'labelText' },
          ],
          attrs: {
            labelText: {
              fill: LINK_LABEL_COLOR,
              fontSize: 8,
              fontFamily: 'sans-serif',
              textAnchor: 'middle',
              textVerticalAnchor: 'middle',
            },
            labelBody: {
              ref: 'labelText',
              refX: -5,
              refY: -5,
              refWidth: '100%',
              refHeight: '100%',
              refWidth2: 10,
              refHeight2: 10,
              stroke: LINK_LABEL_COLOR,
              fill: 'white',
              strokeWidth: 1,
              rx: 5,
              ry: 5,
            },
            noEvidenceIcon: {
              xlinkHref: './assets/icons/no-evidence.png',
              ref: 'labelText',
              refX: -15,
              refY: '50%',
              y: -6,
              width: 12,
              height: 12,
              visibility: 'hidden',
            },
          },
          position: {
            distance: 0.5,
            args: { ensureLegibility: true, absoluteOffset: true },
          },
        },
      ],
    })

    link.attr({
      line: {
        stroke: LINK_LINE_STROKE,
        strokeWidth: 1,
        strokeLinejoin: 'round',
        targetMarker: {
          type: 'path',
          stroke: 'black',
          fill: 'black',
          d: 'M 10 -5 0 0 10 5 Z',
        },
      },
    })

    link.router('normal')
    link.connector('smooth')

    return link
  }

  setText(text: string): this {
    this.label(0, { attrs: { labelText: { text } } })
    return this
  }

  setColor(colorKey: string): this {
    const deep = getColor(colorKey, 800)
    const light = getColor(colorKey, 600)
    const lineColor = light ?? colorKey
    const textColor = deep ?? colorKey

    this.attr('line/stroke', lineColor)
    this.attr('line/targetMarker/stroke', lineColor)
    this.attr('line/targetMarker/fill', lineColor)
    this.label(0, {
      attrs: {
        labelText: { fill: textColor },
        labelBody: { stroke: lineColor },
      },
    })
    return this
  }

  setNoEvidence(show: boolean): this {
    this.label(0, {
      attrs: {
        noEvidenceIcon: { visibility: show ? 'visible' : 'hidden' },
        labelBody: show
          ? { refX: -20, refWidth2: 25 }
          : { refX: -5, refWidth2: 10 },
      },
    })
    return this
  }

  hover(on: boolean): this {
    this.attr('line/strokeWidth', on ? 4 : 1)
    this.label(0, { attrs: { labelBody: { strokeWidth: on ? 2 : 1 } } })
    return this
  }
}

// ── Cell namespace for JointJS Graph/Paper ────────────────────────
// Combines built-in joint.shapes with our custom shapes. Passed to
// cellNamespace / cellViewNamespace so type strings resolve to classes.
// We build a fresh object instead of mutating joint.shapes — under
// Vite's production ESM bundling, joint.shapes is non-extensible.

export const cellNamespace = {
  ...joint.shapes,
  noctua: {
    NodeCellList,
    NodeCellMolecule,
    NodeLink,
  },
}
