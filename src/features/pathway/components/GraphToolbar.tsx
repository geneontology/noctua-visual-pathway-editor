import { ActionIcon, Button, Menu, Tooltip } from '@mantine/core'
import {
  MdZoomIn as ZoomInIcon,
  MdZoomOut as ZoomOutIcon,
  MdYoutubeSearchedFor as ZoomResetIcon,
  MdArrowDropDown as ArrowDropDownIcon,
  MdAutoFixHigh as AutoLayoutIcon,
  MdContentCopy as CopyIcon,
  MdDeleteOutline as DeleteIcon,
  MdClose as ClearIcon,
} from 'react-icons/md'
import type { LayoutDetail, LayoutSpacing } from '../graph/camCanvas'
import { layoutDetailOptions, spacingOptions } from '../data/toolbarOptions'

interface GraphToolbarProps {
  layoutDetail: LayoutDetail
  spacing: LayoutSpacing
  onAutoLayout: () => void
  onLayoutDetailChange: (detail: LayoutDetail) => void
  onSpacingChange: (spacing: LayoutSpacing) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  /** Number of activities in the canvas multi-selection (#114). */
  selectionCount?: number
  onClearSelection?: () => void
  onCopySelection?: () => void
  onDeleteSelection?: () => void
  /** False when not logged in — hides the editing actions. */
  canEdit?: boolean
}

export default function GraphToolbar({
  layoutDetail,
  spacing,
  onAutoLayout,
  onLayoutDetailChange,
  onSpacingChange,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  selectionCount = 0,
  onClearSelection,
  onCopySelection,
  onDeleteSelection,
  canEdit = true,
}: GraphToolbarProps) {
  const currentDetail = layoutDetailOptions.find(o => o.id === layoutDetail)?.label ?? 'Detailed'
  const currentSpacing = spacingOptions.find(o => o.id === spacing)?.label ?? 'Compact'

  return (
    <div className="flex h-11 w-full items-center gap-3 border-b border-gray-200 bg-white px-4 shadow-sm">
      <Tooltip label="Re-arrange activities automatically" withArrow position="bottom">
        <Button
          variant="light"
          size="xs"
          radius="xl"
          onClick={onAutoLayout}
          leftSection={<AutoLayoutIcon size={14} />}
          className="!h-7 !px-3 !text-xs !normal-case"
        >
          Auto Layout
        </Button>
      </Tooltip>

      <PillMenu
        label="Detail"
        current={currentDetail}
        options={layoutDetailOptions}
        active={layoutDetail}
        onChange={onLayoutDetailChange}
      />

      <PillMenu
        label="Spacing"
        current={currentSpacing}
        options={spacingOptions}
        active={spacing}
        onChange={onSpacingChange}
      />

      {selectionCount > 0 && (
        <div className="ml-auto flex items-center gap-1 rounded-full bg-blue-50 py-1 pr-1 pl-3">
          <span className="mr-1 text-xs font-semibold whitespace-nowrap text-blue-900">
            {selectionCount} selected
          </span>

          {canEdit && (
            <>
              <Tooltip label="Copy selection (Ctrl+C)" withArrow position="bottom">
                <Button
                  variant="subtle"
                  size="compact-xs"
                  radius="xl"
                  onClick={onCopySelection}
                  leftSection={<CopyIcon size={14} />}
                  className="!text-xs !text-blue-800 hover:!bg-blue-100"
                >
                  Copy
                </Button>
              </Tooltip>
              <Tooltip label="Delete selected activities" withArrow position="bottom">
                <Button
                  variant="subtle"
                  size="compact-xs"
                  radius="xl"
                  color="red"
                  onClick={onDeleteSelection}
                  leftSection={<DeleteIcon size={14} />}
                  className="!text-xs !text-red-700 hover:!bg-red-50"
                >
                  Delete
                </Button>
              </Tooltip>
              <span className="mx-1 h-4 w-px bg-blue-200" />
            </>
          )}

          <Tooltip label="Clear selection (Esc)" withArrow position="bottom">
            <ActionIcon
              variant="subtle"
              size="sm"
              radius="xl"
              onClick={onClearSelection}
              aria-label="Clear selection"
              className="!text-blue-800 hover:!bg-blue-100"
            >
              <ClearIcon size={14} />
            </ActionIcon>
          </Tooltip>
        </div>
      )}

      <div
        className={`flex items-center gap-1 rounded-full bg-gray-100 p-0.5 ${selectionCount > 0 ? '' : 'ml-auto'}`}
      >
        <Tooltip label="Zoom out" withArrow position="bottom">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            radius="xl"
            onClick={onZoomOut}
            className="!text-gray-700 hover:!bg-white hover:!text-gray-900 hover:!shadow-xs"
          >
            <ZoomOutIcon size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Reset zoom" withArrow position="bottom">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            radius="xl"
            onClick={onZoomReset}
            className="!text-gray-700 hover:!bg-white hover:!text-gray-900 hover:!shadow-xs"
          >
            <ZoomResetIcon size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Zoom in" withArrow position="bottom">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            radius="xl"
            onClick={onZoomIn}
            className="!text-gray-700 hover:!bg-white hover:!text-gray-900 hover:!shadow-xs"
          >
            <ZoomInIcon size={18} />
          </ActionIcon>
        </Tooltip>
      </div>
    </div>
  )
}

interface PillMenuProps<T extends string> {
  label: string
  current: string
  options: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}

function PillMenu<T extends string>({
  label,
  current,
  options,
  active,
  onChange,
}: PillMenuProps<T>) {
  return (
    <Menu shadow="md" position="bottom-start" withinPortal radius="md">
      <Menu.Target>
        <button
          type="button"
          className="flex h-7 items-center gap-1.5 rounded-full bg-gray-100 px-3 text-xs transition-colors hover:bg-gray-200"
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
            {label}
          </span>
          <span className="text-gray-800">{current}</span>
          <ArrowDropDownIcon size={16} className="text-gray-500" />
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        {options.map(opt => (
          <Menu.Item
            key={opt.id}
            className={opt.id === active ? '!bg-primary-50 !font-medium' : ''}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}
