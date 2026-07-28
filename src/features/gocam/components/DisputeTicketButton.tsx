import type React from 'react'
import { ActionIcon, Tooltip } from '@mantine/core'
import { FaGithub } from 'react-icons/fa'

/**
 * Opens the pre-filled go-annotation issue in a new tab so a curator can file an
 * "Annotation dispute" comment as a ticket (#231). Used both on the comment
 * thread in the panel and on the dispute comment row in the edit form.
 */
const DisputeTicketButton: React.FC<{ href: string }> = ({ href }) => (
  <Tooltip label="File this dispute on go-annotation" position="left" withArrow openDelay={300}>
    <ActionIcon
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="subtle"
      color="red"
      size="sm"
      onClick={e => e.stopPropagation()}
      aria-label="File annotation dispute on GitHub"
    >
      <FaGithub size={12} />
    </ActionIcon>
  </Tooltip>
)

export default DisputeTicketButton
