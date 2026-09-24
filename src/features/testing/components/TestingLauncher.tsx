import type React from 'react'
import { useState } from 'react'
import { ActionIcon, Tooltip } from '@mantine/core'
import { IoFlaskOutline } from 'react-icons/io5'
import TestingPanel from './TestingPanel'

/** Opens the testing panel. `Layout` mounts it on dev builds only. */
const TestingLauncher: React.FC = () => {
  const [opened, setOpened] = useState(false)

  return (
    <>
      <Tooltip label="Testing tools" position="left" withArrow openDelay={300}>
        {/* index.css's `#root button` reset wipes Mantine's filled background. */}
        <ActionIcon
          className="bg-gray-800 text-white shadow-lg hover:bg-gray-700"
          variant="filled"
          color="dark"
          size="xl"
          radius="xl"
          aria-label="Testing tools"
          onClick={() => setOpened(true)}
        >
          <IoFlaskOutline className="text-xl" />
        </ActionIcon>
      </Tooltip>

      <TestingPanel opened={opened} onClose={() => setOpened(false)} />
    </>
  )
}

export default TestingLauncher
